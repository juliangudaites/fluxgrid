# FLUXGRID — launch server + optional HTTPS tunnel
# Run in PowerShell (Admin recommended for port 80 proxy)
$ErrorActionPreference = 'Stop'
Set-Location 'C:\Users\julia\voidlink'

Write-Host '=== FLUXGRID LAUNCH ===' -ForegroundColor Cyan

if (-not (Test-Path 'client\dist\index.html')) {
  Write-Host 'Building client...'
  npm run build --prefix client
}

# Port 80 -> 3001 (DuckDNS HTTP)
netsh interface portproxy delete v4tov4 listenport=80 listenaddress=0.0.0.0 2>$null
netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=80 connectaddress=127.0.0.1 connectport=3001

netsh advfirewall firewall add rule name="FLUXGRID HTTP" dir=in action=allow protocol=TCP localport=80 2>$null
netsh advfirewall firewall add rule name="FLUXGRID API" dir=in action=allow protocol=TCP localport=3001 2>$null

Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }

$serverDir = 'C:\Users\julia\voidlink\server'
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = 'node'
$psi.Arguments = 'src/index.js'
$psi.WorkingDirectory = $serverDir
$psi.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
$psi.UseShellExecute = $false
$psi.Environment['NODE_ENV'] = 'production'
[System.Diagnostics.Process]::Start($psi) | Out-Null

Start-Sleep -Seconds 3

$lanIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
  $_.IPAddress -notlike '127.*' -and $_.PrefixOrigin -ne 'WellKnown' -and $_.IPAddress -like '192.168.*'
} | Select-Object -First 1).IPAddress

try { $publicIp = (Invoke-WebRequest -Uri 'https://api.ipify.org' -UseBasicParsing -TimeoutSec 8).Content.Trim() } catch { $publicIp = 'unknown' }

Write-Host ''
Write-Host 'Server:  http://localhost:3001' -ForegroundColor Green
Write-Host "LAN:     http://${lanIp}" -ForegroundColor Green
Write-Host 'Domain:  http://fluxgrid.duckdns.org' -ForegroundColor Yellow
Write-Host "Public IP (DuckDNS should point here): $publicIp" -ForegroundColor Gray
Write-Host ''
Write-Host 'If fluxgrid.duckdns.org does not load from other devices:' -ForegroundColor Yellow
Write-Host "  Router port-forward: TCP 80 -> ${lanIp}:80" -ForegroundColor Yellow
Write-Host '  (Also try external port 8080 -> 80 if ISP blocks port 80)' -ForegroundColor Gray
Write-Host ''

$cf = 'C:\Program Files (x86)\cloudflared\cloudflared.exe'
if (Test-Path $cf) {
  Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
  $logErr = Join-Path $PSScriptRoot 'tunnel-err.log'
  $logOut = Join-Path $PSScriptRoot 'tunnel-out.log'
  Remove-Item $logErr, $logOut -ErrorAction SilentlyContinue
  Start-Process -FilePath $cf -ArgumentList 'tunnel --url http://localhost:3001' -WindowStyle Hidden `
    -RedirectStandardOutput $logOut -RedirectStandardError $logErr
  Start-Sleep -Seconds 8
  $tunnelUrl = Select-String -Path $logErr -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' -AllMatches |
    ForEach-Object { $_.Matches } | Select-Object -Last 1 -ExpandProperty Value
  if ($tunnelUrl) {
    Write-Host "HTTPS tunnel (works without router): $tunnelUrl" -ForegroundColor Green
    Set-Content -Path (Join-Path $PSScriptRoot 'current-tunnel-url.txt') -Value $tunnelUrl
  }
}

Write-Host ''
Write-Host 'Done. Keep this PC awake for the site to stay online.' -ForegroundColor Cyan