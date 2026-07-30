#!/usr/bin/env python3
"""Step 4 — scored.json (+ CSV for display fields) -> review console HTML.

Renders the interactive review console (verdict + why per prospect, saved
progress, export) from a scored roster, so every pipeline run produces a fresh
console. Counts are computed from the data, so the roster can be any size.

Usage:
  python3 4_build_console.py scored.json --csv profiles.csv -o out/fit-review.html
                              [--include-rejects] [--source LABEL]
"""
import csv, json, sys, argparse, os

FITS = {"A_qualified", "B_band_edge", "B_inactive"}
PORD = {"High": 0, "Low": 1, "Nurture": 2, "Rejected": 3}
TORD = {"A_qualified": 0, "B_band_edge": 1, "B_inactive": 2, "D_fail": 3}

def as_int(v):
    try: return int(v)
    except: return 0

def why_of(s, f):
    if s.get("why"): return s["why"]
    r = s.get("reason", "")
    ot = s.get("offer_type", "")
    bits = [r] + ([f"{f:,} followers"] if f else []) + ([f"offer={ot}"] if ot else [])
    return " · ".join(bits)

def main():
    p = argparse.ArgumentParser()
    p.add_argument("scored")
    p.add_argument("--csv", help="scraped CSV for full_name/bio/comment/etc.")
    p.add_argument("-o", "--out", default="out/fit-review.html")
    p.add_argument("--include-rejects", action="store_true",
                   help="also show D_fail rows (as a Rejected group) to spot-check false rejects")
    p.add_argument("--source", default="pipeline scored.json", help="footer source label")
    a = p.parse_args()

    scored = json.load(open(a.scored))
    meta = {}
    if a.csv:
        for r in csv.DictReader(open(a.csv, newline="")):
            meta[r["username"]] = r

    recs = []
    for s in scored:
        tier = s.get("tier")
        keep = tier in FITS or (a.include_rejects and tier == "D_fail")
        if not keep:
            continue
        m = meta.get(s["username"], {})
        f = as_int(s.get("followers") or m.get("followers"))
        priority = s.get("priority", "Low")
        if tier == "D_fail":
            priority = "Rejected"
        recs.append(dict(
            username=s["username"], full_name=m.get("full_name", ""), followers=f,
            tier=tier, icp=s.get("icp", m.get("icp_flag", "")),
            last_post=m.get("last_post", ""), bio=m.get("bio", ""),
            comment=m.get("best_comment", ""), seeds=m.get("seeds", ""),
            category=m.get("biz_category", ""), why=why_of(s, f),
            reason=s.get("reason", ""), priority=priority,
            needs_review=s.get("needs_review", "no")))

    recs.sort(key=lambda r: (PORD.get(r["priority"], 9), TORD.get(r["tier"], 9), -r["followers"]))

    tmpl_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "console_template.html")
    tmpl = open(tmpl_path).read()
    html = tmpl.replace("__DATA__", json.dumps(recs, ensure_ascii=False)).replace("__SOURCE__", a.source)

    os.makedirs(os.path.dirname(a.out) or ".", exist_ok=True)
    open(a.out, "w").write(html)
    from collections import Counter
    print(f"wrote {a.out}: {len(recs)} cards | priority {dict(Counter(r['priority'] for r in recs))}",
          file=sys.stderr)

if __name__ == "__main__":
    main()
