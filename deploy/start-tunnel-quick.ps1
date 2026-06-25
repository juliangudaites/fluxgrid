# Instant free HTTPS URL (no router / no Cloudflare account DNS needed)
$cf = 'C:\Program Files (x86)\cloudflared\cloudflared.exe'
Write-Host 'Starting quick tunnel to http://localhost:3001 ...'
Write-Host 'Copy the https://....trycloudflare.com URL when it appears.'
& $cf tunnel --url http://localhost:3001