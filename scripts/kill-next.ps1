<#
.SYNOPSIS
  Safely kill Next.js dev server without touching DevEco Code's node process.

.DESCRIPTION
  Targets only node.exe processes whose command line contains "next".
  Falls back to port-based kill if command-line match fails.
  NEVER kills node.exe by process name alone (that would kill DevEco Code).

.EXAMPLE
  .\scripts\kill-next.ps1
  .\scripts\kill-next.ps1 -Port 3001
#>

param(
    [int]$Port = 3000
)

$killed = 0

$nextProcs = Get-CimInstance Win32_Process |
    Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -match '\bnext\b' }

if ($nextProcs) {
    foreach ($proc in $nextProcs) {
        Write-Host "Killing Next.js node process: PID=$($proc.ProcessId) CMD=$($proc.CommandLine)"
        Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue
        $killed++
    }
}

$nextPids = @($nextProcs.ProcessId)
$portProcs = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique |
    Where-Object { $_ -notin $nextPids }

if ($portProcs) {
    foreach ($pid in $portProcs) {
        $p = Get-Process -Id $pid -ErrorAction SilentlyContinue
        if ($p) {
            Write-Host "Killing port $Port occupant: PID=$pid NAME=$($p.ProcessName)"
            Stop-Process -Id $pid -Force
            $killed++
        }
    }
}

if ($killed -eq 0) {
    Write-Host "No Next.js process found on command line or port $Port."
} else {
    Write-Host "Done. Killed $killed process(es)."
}

$devecoNode = Get-CimInstance Win32_Process |
    Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -match 'deveco' }
if ($devecoNode) {
    Write-Host "`n[SAFE] DevEco Code node process still running: PID=$($devecoNode.ProcessId)"
}
