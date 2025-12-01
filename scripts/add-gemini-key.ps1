# Add Gemini API key to .env.local
# Run this in PowerShell

$envFile = ".env.local"
$geminiKey = "GEMINI_API_KEY=AIzaSyDl6E4BuJbQoDvocd1IoiFVM5uz5L-qlIg"

# Check if file exists
if (Test-Path $envFile) {
    # Check if GEMINI_API_KEY or GROQ_API_KEY already exists
    $content = Get-Content $envFile
    $hasGeminiKey = $content | Select-String -Pattern "^GEMINI_API_KEY="
    $hasGroqKey = $content | Select-String -Pattern "^GROQ_API_KEY="
    
    if ($hasGeminiKey) {
        Write-Host "GEMINI_API_KEY already exists in .env.local" -ForegroundColor Yellow
    } else {
        # Add the key
        Add-Content -Path $envFile -Value "`n$geminiKey"
        Write-Host "Added GEMINI_API_KEY to .env.local" -ForegroundColor Green
    }
    
    # Comment out GROQ_API_KEY if it exists
    if ($hasGroqKey) {
        $newContent = $content -replace "^GROQ_API_KEY=", "# GROQ_API_KEY="
        Set-Content -Path $envFile -Value $newContent
        Write-Host "Commented out GROQ_API_KEY in .env.local" -ForegroundColor Yellow
    }
} else {
    Write-Host ".env.local not found! Please create it first." -ForegroundColor Red
}

Write-Host "`nDone! Restart your development server (npm run dev) for changes to take effect." -ForegroundColor Cyan
