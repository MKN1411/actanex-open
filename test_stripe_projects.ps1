# ==============================================================================
# ActaNex Open – Stripe CLI & Stripe Projects Test-Skript (PowerShell 7)
# ==============================================================================

Write-Host "--- 1. Stripe CLI Pfad & Version prüfen ---" -ForegroundColor Cyan

# Pfad zur installierten Stripe CLI sicherstellen
$stripePath = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Stripe.StripeCli_Microsoft.Winget.Source_8wekyb3d8bbwe"
if ($env:PATH -notlike "*$stripePath*") {
    $env:PATH += ";$stripePath"
}

# Stripe API Schlüssel für den Agenten (wird aus Umgebungsvariable gelesen oder abgefragt)
if (-not $env:STRIPE_API_KEY) {
    Write-Host "Hinweis: STRIPE_API_KEY Umgebungsvariable ist nicht gesetzt." -ForegroundColor Yellow
}

# Version abfragen
stripe --version
Write-Host "✔ Stripe CLI ist einsatzbereit!`n" -ForegroundColor Green

# Test-Projekt-Verzeichnis aufrufen
$projectDir = "C:\Users\Micha\.gemini\antigravity\brain\79e516df-2ed8-43c7-b430-b942d707c035\scratch\test_project"
Set-Location -Path $projectDir

Write-Host "--- 2. Stripe Projects Status abfragen ---" -ForegroundColor Cyan
stripe projects status

Write-Host "`n--- 3. Cloudflare-Dienstekatalog anzeigen ---" -ForegroundColor Cyan
stripe projects catalog cloudflare

Write-Host "`n==============================================================================" -ForegroundColor Yellow
Write-Host "TIPP: Sie können jetzt interaktiv beliebige Stripe-Befehle ausführen, z. B.:" -ForegroundColor Yellow
Write-Host "  stripe projects catalog            # Alle verfügbaren Cloud-Provider anzeigen" -ForegroundColor White
Write-Host "  stripe projects status             # Den aktuellen Projekt-Status prüfen" -ForegroundColor White
Write-Host "  stripe projects billing show       # Hinterlegte Abrechnungsdaten ansehen" -ForegroundColor White
Write-Host "==============================================================================" -ForegroundColor Yellow
