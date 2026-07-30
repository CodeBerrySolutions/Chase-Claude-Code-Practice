#!/usr/bin/env python3
"""Step 3 — scored roster. CSV (+ optional offers.json) -> scored.json.

Executable form of the v2 rubric (SKILL.md / tier-rubric.md). When offers.json
is present, offer_type drives the offer gate; otherwise it falls back to bio
inference and leans on needs_review. Mechanical gates only — off-niche / no-offer
nuance is deliberately left to human review + calibration-examples.md.

Usage:
  python3 3_score.py profiles.csv [offers.json] [--today YYYY-MM-DD] > scored.json
"""
import csv, json, sys, re, datetime

A_LO, A_HI, MEGA, STALE = 2000, 48000, 150000, 90
SVC_CTA = re.compile(r"\b(book a call|work with me|1:1|1-1|coaching|mastermind|"
                     r"group program|apply|dm (me )?(coach|ready)|free (call|consult)|"
                     r"consult|cohort|mentorship)\b", re.I)

def as_int(v):
    try: return int(v)
    except: return None

def days_since(d, today):
    try:
        y, m, dd = map(int, d.split("-"))
        return (today - datetime.date(y, m, dd)).days
    except: return None

def score(row, offer_type, today):
    f = as_int(row.get("followers"))
    bio = row.get("bio") or ""
    priv = str(row.get("private", "")).strip().lower() == "true"
    ds = days_since(row.get("last_post", ""), today)

    out = {"username": row["username"], "followers": f,
           "offer_type": offer_type or "", "needs_review": "no"}

    # Gate 1 — private
    if priv:
        return {**out, "tier": "C_private", "priority": "-", "reason": "private", "needs_review": "no"}

    # Gate 2 — offer gate (three-state)
    if offer_type == "product_only":
        return {**out, "tier": "D_fail", "priority": "-", "reason": "no_serviceable_offer"}
    if offer_type in ("service", "mixed"):
        service_state = "confirmed"
    else:  # unknown / absent -> infer from bio, default unconfirmed
        service_state = "confirmed" if SVC_CTA.search(bio) else "unconfirmed"
        if service_state == "unconfirmed":
            out["needs_review"] = "yes"

    # Gate 3 — mega reach
    if f is not None and f > MEGA:
        return {**out, "tier": "D_fail", "priority": "-", "reason": "mega_reach"}
    if f is None or f == 0:
        return {**out, "tier": "D_fail", "priority": "-", "reason": "no_offer"}

    # Gate 4 — inactive
    if ds is None or ds > STALE:
        return {**out, "tier": "B_inactive", "priority": "Nurture", "reason": "inactive"}

    # Gate 5/6 — band
    if A_LO <= f <= A_HI:
        tier, reason = "A_qualified", ("qualified" if service_state == "confirmed" else "offer_unconfirmed")
    else:
        tier, reason = "B_band_edge", "band_edge"

    # priority
    if tier == "A_qualified" and service_state == "confirmed":
        prio = "High"
    elif tier == "B_band_edge" and f < A_LO:
        prio = "Nurture"
    else:
        prio = "Low"
    return {**out, "tier": tier, "priority": prio, "reason": reason}

def main():
    args = [a for a in sys.argv[1:]]
    today = datetime.date.today()
    if "--today" in args:
        i = args.index("--today"); today = datetime.date.fromisoformat(args[i+1]); del args[i:i+2]
    if not args:
        sys.exit("usage: 3_score.py profiles.csv [offers.json] [--today YYYY-MM-DD] > scored.json")
    csv_path = args[0]
    offers = {}
    if len(args) > 1:
        for o in json.load(open(args[1])):
            offers[o["username"]] = o.get("offer_type")
    rows = list(csv.DictReader(open(csv_path, newline="")))
    scored = [score(r, offers.get(r["username"]), today) for r in rows]
    json.dump(scored, sys.stdout, ensure_ascii=False, indent=2)
    # summary to stderr
    from collections import Counter
    print("tiers:", dict(Counter(s["tier"] for s in scored)),
          "| needs_review:", sum(1 for s in scored if s["needs_review"] == "yes"),
          "| offer_type used:", sum(1 for s in scored if s["offer_type"]), file=sys.stderr)

if __name__ == "__main__":
    main()
