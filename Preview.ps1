$ErrorActionPreference = 'Stop'
$previewUrl = 'http://127.0.0.1:4173'
$previewReady = $false
New-Item -ItemType Directory -Force -Path (Join-Path $PSScriptRoot 'tmp') | Out-Null
try {
    $response = curl.exe --silent --fail --noproxy '*' --max-time 2 "$previewUrl/__preview/version"
    $previewReady = $response -match '^\d+:\d+$'
} catch {}
if (-not $previewReady) {
    $node = (Get-Command node -ErrorAction Stop).Source
    Start-Process -FilePath $node -ArgumentList ('"' + (Join-Path $PSScriptRoot 'preview-server.cjs') + '"') -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $PSScriptRoot 'tmp/preview-server.log') -RedirectStandardError (Join-Path $PSScriptRoot 'tmp/preview-server-error.log')
    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        Start-Sleep -Milliseconds 250
        try {
            $response = curl.exe --silent --fail --noproxy '*' --max-time 1 "$previewUrl/__preview/version"
            if ($response -match '^\d+:\d+$') { $previewReady = $true; break }
        } catch {}
    }
}
if (-not $previewReady) { throw 'Preview did not start. Check tmp/preview-server-error.log; port 4173 may be occupied.' }
Start-Process "$previewUrl/problem-walkthoughs/"

