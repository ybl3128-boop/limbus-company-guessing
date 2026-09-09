$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

& node ".\scripts\update-data.mjs"
if ($LASTEXITCODE -ne 0) {
  throw "Limbus identity data update failed with exit code $LASTEXITCODE."
}
