# Run after you create an EMPTY repo at https://github.com/new named "fluxgrid"
param(
  [Parameter(Mandatory = $true)]
  [string]$GitHubUsername
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

$remote = "https://github.com/$GitHubUsername/fluxgrid.git"

if (git remote get-url origin 2>$null) {
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