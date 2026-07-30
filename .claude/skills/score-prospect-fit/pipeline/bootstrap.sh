#!/usr/bin/env bash
# One-command setup + run for the score-prospect-fit pipeline.
# Checks prereqs, installs Playwright, launches a real Chrome on :9222 (so the
# link reader defeats Linktree/Stan bot-blocks), then runs the full pipeline.
#
# USAGE:  ./bootstrap.sh /path/to/prospects.csv [YYYY-MM-DD]
# OUTPUT: out/scored.json  and  out/fit-review.html
#
# Must run on a machine with a real browser + open network (your laptop or the
# scraper box) — NOT a locked-down CI/cloud sandbox.
set -euo pipefail
cd "$(dirname "$0")"

CSV="${1:?usage: ./bootstrap.sh prospects.csv [today YYYY-MM-DD]}"
TODAY="${2:-$(date +%F)}"
PORT="${PF_CDP_PORT:-9222}"
SKILL_DIR="$(cd .. && pwd)"     # install node deps here so link-reader resolves them

# --- 1. prereqs ---------------------------------------------------------------
command -v node >/dev/null 2>&1 || { echo "ERROR: Node.js not found on PATH (install from nodejs.org)." >&2; exit 1; }
PY="${PYTHON:-$(command -v python3 || command -v python || true)}"   # Windows uses 'python'
[ -n "$PY" ] || { echo "ERROR: Python not found on PATH (install from python.org)." >&2; exit 1; }
export PYTHON="$PY"   # run.sh picks this up

cdp_up() {
  if command -v curl >/dev/null 2>&1; then
    curl -sf --max-time 3 "http://localhost:$PORT/json/version" >/dev/null 2>&1
  else
    (exec 3<>"/dev/tcp/localhost/$PORT") 2>/dev/null && { exec 3>&- 3<&-; return 0; } || return 1
  fi
}

# --- 2. Playwright (for the headless fallback + CDP client) -------------------
export NODE_PATH="$SKILL_DIR/node_modules:${NODE_PATH:-$(npm root -g 2>/dev/null || echo)}"
if ! node -e "require('playwright')" >/dev/null 2>&1; then
  echo "[setup] installing playwright into $SKILL_DIR ..."
  ( cd "$SKILL_DIR" && npm init -y >/dev/null 2>&1 || true; npm install playwright >/dev/null 2>&1 )
  npx --prefix "$SKILL_DIR" playwright install chromium >/dev/null 2>&1 || \
    echo "[setup] (couldn't pre-install Playwright's chromium; a system Chrome on :$PORT is preferred anyway)"
fi

# --- 3. Chrome on :9222 -------------------------------------------------------
LAUNCHED_PID=""
if cdp_up; then
  echo "[chrome] already listening on :$PORT — reusing it"
else
  # Any Chromium-based browser works (Chrome, Brave, Chromium, Edge) — they all
  # speak the DevTools protocol on :9222. Firefox does NOT (different protocol).
  # Override with PF_BROWSER=/path/to/browser to force a specific one.
  CHROME=""
  if [ -n "${PF_BROWSER:-}" ]; then
    CHROME="$PF_BROWSER"
  else
    for c in google-chrome google-chrome-stable brave brave-browser chromium chromium-browser microsoft-edge \
             "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
             "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" \
             "/Applications/Chromium.app/Contents/MacOS/Chromium" \
             "/c/Program Files/Google/Chrome/Application/chrome.exe" \
             "/c/Program Files (x86)/Google/Chrome/Application/chrome.exe" \
             "$LOCALAPPDATA/Google/Chrome/Application/chrome.exe" \
             "/c/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe" \
             "$LOCALAPPDATA/BraveSoftware/Brave-Browser/Application/brave.exe"; do
      if command -v "$c" >/dev/null 2>&1 || [ -x "$c" ]; then CHROME="$c"; break; fi
    done
  fi
  if [ -n "$CHROME" ]; then
    echo "[chrome] launching: $CHROME --remote-debugging-port=$PORT"
    "$CHROME" --remote-debugging-port="$PORT" \
      --user-data-dir="${TMPDIR:-/tmp}/pf-chrome" \
      --no-first-run --no-default-browser-check >/dev/null 2>&1 &
    LAUNCHED_PID=$!
    for _ in $(seq 1 20); do cdp_up && break; sleep 0.5; done
    cdp_up && echo "[chrome] up on :$PORT (pid $LAUNCHED_PID)" \
           || echo "[chrome] did NOT come up — reader will fall back to headless Playwright"
  else
    echo "[chrome] no Chrome/Chromium found — reader will fall back to headless Playwright (weaker vs bot-blocks)"
  fi
fi

# --- 4. run the pipeline ------------------------------------------------------
echo "[run] scoring $CSV (today=$TODAY)"
PF_CDP_URL="http://localhost:$PORT" ./run.sh "$CSV" "$TODAY"

echo
echo "✔ Done."
echo "  Review console : $(pwd)/out/fit-review.html   (open in a browser)"
echo "  Scored data     : $(pwd)/out/scored.json        (send this back to refine)"
[ -n "$LAUNCHED_PID" ] && echo "  Note: this script launched Chrome (pid $LAUNCHED_PID). Close it with: kill $LAUNCHED_PID"
