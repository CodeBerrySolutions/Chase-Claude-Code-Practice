<#
  bootstrap.ps1 — native Windows/PowerShell runner for the score-prospect-fit
  pipeline. No Git Bash needed. Checks prereqs, installs Playwright, launches a
  Chromium browser (Chrome/Brave/Edge) on a debug port, reads each link-in-bio,
  scores, and builds the review console.

  RUN (copy-paste friendly):
    powershell -ExecutionPolicy Bypass -File .\bootstrap.ps1 C:\path\to\prospects.csv

  Optional:
    -Today 2026-07-30            # date for the "stale post" check (default: now)
    -Port 9333                   # debug port (use a fresh one if another browser holds 9222)
    -Browser "C:\...\brave.exe"  # force a specific Chromium browser
#>
param(
  [Parameter(Mandatory=$true)][string]$Csv,
  [string]$Today = (Get-Date -Format 'yyyy-MM-dd'),
  [int]$Port = 9333,
  [string]$Browser
)
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

if (-not (Test-Path $Csv)) { throw "CSV not found: $Csv" }
$utf8 = New-Object System.Text.UTF8Encoding($false)   # no BOM — keeps JSON/CSV readable by python
function Write-Text($content, $relPath) {
  $full = Join-Path $PWD $relPath
  [System.IO.File]::WriteAllText($full, (($content) -join "`n"), $utf8)
}

# --- prereqs ---
$pyCmd = Get-Command python -ErrorAction SilentlyContinue
if (-not $pyCmd) { $pyCmd = Get-Command python3 -ErrorAction SilentlyContinue }
if (-not $pyCmd) { throw "Python not found. Install from python.org (tick 'Add python.exe to PATH'), reopen the terminal." }
$py = $pyCmd.Source
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw "Node.js not found. Install from nodejs.org, reopen the terminal." }

$skill = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$env:NODE_PATH = Join-Path $skill 'node_modules'

# --- playwright (one-time) ---
node -e "require('playwright')" 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "[setup] installing Playwright (one-time, may take a minute)..."
  Push-Location $skill
  npm init -y | Out-Null
  npm install playwright | Out-Null
  Pop-Location
  npx --prefix $skill playwright install chromium | Out-Null
}

# --- browser on the debug port ---
function Test-Cdp {
  try { Invoke-WebRequest "http://localhost:$Port/json/version" -TimeoutSec 3 -UseBasicParsing | Out-Null; return $true }
  catch { return $false }
}
$launched = $null
if (Test-Cdp) {
  Write-Host "[browser] reusing the browser already on :$Port"
} else {
  if (-not $Browser) {
    $cands = @(
      "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
      "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
      "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe",
      "$env:ProgramFiles\BraveSoftware\Brave-Browser\Application\brave.exe",
      "$env:LOCALAPPDATA\BraveSoftware\Brave-Browser\Application\brave.exe",
      "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
    )
    $Browser = $cands | Where-Object { Test-Path $_ } | Select-Object -First 1
  }
  if ($Browser) {
    Write-Host "[browser] launching $Browser on :$Port"
    $launched = Start-Process $Browser -PassThru -ArgumentList `
      "--remote-debugging-port=$Port","--user-data-dir=$env:TEMP\pf-browser","--no-first-run","--no-default-browser-check"
    for ($i=0; $i -lt 20; $i++) { if (Test-Cdp) { break }; Start-Sleep -Milliseconds 500 }
    if (Test-Cdp) { Write-Host "[browser] up on :$Port (pid $($launched.Id))" }
    else { Write-Host "[browser] didn't come up — reader will fall back to headless" }
  } else {
    Write-Host "[browser] no Chrome/Brave/Edge found — reader falls back to headless (weaker vs bot-blocks)"
  }
}

# --- pipeline ---
New-Item -ItemType Directory -Force -Path out | Out-Null
$env:PF_CDP_URL = "http://localhost:$Port"

Write-Host "[1/5] CSV -> profiles.json"
Write-Text (& $py 1_csv_to_profiles.py $Csv) 'out\profiles.json'

Write-Host "[2/5] read links via browser on :$Port"
$pages = node ..\link-reader\read-links.mjs out\profiles.json 2> out\read.log
if ($LASTEXITCODE -ne 0 -or -not $pages) { Write-Host "      link reader empty/failed; continuing"; $pages = '[]' }
Write-Text $pages 'out\pages.json'

Write-Host "[3/5] classify offers"
Write-Text (& $py 2_classify_offers.py out\pages.json) 'out\offers.json'

Write-Host "[4/5] score"
Write-Text (& $py 3_score.py $Csv out\offers.json --today $Today) 'out\scored.json'

Write-Host "[5/5] build review console"
& $py 4_build_console.py out\scored.json --csv $Csv -o out\fit-review.html --source (Split-Path $Csv -Leaf) | Out-Null

Write-Host ""
Write-Host "Done."
Write-Host ("  Review console : {0}\out\fit-review.html   (open in a browser)" -f $PWD)
Write-Host ("  Scored data    : {0}\out\scored.json        (send this back to refine)" -f $PWD)
if ($launched) { Write-Host ("  Note: launched browser pid {0} — close it with:  Stop-Process -Id {0}" -f $launched.Id) }
