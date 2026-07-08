<#
.SYNOPSIS
  Junction this repo's .claude/skills/* into the vault's .claude/skills/
  so the agentic-OS runner (and any session in the vault) sees ONE set of
  skills, sourced and versioned here.

.DESCRIPTION
  Repo = workshop (skills are written, reviewed, versioned here).
  Vault = runtime (the Telegram runner dispatches from vault\.claude\skills).
  This script creates one directory JUNCTION per repo skill inside the
  vault's skills folder. Junctions need no admin rights on Windows.

  Idempotent: safe to re-run. Never touches vault-native skills
  (ingest-ramble, reconcile-state, ...) — if a real folder with the same
  name exists, it warns and skips instead of overwriting.

.USAGE
  powershell -ExecutionPolicy Bypass -File scripts\Link-SkillsToVault.ps1
  # custom vault location:
  ... -VaultPath "D:\Somewhere\Deludicrous"
  # remove all junctions this script manages:
  ... -Unlink
#>
param(
  [string]$VaultPath = "$env:USERPROFILE\Documents\Deludicrous",
  [string[]]$Exclude = @(),
  [switch]$Unlink
)

$ErrorActionPreference = 'Stop'
$repoSkills  = Resolve-Path (Join-Path $PSScriptRoot '..\.claude\skills')
$vaultSkills = Join-Path $VaultPath '.claude\skills'

if (-not (Test-Path $VaultPath)) { throw "Vault not found at $VaultPath — pass -VaultPath." }
if (-not (Test-Path $vaultSkills)) { New-Item -ItemType Directory -Path $vaultSkills | Out-Null }

$linked = @(); $skipped = @(); $removed = @()

foreach ($src in Get-ChildItem -Path $repoSkills -Directory) {
  if ($Exclude -contains $src.Name) { $skipped += "$($src.Name) (excluded)"; continue }
  $dst = Join-Path $vaultSkills $src.Name
  $existing = Get-Item -Path $dst -ErrorAction SilentlyContinue

  if ($Unlink) {
    if ($existing -and $existing.LinkType -eq 'Junction') {
      $existing.Delete(); $removed += $src.Name
    }
    continue
  }

  if ($existing) {
    if ($existing.LinkType -eq 'Junction') {
      if ($existing.Target -eq $src.FullName) { $skipped += "$($src.Name) (already linked)"; continue }
      $existing.Delete()   # junction pointing somewhere stale — relink
    } else {
      $skipped += "$($src.Name) (REAL folder exists in vault — name collision, NOT touched)"
      continue
    }
  }
  New-Item -ItemType Junction -Path $dst -Target $src.FullName | Out-Null
  $linked += $src.Name
}

# Keep junctioned skills out of the vault's own git history (repo versions them)
$vaultGitignore = Join-Path $VaultPath '.gitignore'
if ((Test-Path (Join-Path $VaultPath '.git')) -and -not $Unlink -and $linked.Count -gt 0) {
  $marker = '# repo-junctioned skills (versioned in Chase-Claude-Code-Practice)'
  $lines  = if (Test-Path $vaultGitignore) { Get-Content $vaultGitignore } else { @() }
  $add    = @()
  if ($lines -notcontains $marker) { $add += $marker }
  foreach ($name in $linked) {
    $entry = ".claude/skills/$name/"
    if ($lines -notcontains $entry) { $add += $entry }
  }
  if ($add.Count -gt 0) { Add-Content -Path $vaultGitignore -Value $add }
}

Write-Host "`n=== Link-SkillsToVault summary ==="
if ($Unlink) { Write-Host "Removed junctions: $($removed -join ', ')" }
else {
  Write-Host "Linked : $($linked -join ', ')"
  Write-Host "Skipped: $($skipped -join ', ')"
  Write-Host "`nDeploy model: edit/pull skills in THIS repo -> runner sees changes instantly."
}
