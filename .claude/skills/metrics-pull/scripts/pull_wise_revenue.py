#!/usr/bin/env python3
"""
pull_wise_revenue.py — cockpit metric: customer revenue received via Wise.

Source:  wise
Metrics: wise:revenue_mtd    (this calendar month to date)
         wise:revenue_30d    (trailing 30 days)
         wise:revenue_total  (all rows in the file)
Pick whichever key you want on the cockpit card (Phase 11 CARDS array).

This is the `local` archetype: it parses a Wise "transaction history" CSV
export instead of hitting the Wise API. Wise gates statement reads behind
SCA request-signing, so a periodic CSV export is far less plumbing. To
automate later, swap fetch step for the signed API and keep the filter below.

--------------------------------------------------------------------------------
THE LOAD-BEARING FILTER — read this before trusting the number:

  Wise "IN" rows include BOTH real customer payments AND you topping up your
  own account ("Money added" from your personal name). Summing all inbound
  overstates revenue massively. Revenue = inbound where the SENDER is a real
  customer, i.e. NOT one of OWNER_ALIASES below. Keep that list current when
  you add accounts/entities, or self-transfers will leak in as "revenue".
--------------------------------------------------------------------------------
SETUP (on your machine):
  1. Wise -> download transaction history as CSV.
  2. Drop it in the folder below (default: <vault>/inbox/wise/). Newest wins.
  3. python pull_wise_revenue.py            # append metric rows
     python pull_wise_revenue.py --debug    # show every row's include/exclude
  Override the folder with WISE_CSV_DIR in ~/.claude/.env if you prefer.
--------------------------------------------------------------------------------
"""

import csv
import json
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

SOURCE = "wise"

# Senders that are YOU, not customers. Lowercased, compared exact after strip.
# Add every alias Wise shows for your own top-ups / inter-entity moves.
OWNER_ALIASES = {
    "philip m delude",
    "philip mccullough delude",
    "s & w island group llc",
}


# ---------------------------------------------------------------- env / vault
def load_dotenv() -> None:
    env_path = Path.home() / ".claude" / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        os.environ.setdefault(key.strip(), val.strip())


def vault_root() -> Path:
    val = os.environ.get("AGENTIC_OS_VAULT")
    return Path(val).expanduser() if val else Path.home() / "the-vault"


def csv_dir() -> Path:
    val = os.environ.get("WISE_CSV_DIR")
    return Path(val).expanduser() if val else vault_root() / "inbox" / "wise"


def newest_csv(folder: Path) -> Path | None:
    files = sorted(folder.glob("*.csv"), key=lambda p: p.stat().st_mtime, reverse=True)
    return files[0] if files else None


# ---------------------------------------------------------------- parse
def parse_date(row: dict) -> datetime | None:
    raw = (row.get("Created on") or row.get("Finished on") or "").strip()
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(raw[: len(fmt) + 2], fmt)
        except ValueError:
            continue
    return None


def is_customer_revenue(row: dict) -> bool:
    if row.get("Status", "").strip().upper() != "COMPLETED":
        return False
    if row.get("Direction", "").strip().upper() != "IN":
        return False
    sender = row.get("Source name", "").strip().lower()
    if not sender or sender in OWNER_ALIASES:
        return False
    return True


def load_revenue_rows(path: Path, debug: bool) -> list[tuple[datetime, float, str, str]]:
    out = []
    with path.open(encoding="utf-8-sig", newline="") as f:
        for row in csv.DictReader(f):
            keep = is_customer_revenue(row)
            if debug:
                tag = "KEEP " if keep else "skip "
                print(f"[debug] {tag} {row.get('Created on','')[:10]} "
                      f"{row.get('Target amount (after fees)',''):>10} "
                      f"{row.get('Target currency','')} <- {row.get('Source name','')}",
                      file=sys.stderr)
            if not keep:
                continue
            dt = parse_date(row)
            if dt is None:
                continue
            try:
                amt = float(row.get("Target amount (after fees)", "") or 0)
            except ValueError:
                continue
            cur = row.get("Target currency", "").strip() or "?"
            out.append((dt, amt, cur, row.get("Source name", "").strip()))
    return out


def sum_by_currency(rows) -> dict[str, float]:
    totals: dict[str, float] = {}
    for _dt, amt, cur, _who in rows:
        totals[cur] = round(totals.get(cur, 0.0) + amt, 2)
    return totals


def primary(totals: dict[str, float]) -> tuple[str, float]:
    """Currency with the largest total; ('none', 0.0) if empty."""
    if not totals:
        return "none", 0.0
    cur = max(totals, key=lambda c: totals[c])
    return cur, totals[cur]


# ---------------------------------------------------------------- writer
def write_metric(metric: str, value, status: str, note: str = "") -> None:
    root = vault_root()
    metrics_dir = root / "system" / "metrics"
    metrics_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.now().isoformat(timespec="seconds")

    csv_path = metrics_dir / "metrics.csv"
    new_file = not csv_path.exists()
    with csv_path.open("a", encoding="utf-8") as f:
        if new_file:
            f.write("ts,source,metric,value,status\n")
        f.write(f"{ts},{SOURCE},{metric},{value if value is not None else ''},{status}\n")

    snap_path = metrics_dir / "last-pull.json"
    snap = {}
    if snap_path.exists():
        try:
            snap = json.loads(snap_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            snap = {}
    entry = snap.get(SOURCE, {})
    entry.setdefault("metrics", {})
    entry["metrics"][metric] = {"value": value, "status": status, "ts": ts}
    if note:
        entry["metrics"][metric]["note"] = note
    entry["status"] = status
    entry["ts"] = ts
    snap[SOURCE] = entry
    snap_path.write_text(json.dumps(snap, indent=2), encoding="utf-8")


# ---------------------------------------------------------------- main
def main() -> int:
    debug = "--debug" in sys.argv
    load_dotenv()

    folder = csv_dir()
    path = newest_csv(folder)
    if path is None:
        msg = f"no CSV in {folder} (export Wise history there)"
        print(f"[error] {msg}", file=sys.stderr)
        for m in ("revenue_mtd", "revenue_30d", "revenue_total"):
            write_metric(m, None, "error", msg)
        return 1

    rows = load_revenue_rows(path, debug)
    now = datetime.now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    d30_start = now - timedelta(days=30)

    windows = {
        "revenue_mtd": [r for r in rows if r[0] >= month_start],
        "revenue_30d": [r for r in rows if r[0] >= d30_start],
        "revenue_total": rows,
    }

    print(f"[ok] parsed {path.name}: {len(rows)} customer-revenue rows")
    for metric, subset in windows.items():
        totals = sum_by_currency(subset)
        cur, val = primary(totals)
        note = "; ".join(f"{c}:{v}" for c, v in sorted(totals.items())) or "no rows"
        write_metric(metric, val, "ok", f"{cur} | {note}")
        print(f"  {SOURCE}:{metric} = {val} {cur}   ({note})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
