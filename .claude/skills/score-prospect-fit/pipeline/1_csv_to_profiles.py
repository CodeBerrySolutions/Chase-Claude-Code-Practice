#!/usr/bin/env python3
"""Step 1 — scraped CSV -> profiles.json for the link reader.

Splits each row's `ext_urls` (space-separated) into a `links` array. Skips
private accounts (they can't be read anyway) unless --all is passed.

Usage:  python3 1_csv_to_profiles.py profiles.csv > profiles.json
"""
import csv, json, sys

def main():
    if len(sys.argv) < 2:
        sys.exit("usage: 1_csv_to_profiles.py profiles.csv [--all] > profiles.json")
    path = sys.argv[1]
    keep_private = "--all" in sys.argv[2:]
    out = []
    with open(path, newline="") as f:
        for x in csv.DictReader(f):
            if str(x.get("private", "")).strip().lower() == "true" and not keep_private:
                continue
            links = [u for u in (x.get("ext_urls", "") or "").split() if u.startswith("http")]
            out.append({"username": x["username"], "links": links})
    json.dump(out, sys.stdout, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()
