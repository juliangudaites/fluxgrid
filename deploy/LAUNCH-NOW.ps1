# Double-click or run: keeps FLUXGRID online WITHOUT router port forwarding
$ErrorActionPreference = 'SilentlyContinue'
Set-Location 'C:\Users\julia\voidlink'

# Start server if not running
if (-not (Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue)) {
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = 'node'
  $psi.Arguments = 'src/index.js'
  $psi.WorkingDirectory = 'C:\Users\julia\voidlink\server'
  $psi.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
  $psi.UseShellExecute = $false
  $psi.Environment['NODE_ENV'] = 'production'
  [System.Diagnostics.Process]::Start($psi) | Out-Null
  Start-Sleep -Seconds 4
}

# Start HTTPS tunnel (no router needed)
$cf = 'C:\Program Files (x86)\cloudflared\cloudflared.exe'
if (Test-Path $cf) {
  Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force
  Start-Sleep -Seconds 2
  $log = Join-Path $PSScriptRoot 'tunnel-err.log'
  Remove-Item $log -ErrorAction SilentlyContinue
  Start-Process -FilePath $cf -ArgumentList 'tunnel --url http://127.0.0.1:3001' -WindowStyle Hidden -RedirectStandardError $log
  Start-Sleep -Seconds 12
  $url = (Select-String -Path $log -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' -ErrorAction SilentlyContinue |
    Select-Object -Last 1).Line -replace '.*(https://[a-z0-9-]+\.trycloudflare\.com).*', '$1'
  if ($url) {
    Set-Content (Join-Path $PSScriptRoot 'current-tunnel-url.txt') $url
    Start-Process $url
    Write-Host "FLUXGRID LIVE: $url"
  }
} else {
  Write-Host 'Server: http://localhost:3001 (install cloudflared for public HTTPS)'
}