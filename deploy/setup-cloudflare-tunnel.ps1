# One-time Cloudflare Tunnel setup for HTTPS (optional — run in Admin PowerShell)
$cf = 'C:\Program Files (x86)\cloudflared\cloudflared.exe'
if (-not (Test-Path $cf)) { throw 'cloudflared not found. Reinstall with: winget install Cloudflare.cloudflared' }

Write-Host 'STEP 1: A browser window will open — log in to Cloudflare and authorize.'
& $cf tunnel login

Write-Host 'STEP 2: Creating tunnel named fluxgrid...'
& $cf tunnel create fluxgrid

$tunnelDir = Join-Path $env:USERPROFILE '.cloudflared'
$jsonFiles = Get-ChildItem $tunnelDir -Filter '*.json' | Where-Object { $_.Name -ne 'cert.pem' }
if ($jsonFiles.Count -eq 0) { throw 'Tunnel credentials not found after create.' }
$credFile = $jsonFiles | Sort-Object LastWriteTime -Descending | Select-Object -First 1

$configPath = Join-Path $tunnelDir 'config.yml'
@(
  'tunnel: fluxgrid',
  "credentials-file: $($credFile.FullName)",
  '',
  'ingress:',
  '  - hostname: fluxgrid.duckdns.org',
  '    service: http://localhost:3001',
  '  - service: http_status:404'
) | Set-Content -Path $configPath -Encoding UTF8

Write-Host "Config written to $configPath"
Write-Host 'STEP 3: If your domain is on Cloudflare DNS, run:'
Write-Host "  & '$cf' tunnel route dns fluxgrid fluxgrid.duckdns.org"
Write-Host 'STEP 4: Start tunnel:'
Write-Host "  & '$cf' tunnel run fluxgrid"