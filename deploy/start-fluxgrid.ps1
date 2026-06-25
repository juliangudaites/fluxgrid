# FLUXGRID production launcher (run after reboot)
$ErrorActionPreference = 'Stop'
Set-Location 'C:\Users\julia\voidlink'

# Ensure client build exists
if (-not (Test-Path 'client\dist\index.html')) {
  npm run build --prefix client
}

# Port 80 -> 3001 (requires Admin PowerShell)
netsh interface portproxy delete v4tov4 listenport=80 listenaddress=0.0.0.0 2>$null
netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=80 connectaddress=127.0.0.1 connectport=3001

# Stop any existing FLUXGRID node process on port 3001
Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }

$serverDir = 'C:\Users\julia\voidlink\server'
Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', 'set NODE_ENV=production&& node src/index.js' -WorkingDirectory $serverDir -WindowStyle Hidden

Start-Sleep 3
Write-Host 'FLUXGRID running — http://localhost:3001'
Write-Host 'Public DuckDNS (after router port-forward): http://fluxgrid.duckdns.org'
Write-Host 'For HTTPS run: deploy\start-tunnel-quick.ps1'