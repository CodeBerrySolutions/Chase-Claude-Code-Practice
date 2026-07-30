#!/usr/bin/env python3
"""Step 2 — pages.json (from link-reader) -> offers.json.

Heuristic first pass at `offer_type` from the link-in-bio page text, applying
the same offer gate the skill uses (tier-rubric.md, Gate 2). This is a keyword
classifier — a cheap approximation. Anything it isn't sure about comes back
`unknown` (-> offer_unconfirmed), so a human/LLM can still make the final call
without the classifier ever forcing a wrong reject.

Usage:  python3 2_classify_offers.py pages.json > offers.json
"""
import json, re, sys

SERVICE = [r"\b1[:\- ]?on[:\- ]?1\b", r"\b1:1\b", r"coaching", r"\bcoach with\b",
           r"mastermind", r"group program", r"group coaching", r"cohort",
           r"\bapply\b", r"book a call", r"work with me", r"discovery call",
           r"mentorship", r"1:1 coaching"]
PRODUCT = [r"add to cart", r"\bshop\b", r"buy now", r"\bebook\b", r"e-book",
           r"self[- ]paced", r"self[- ]study", r"\bdownload\b", r"digital download",
           r"\btemplate", r"\bpreset", r"\bmerch\b", r"checkout", r"add to bag",
           r"self[- ]guided"]
# hard ICP exclusions (procedure / performed craft / physical) -> product_only,
# and these DOMINATE service cues (a "consultation" for injectables is still a
# procedure, not offloadable coaching).
EXCLUDE = [r"injectabl", r"\bbotox\b", r"\bfiller", r"\bpilates\b", r"class schedule",
           r"book (a|your) (appointment|session)", r"studio schedule", r"our services",
           r"portfolio", r"photography packages", r"wedding collections",
           r"\bfacial", r"\bmassage", r"\bhaircut", r"\bmanicure"]

def hits(text, pats):
    t = text.lower()
    return sorted({p for p in pats if re.search(p, t)})

def classify(text):
    if not text.strip():
        return "unknown", 0.0, []
    svc, prod, exc = hits(text, SERVICE), hits(text, PRODUCT), hits(text, EXCLUDE)
    matched = {"service": svc, "product": prod, "exclude": exc}
    if exc:
        return "product_only", 0.75, matched         # procedural/craft/physical DOMINATES
    if svc and prod:
        return "mixed", 0.6, matched
    if svc:
        return "service", 0.7, matched
    if prod:
        return "product_only", 0.6, matched
    return "unknown", 0.2, matched

def main():
    if len(sys.argv) < 2:
        sys.exit("usage: 2_classify_offers.py pages.json > offers.json")
    pages = json.load(open(sys.argv[1]))
    out = []
    for p in pages:
        texts = [r.get("text", "") for r in p.get("results", []) if r.get("ok")]
        blob = "\n".join(texts)
        ot, conf, matched = classify(blob)
        read_ok = any(r.get("ok") for r in p.get("results", []))
        if not read_ok:
            ot, conf = "unknown", 0.0                 # couldn't read any link
        out.append({"username": p["username"], "offer_type": ot,
                    "confidence": conf, "matched": matched, "read_ok": read_ok})
    json.dump(out, sys.stdout, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()
