# Assembles index.html from src/template.html + src/parts/part*.html.
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$utf8 = New-Object System.Text.UTF8Encoding $false
$parts = Get-ChildItem "src/parts/part*.html" | Sort-Object Name
$partsHtml = ($parts | ForEach-Object {
    [System.IO.File]::ReadAllText($_.FullName, $utf8)
}) -join "`n`n"

$template = [System.IO.File]::ReadAllText("$PSScriptRoot\src\template.html", $utf8)
$result = $template.Replace("<!-- PARTS -->", $partsHtml)
[System.IO.File]::WriteAllText("$PSScriptRoot\index.html", $result, $utf8)

Write-Host "index.html built from $($parts.Count) parts"
