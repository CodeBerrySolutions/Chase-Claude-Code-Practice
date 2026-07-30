#!/usr/bin/env bash
# End-to-end: scraped CSV -> re-scored roster, reading the real offer behind each
# link-in-bio via a real Chrome on port 9222.
#
# PREP (once): start Chrome with remote debugging and keep it open —
#   google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/pf-chrome &
#
# USAGE:  ./run.sh path/to/profiles.csv [YYYY-MM-DD]
# OUTPUT: out/scored.json  (+ intermediate out/profiles.json, out/pages.json, out/offers.json)
set -euo pipefail
cd "$(dirname "$0")"

CSV="${1:?usage: ./run.sh profiles.csv [today YYYY-MM-DD]}"
TODAY="${2:-$(date +%F)}"
OUT=out; mkdir -p "$OUT"
export NODE_PATH="${NODE_PATH:-$(npm root -g)}"

echo "[1/4] CSV -> profiles.json"
python3 1_csv_to_profiles.py "$CSV" > "$OUT/profiles.json"

echo "[2/4] profiles.json -> pages.json  (real Chrome on :9222)"
if node ../link-reader/read-links.mjs "$OUT/profiles.json" > "$OUT/pages.json" 2> "$OUT/read.log"; then
  echo "      $(grep -c '"ok": true' "$OUT/pages.json" || true) link(s) read; see $OUT/read.log"
else
  echo "      link reader failed (is Chrome on :9222?). Continuing with empty pages." >&2
  echo "[]" > "$OUT/pages.json"
fi

echo "[3/4] pages.json -> offers.json  (offer_type classification)"
python3 2_classify_offers.py "$OUT/pages.json" > "$OUT/offers.json"

echo "[4/5] CSV + offers.json -> scored.json"
python3 3_score.py "$CSV" "$OUT/offers.json" --today "$TODAY" > "$OUT/scored.json"

echo "[5/5] scored.json -> review console"
python3 4_build_console.py "$OUT/scored.json" --csv "$CSV" -o "$OUT/fit-review.html" \
  --source "$(basename "$CSV")"

echo "Done -> $OUT/scored.json  and  $OUT/fit-review.html"
