# Run once as Administrator — starts HTTPS tunnel after login
$taskName = 'FLUXGRID-Tunnel'
$script = 'C:\Users\julia\voidlink\deploy\start-tunnel-quick.ps1'

$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$script`""
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -RunLevel Highest -LogonType Interactive
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description 'Start FLUXGRID Cloudflare HTTPS tunnel'
Write-Host "Scheduled task '$taskName' registered."
Write-Host 'Note: quick tunnel URL changes each restart — check the tunnel window for the new https://....trycloudflare.com link.'