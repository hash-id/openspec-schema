#Requires -Version 5.1
$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false

$Repo = "hash-id/openspec-schema"
$Branch = "master"
$SchemaName = "hash"
$SchemaPath = "openspec/schemas/$SchemaName"

function Test-CommandExists {
    param([string]$Name)
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

if (-not (Test-CommandExists "git")) {
    Write-Error "Error: git is required."
    exit 1
}
if (-not (Test-CommandExists "npx")) {
    Write-Error "Error: npx (Node.js) is required."
    exit 1
}

$Dest = Join-Path (Get-Location) "openspec/schemas/$SchemaName"
$Config = Join-Path (Get-Location) "openspec/config.yaml"

if ($Repo -match '^(http|git@)') {
    $Url = $Repo
} else {
    $Url = "https://github.com/$Repo.git"
}

$Tmp = Join-Path ([System.IO.Path]::GetTempPath()) ([System.IO.Path]::GetRandomFileName())
New-Item -ItemType Directory -Path $Tmp | Out-Null

try {
    Write-Host "Fetching '$SchemaName' from $Url (branch $Branch)..."
    $ErrorActionPreference = "Continue"
    git clone --depth 1 --branch $Branch $Url "$Tmp/repo" 2>&1 | Out-Null
    $ErrorActionPreference = "Stop"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Error: failed to clone $Url at branch $Branch`n       (private repo? use an SSH url or a token: https://github.com/settings/tokens)"
        exit 1
    }

    $Src = Join-Path $Tmp "repo/$SchemaPath"
    if (-not (Test-Path (Join-Path $Src "schema.yaml"))) {
        Write-Error "Error: schema.yaml not found at '$SchemaPath' in the repo"
        exit 1
    }

    if (Test-Path $Dest) {
        Remove-Item -Recurse -Force $Dest
    }
    New-Item -ItemType Directory -Path (Join-Path $Dest "templates") -Force | Out-Null
    Copy-Item (Join-Path $Src "schema.yaml") (Join-Path $Dest "schema.yaml")

    $TemplatesSrc = Join-Path $Src "templates"
    if (Test-Path $TemplatesSrc) {
        Get-ChildItem -Path $TemplatesSrc -File | ForEach-Object {
            Copy-Item $_.FullName (Join-Path $Dest "templates")
        }
    }

    Write-Host "Installing skills..."
    $ErrorActionPreference = "Continue"
    "" | npx --yes skills@latest add mattpocock/skills --skill grill-me grilling tdd --agent '*' -y 2>&1 | Write-Host
    $ErrorActionPreference = "Stop"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Error: failed to install grill-me/grilling/tdd from mattpocock/skills"
        exit 1
    }
    $ErrorActionPreference = "Continue"
    "" | npx --yes skills@latest add wshobson/agents --skill stride-analysis-patterns threat-mitigation-mapping security-requirement-extraction --agent '*' -y 2>&1 | Write-Host
    $ErrorActionPreference = "Stop"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Error: failed to install security skills from wshobson/agents"
        exit 1
    }
    $ErrorActionPreference = "Continue"
    "" | npx --yes skills@latest add "$Repo/skills" --agent '*' -y 2>&1 | Write-Host
    $ErrorActionPreference = "Stop"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Error: failed to install hrt-* skills from $Repo/skills"
        exit 1
    }

    $ConfigDir = Split-Path -Parent $Config
    if (-not (Test-Path $ConfigDir)) {
        New-Item -ItemType Directory -Path $ConfigDir -Force | Out-Null
    }

    $Lines = @()
    if (Test-Path $Config) {
        $Lines = Get-Content $Config | Where-Object { $_ -notmatch '^schema:' }
    }
    $Lines += "schema: $SchemaName"
    Set-Content -Path $Config -Value $Lines

    Write-Host "Installed '$SchemaName' -> $Dest"
    Write-Host "Installed skills -> .agents/skills/ (grill-me, grilling, tdd, stride-analysis-patterns, threat-mitigation-mapping, security-requirement-extraction, hrt-align-consistency-review, hrt-apply-code-review, hrt-adversarial-authoring)"
    Write-Host "Set default schema -> $SchemaName ($Config)"
    Write-Host "Use it:  openspec new change <name>"
}
finally {
    Remove-Item -Recurse -Force $Tmp -ErrorAction SilentlyContinue
}
