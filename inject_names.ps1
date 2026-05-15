$dir = "F:\Projek Vibe Koding\pbb-app-laravel\map-data"
Get-ChildItem "$dir\*.gpx" | ForEach-Object {
    $name = $_.BaseName
    $content = Get-Content $_.FullName -Raw -Encoding UTF8
    $newContent = $content -replace '<name></name>', "<name>$name</name>"
    [System.IO.File]::WriteAllText($_.FullName, $newContent, [System.Text.UTF8Encoding]::new($false))
    Write-Output "OK: $($_.Name) -> $name"
}
