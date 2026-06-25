# Run after you create an EMPTY repo at https://github.com/new named "fluxgrid"
param(
  [Parameter(Mandatory = $true)]
  [string]$GitHubUsername
)

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

$remote = "https://github.com/$GitHubUsername/fluxgrid.git"

$hasOrigin = $false
git remote 2>$null | ForEach-Object { if ($_ -eq "origin") { $hasOrigin = $true } }

if ($hasOrigin) {
  git remote set-url origin $remote
  Write-Host "Updated origin -> $remote"
} else {
  git remote add origin $remote
  Write-Host "Added origin -> $remote"
}

git branch -M main
Write-Host "Pushing to GitHub (browser login may open)..."
git push -u origin main

Write-Host ""
Write-Host "Done. Next: https://render.com -> New + -> Blueprint -> connect fluxgrid repo -> Apply"
Write-Host "Set ADMIN_PIN from server\.env when Render asks."