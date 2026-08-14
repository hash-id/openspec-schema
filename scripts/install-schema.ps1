#Requires -Version 5.1
$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false

$Repo = "hash-id/openspec-schema"
$SchemaName = "tempa-spec"
$SchemaPath = "openspec/schemas/$SchemaName"
$Ref = if ($args.Count -gt 0) { $args[0] } else { "" }

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
if (-not (Test-CommandExists "npm")) {
    Write-Error "Error: npm (Node.js) is required."
    exit 1
}
if (-not (Test-CommandExists "node")) {
    Write-Error "Error: node (Node.js) is required."
    exit 1
}

$Dest = Join-Path (Get-Location) "openspec/schemas/$SchemaName"
$Config = Join-Path (Get-Location) "openspec/config.yaml"

if ($Repo -match '^(http|git@)') {
    $Url = $Repo
} else {
    $Url = "https://github.com/$Repo.git"
}

if ([string]::IsNullOrEmpty($Ref)) {
    $ErrorActionPreference = "Continue"
    $TagLines = git ls-remote --tags --sort='-v:refname' $Url 2>$null
    $ErrorActionPreference = "Stop"
    $Ref = ($TagLines | Where-Object { $_ -notmatch '\^\{\}$' } | Select-Object -First 1) -replace '.*refs/tags/', ''
    if ([string]::IsNullOrEmpty($Ref)) {
        Write-Error "Error: no tags found on $Url and no ref given"
        exit 1
    }
}

$Tmp = Join-Path ([System.IO.Path]::GetTempPath()) ([System.IO.Path]::GetRandomFileName())
New-Item -ItemType Directory -Path $Tmp | Out-Null

try {
    Write-Host "Fetching '$SchemaName' from $Url (ref $Ref)..."
    $ErrorActionPreference = "Continue"
    git clone --depth 1 --branch $Ref $Url "$Tmp/repo" 2>&1 | Out-Null
    $ErrorActionPreference = "Stop"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Branch/tag clone failed, trying '$Ref' as a commit SHA..."
        New-Item -ItemType Directory -Path (Join-Path $Tmp "repo") -Force | Out-Null
        $ErrorActionPreference = "Continue"
        git -C "$Tmp/repo" init -q 2>&1 | Write-Host
        git -C "$Tmp/repo" remote add origin $Url 2>&1 | Write-Host
        git -C "$Tmp/repo" fetch --depth 1 origin $Ref 2>&1 | Write-Host
        $FetchOk = ($LASTEXITCODE -eq 0)
        if ($FetchOk) {
            git -C "$Tmp/repo" checkout -q FETCH_HEAD 2>&1 | Write-Host
            $FetchOk = ($LASTEXITCODE -eq 0)
        }
        $ErrorActionPreference = "Stop"
        if (-not $FetchOk) {
            Write-Error "Error: failed to fetch $Url at ref $Ref (tried as branch/tag and as commit SHA)`n       (private repo? use an SSH url or a token: https://github.com/settings/tokens)"
            exit 1
        }
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
    "" | npx --yes skills@latest add mattpocock/skills --skill grilling tdd diagnosing-bugs --agent '*' -y 2>&1 | Write-Host
    $ErrorActionPreference = "Stop"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Error: failed to install grilling/tdd/diagnosing-bugs from mattpocock/skills"
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
    $ErrorActionPreference = "Continue"
    "" | npx --yes skills@latest add blader/humanizer --skill humanizer --agent '*' -y 2>&1 | Write-Host
    $ErrorActionPreference = "Stop"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Error: failed to install humanizer from blader/humanizer"
        exit 1
    }

    $ConfigDir = Split-Path -Parent $Config
    if (-not (Test-Path $ConfigDir)) {
        New-Item -ItemType Directory -Path $ConfigDir -Force | Out-Null
    }

    Write-Host "Writing schema + tooling context to $Config..."
    $ErrorActionPreference = "Continue"
    Push-Location $Tmp
    "" | npm install --no-save --silent yaml 2>&1 | Write-Host
    Pop-Location
    $ErrorActionPreference = "Stop"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Error: failed to install the 'yaml' npm package for config merging"
        exit 1
    }
    Copy-Item (Join-Path $Tmp "repo/scripts/merge-config.cjs") (Join-Path $Tmp "merge-config.cjs")
    $ContextMarker = "# tempa-spec: tooling preference"
    $ContextText = "MUST use codegraph and ripgrep (``rg``) together for all codebase exploration, in every phase of this schema. Use codebase-memory-mcp or built-in grep/glob only if both are unavailable."
    $ErrorActionPreference = "Continue"
    node (Join-Path $Tmp "merge-config.cjs") $Config $SchemaName $ContextMarker $ContextText
    $ErrorActionPreference = "Stop"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Error: failed to write $Config"
        exit 1
    }

    Write-Host "Installed '$SchemaName' -> $Dest"
    Write-Host "Installed skills -> .agents/skills/ (grilling, tdd, diagnosing-bugs, stride-analysis-patterns, threat-mitigation-mapping, security-requirement-extraction, hrt-align-consistency-review, hrt-apply-code-review, hrt-adversarial-authoring, plain-language-writing, humanizer)"
    Write-Host "Set default schema -> $SchemaName ($Config)"
    Write-Host "Use it:  openspec new change <name>"
}
finally {
    Remove-Item -Recurse -Force $Tmp -ErrorAction SilentlyContinue
}
