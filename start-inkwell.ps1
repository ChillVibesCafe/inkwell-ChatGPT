param([switch]$CheckOnly)
$ErrorActionPreference = 'Stop'
$nodePath = (Get-Command node.exe -ErrorAction Stop).Source
$version = [version]((& $nodePath --version).Trim().TrimStart('v'))
if ($version -lt [version]'22.12.0') { throw 'Node.js 22.12 or newer is required.' }
if ($CheckOnly) { Write-Host 'Node.js and local launcher are ready.'; return }
if (!$env:PORT) { $env:PORT = '4323' }
$env:INKWELL_HOST = '127.0.0.1'
$url = 'http://127.0.0.1:' + $env:PORT
$client = New-Object Net.Sockets.TcpClient
try {
    if ($client.ConnectAsync('127.0.0.1', [int]$env:PORT).Wait(500) -and $client.Connected) {
        throw 'This port is already in use. Close the other instance or set PORT to another port.'
    }
} catch [System.Management.Automation.MethodInvocationException] {
    # Connection refusal means the port is available.
} finally { $client.Dispose() }
Push-Location $PSScriptRoot
$browserJob = $null
try {
    # A copied node_modules folder can contain an empty/broken SDK junction.
    # Checking only the directory incorrectly treats that copy as installed.
    if (!(Test-Path -LiteralPath 'node_modules/@siwc/local/package.json') -or
        !(Test-Path -LiteralPath 'node_modules/.bin/tsc.cmd') -or
        !(Test-Path -LiteralPath 'node_modules/express/package.json')) {
        Write-Host 'Installing or repairing this copy''s dependencies...'
        & npm.cmd ci
        if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed.' }
    }
    & npm.cmd run build
    if ($LASTEXITCODE -ne 0) { throw 'Build failed.' }
    # Validate the actual imports after compilation, including copied/stale packages.
    $dependencyProbe = "Promise.all([import('@siwc/local'), import('express')]).catch(() => process.exit(1));"
    & $nodePath --input-type=module -e $dependencyProbe
    if ($LASTEXITCODE -ne 0) {
        Write-Host 'Repairing an unusable copied dependency installation...'
        & npm.cmd ci
        if ($LASTEXITCODE -ne 0) { throw 'Dependency repair failed. Check the npm output above.' }
        & npm.cmd run build
        if ($LASTEXITCODE -ne 0) { throw 'Build failed after dependency repair.' }
        & $nodePath --input-type=module -e $dependencyProbe
        if ($LASTEXITCODE -ne 0) { throw 'Dependencies are still unavailable after repair. Check this copy''s node_modules permissions.' }
    }
    $browserJob = Start-Job -ArgumentList $url -ScriptBlock {
        param($Url)
        for ($i=0; $i -lt 30; $i++) {
            try { $null=Invoke-RestMethod "$Url/api/settings" -TimeoutSec 2; Start-Process $Url; break }
            catch { Start-Sleep -Seconds 1 }
        }
    }
    Write-Host "Inkwell is starting at $url. Keep this terminal open."
    Write-Host 'Ollama is optional. Read the privacy notice before connecting in Settings.'
    & $nodePath server.js
    if ($LASTEXITCODE -ne 0) { throw "Server exited with code $LASTEXITCODE." }
} finally {
    if ($browserJob) { Stop-Job $browserJob -ErrorAction SilentlyContinue; Remove-Job $browserJob -Force -ErrorAction SilentlyContinue }
    Pop-Location
}
