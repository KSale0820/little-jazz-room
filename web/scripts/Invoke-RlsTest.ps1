# Secure RLS test runner — prompts for team credentials; never writes them to disk.
# Usage (from repo):  cd web; .\scripts\Invoke-RlsTest.ps1
# Requires: web/.env.local with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

$ErrorActionPreference = 'Stop'
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$webRoot = Split-Path -Parent $scriptDir
Set-Location $webRoot

function Read-DotEnvLocal {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) {
        throw "Missing $Path — copy .env.example to .env.local and add Supabase URL + anon key."
    }
    Get-Content -LiteralPath $Path | ForEach-Object {
        $line = $_.Trim()
        if (-not $line -or $line.StartsWith('#')) { return }
        $eq = $line.IndexOf('=')
        if ($eq -lt 1) { return }
        $key = $line.Substring(0, $eq).Trim()
        $val = $line.Substring($eq + 1).Trim()
        if ($val.Length -ge 2) {
            if (($val.StartsWith('"') -and $val.EndsWith('"')) -or ($val.StartsWith("'") -and $val.EndsWith("'"))) {
                $val = $val.Substring(1, $val.Length - 2)
            }
        }
        switch ($key) {
            'VITE_SUPABASE_URL' { if (-not $env:SUPABASE_URL) { $env:SUPABASE_URL = $val } }
            'VITE_SUPABASE_ANON_KEY' { if (-not $env:SUPABASE_ANON_KEY) { $env:SUPABASE_ANON_KEY = $val } }
            'SUPABASE_URL' { $env:SUPABASE_URL = $val }
            'SUPABASE_ANON_KEY' { $env:SUPABASE_ANON_KEY = $val }
            default { }
        }
    }
}

function Read-SecretPlain {
    param([string]$Prompt)
    $secure = Read-Host -AsSecureString $Prompt
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try {
        return [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
    }
    finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    }
}

function Clear-RlsTestSecrets {
    $names = @(
        'TEAM_USER_A_EMAIL',
        'TEAM_USER_A_PASSWORD',
        'TEAM_USER_B_EMAIL',
        'TEAM_USER_B_PASSWORD'
    )
    foreach ($n in $names) {
        if (Test-Path -Path "Env:$n") {
            Remove-Item -Path "Env:$n" -Force -ErrorAction SilentlyContinue
        }
    }
}

$exitCode = 1
try {
    Read-DotEnvLocal -Path (Join-Path $webRoot '.env.local')

    if (-not $env:SUPABASE_URL -or -not $env:SUPABASE_ANON_KEY) {
        throw 'SUPABASE_URL and SUPABASE_ANON_KEY must be set (via VITE_* in .env.local).'
    }

    Write-Host 'Enter Team User A (RLS test account 1). Password input is hidden.'
    $env:TEAM_USER_A_EMAIL = Read-Host 'User A email'
    $env:TEAM_USER_A_PASSWORD = Read-SecretPlain 'User A password'

    Write-Host 'Enter Team User B (RLS test account 2). Password input is hidden.'
    $env:TEAM_USER_B_EMAIL = Read-Host 'User B email'
    $env:TEAM_USER_B_PASSWORD = Read-SecretPlain 'User B password'

    Write-Host ''
    Write-Host 'Running RLS tests against' $env:SUPABASE_URL
    Write-Host ''

    & node (Join-Path $scriptDir 'supabase-rls-test.mjs')
    $exitCode = $LASTEXITCODE
    if ($null -eq $exitCode) { $exitCode = 0 }
}
catch {
    Write-Error $_.Exception.Message
    $exitCode = 1
}
finally {
    Clear-RlsTestSecrets
}

exit $exitCode
