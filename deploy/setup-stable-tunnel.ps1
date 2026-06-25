# STABLE URL via Cloudflare Named Tunnel (URL never changes)
# Requires: a domain you control on Cloudflare DNS (NOT duckdns.org — DuckDNS only supports IP, not tunnel)
$ErrorActionPreference = 'Stop'
$cf = 'C:\Program Files (x86)\cloudflared\cloudflared.exe'
if (-not (Test-Path $cf)) { throw 'Install cloudflared: winget install Cloudflare.cloudflared' }

Write-Host ''
Write-Host '=== FLUXGRID STABLE URL SETUP ===' -ForegroundColor Cyan
Write-Host ''
Write-Host 'IMPORTANT about fluxgrid.duckdns.org:' -ForegroundColor Yellow
Write-Host '  DuckDNS points to your HOME IP. Cloudflare Tunnel needs a domain on Cloudflare DNS.'
Write-Host '  You CANNOT combine DuckDNS + named tunnel. Pick one:'
Write-Host '    A) Fix ISP port 80  -> stable http://fluxgrid.duckdns.org'
Write-Host '    B) Domain on Cloudflare + this script -> stable https://yourdomain.com'
Write-Host '    C) Deploy to Render -> stable https://fluxgrid.onrender.com (see DEPLOY-RENDER.txt)'
Write-Host ''

$domain = Read-Host 'Enter your domain on Cloudflare (e.g. fluxgrid.com or app.yourdomain.com)'

Write-Host ''
Write-Host 'STEP 1: Browser opens — log in to Cloudflare (free account) and authorize.'
& $cf tunnel login

Write-Host 'STEP 2: Creating permanent tunnel "fluxgrid"...'
& $cf tunnel create fluxgrid 2>$null
if ($LASTEXITCODE -ne 0) { Write-Host 'Tunnel may already exist — continuing.' }

$tunnelDir = Join-Path $env:USERPROFILE '.cloudflared'
$credFile = Get-ChildItem $tunnelDir -Filter '*.json' -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -ne 'cert.pem' } |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1
if (-not $credFile) { throw 'No tunnel credentials found in .cloudflared' }

$configPath = Join-Path $tunnelDir 'config.yml'
@(
  'tunnel: fluxgrid',
  "credentials-file: $($credFile.FullName)",
  '',
  'ingress:',
  "  - hostname: $domain",
  '    service: http://127.0.0.1:3001',
  '  - service: http_status:404'
) | Set-Content -Path $configPath -Encoding UTF8

Write-Host "STEP 3: Link DNS (domain must use Cloudflare nameservers)..."
& $cf tunnel route dns fluxgrid $domain

Write-Host ''
Write-Host "DONE. Permanent URL: https://$domain" -ForegroundColor Green
Write-Host 'Start tunnel (keep PC on):'
Write-Host "  & '$cf' tunnel run fluxgrid"
Write-Host ''
Write-Host 'Or install as Windows service (survives reboot):'
Write-Host "  & '$cf' service install"
Write-Host "  & '$cf' service start"