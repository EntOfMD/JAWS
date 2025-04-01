Write-Host "Starting formatting..."

# File extensions to process
$extensions = @("*.js", "*.json", "*.jsx", "*.ts", "*.tsx", "*.css", "*.scss", "*.html", "*.md")

# Get all files recursively, excluding node_modules
foreach ($ext in $extensions) {
    Get-ChildItem -Path . -Filter $ext -Recurse -Exclude "node_modules" | 
    Where-Object { $_.FullName -notlike "*\node_modules\*" } |
    ForEach-Object {
        Write-Host "Formatting: $($_.FullName)"
        npx prettier --write $_.FullName --end-of-line lf
    }
}

Write-Host "Formatting complete!"
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')