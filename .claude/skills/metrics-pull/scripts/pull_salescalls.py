#!/usr/bin/env python3
"""
pull_salescalls.py — cockpit metric: sales calls booked this week (GoHighLevel).

Source:  ghl
Metric:  sales_calls_week   (cockpit CARD key -> "ghl:sales_calls_week")

Counts appointments on your GHL sales calendar from Monday 00:00 (local) to now.
Zero external dependencies (stdlib only) so it runs anywhere Python 3.11+ is.

--------------------------------------------------------------------------------
SETUP (do this once, on your machine — NOT committed to git):

  Add to ~/.claude/.env   (the TOKEN is a secret; the IDs are not, but keep them here too)
      GHL_API_KEY=pit-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      GHL_LOCATION_ID=pDUAU2PcdWhEkcZ2j6sM
      GHL_SALES_CALENDAR_ID=CTqyAV6ULsvq7QoDlRZU

  Then:  python pull_salescalls.py            # normal run, appends a metric row
         python pull_salescalls.py --debug    # prints the full request + response

--------------------------------------------------------------------------------
TO CONFORM TO THE COMPANION-REPO PATTERN (optional, later):
  This script writes the CSV / snapshot itself so it's self-contained. Once you've
  copied the repo's `_common.py` into this folder, you can replace `write_metric()`
  below with the shared helper so every metric writes identically:
      from _common import append_metric, update_snapshot
  Nothing else needs to change.
--------------------------------------------------------------------------------
"""

import json
import os
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timedelta
from pathlib import Path

SOURCE = "ghl"
METRIC = "sales_calls_week"

# Appointment statuses that count as a "sales call". Tune to taste:
#   drop "booked" if you only want calls that actually happened,
#   or add "noshow" if a no-show still counts as a call you ran.
COUNTED_STATUSES = {"booked", "confirmed", "showed"}

GHL_BASE = "https://services.leadconnectorhq.com"
GHL_API_VERSION = "2021-04-15"  # GHL versions its API by this date header

# Non-secret identifiers may live in-code as defaults; env always wins.
DEFAULT_LOCATION_ID = "pDUAU2PcdWhEkcZ2j6sM"
DEFAULT_CALENDAR_ID = "CTqyAV6ULsvq7QoDlRZU"


# ---------------------------------------------------------------- env / vault
def load_dotenv() -> None:
    """Load ~/.claude/.env into os.environ (does not override real env vars)."""
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
    """Same resolution order the runner + hook use."""
    val = os.environ.get("AGENTIC_OS_VAULT")
    if val:
        return Path(val).expanduser()
    return Path.home() / "the-vault"


# ---------------------------------------------------------------- time window
def week_window_ms() -> tuple[int, int]:
    """Monday 00:00 local -> now, as epoch milliseconds."""
    now = datetime.now()
    monday = (now - timedelta(days=now.weekday())).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    return int(monday.timestamp() * 1000), int(now.timestamp() * 1000)


# ---------------------------------------------------------------- GHL call
def fetch_events(token: str, location_id: str, calendar_id: str,
                 start_ms: int, end_ms: int, debug: bool) -> list[dict]:
    params = {
        "locationId": location_id,
        "calendarId": calendar_id,
        "startTime": str(start_ms),
        "endTime": str(end_ms),
    }
    url = f"{GHL_BASE}/calendars/events?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, method="GET")
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Version", GHL_API_VERSION)
    req.add_header("Accept", "application/json")

    if debug:
        print(f"[debug] GET {url}", file=sys.stderr)
        print(f"[debug] Version: {GHL_API_VERSION}", file=sys.stderr)

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "replace")
        raise RuntimeError(
            f"GHL returned HTTP {e.code}. Body:\n{detail}\n"
            f"Common fixes: 401 -> token wrong/expired; "
            f"403 -> token missing calendars scope; "
            f"400 -> check the 'Version' header or startTime/endTime (must be epoch ms); "
            f"404 -> wrong calendarId/locationId."
        ) from None
    except urllib.error.URLError as e:
        raise RuntimeError(f"Network error reaching GHL: {e.reason}") from None

    if debug:
        print(f"[debug] raw response:\n{body}", file=sys.stderr)

    data = json.loads(body)
    # GHL has returned the array under 'events' historically; accept a couple shapes.
    if isinstance(data, dict):
        return data.get("events") or data.get("data") or []
    if isinstance(data, list):
        return data
    return []


def count_sales_calls(events: list[dict]) -> int:
    n = 0
    for ev in events:
        status = str(ev.get("appointmentStatus", "")).lower()
        if status in COUNTED_STATUSES:
            n += 1
    return n


# ---------------------------------------------------------------- writers
def write_metric(value, status: str, error: str = "") -> None:
    """Append a row to metrics.csv and update last-pull.json. Self-contained.

    Swap this body for the repo's _common.append_metric/update_snapshot later
    if you want every metric script writing through one helper.
    """
    root = vault_root()
    metrics_dir = root / "system" / "metrics"
    metrics_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.now().isoformat(timespec="seconds")

    # append-only CSV; write header if brand new
    csv_path = metrics_dir / "metrics.csv"
    new_file = not csv_path.exists()
    with csv_path.open("a", encoding="utf-8") as f:
        if new_file:
            f.write("ts,source,metric,value,status\n")
        f.write(f"{ts},{SOURCE},{METRIC},{value if value is not None else ''},{status}\n")

    # last-pull snapshot, keyed by source
    snap_path = metrics_dir / "last-pull.json"
    snap = {}
    if snap_path.exists():
        try:
            snap = json.loads(snap_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            snap = {}
    entry = {"metric": METRIC, "value": value, "status": status, "ts": ts}
    if error:
        entry["error"] = error
    snap[SOURCE] = entry
    snap_path.write_text(json.dumps(snap, indent=2), encoding="utf-8")


# ---------------------------------------------------------------- main
def main() -> int:
    debug = "--debug" in sys.argv
    load_dotenv()

    token = os.environ.get("GHL_API_KEY", "").strip()
    location_id = os.environ.get("GHL_LOCATION_ID", DEFAULT_LOCATION_ID).strip()
    calendar_id = os.environ.get("GHL_SALES_CALENDAR_ID", DEFAULT_CALENDAR_ID).strip()

    if not token:
        msg = "GHL_API_KEY not set (add it to ~/.claude/.env)"
        print(f"[error] {msg}", file=sys.stderr)
        write_metric(None, "error", msg)
        return 1

    start_ms, end_ms = week_window_ms()
    if debug:
        print(f"[debug] window ms: {start_ms} -> {end_ms}", file=sys.stderr)

    try:
        events = fetch_events(token, location_id, calendar_id, start_ms, end_ms, debug)
        value = count_sales_calls(events)
    except RuntimeError as e:
        print(f"[error] {e}", file=sys.stderr)
        write_metric(None, "error", str(e).splitlines()[0])
        return 1

    write_metric(value, "ok")
    print(f"[ok] {SOURCE}:{METRIC} = {value}  ({len(events)} events in window)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
