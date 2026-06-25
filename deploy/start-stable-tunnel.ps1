# Start the PERMANENT Cloudflare tunnel (same URL every time — after setup-stable-tunnel.ps1)
$cf = 'C:\Program Files (x86)\cloudflared\cloudflared.exe'
$config = Join-Path $env:USERPROFILE '.cloudflared\config.yml'
if (-not (Test-Path $cf)) { throw 'cloudflared not installed' }
if (-not (Test-Path $config)) {
  throw 'No named tunnel config. Run deploy\setup-stable-tunnel.ps1 first (needs a domain on Cloudflare).'
}
Write-Host 'Starting permanent FLUXGRID tunnel...'
& $cf tunnel run fluxgrid