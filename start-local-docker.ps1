# ==============================================================================
# FREELANCER EVIDENCE & BILLING HUB - LOKALER DOCKER DESKTOP STARTER
# ==============================================================================
# Dieses Skript startet den Evidence Hub vollkommen autark und lokal in Docker.
# Es werden KEINE Daten an Cloudflare gesendet.
# ==============================================================================

# ------------------------------------------------------------------------------
# 🔧 1. KONFIGURATION & VARIABLEN (Hier bei Bedarf anpassen)
# ------------------------------------------------------------------------------
$FrontendPort     = 8080                                      # Lokaler Web-Port (http://localhost:8080)
$BackendPort      = 8787                                      # Lokaler API-Port (http://localhost:8787)
$LexwareApiKey    = "IHR_LEXWARE_API_KEY_HIER_EINTRAGEN"      # Optional: Lexware API Key
$ResendApiKey     = "IHR_RESEND_API_KEY_HIER_EINTRAGEN"       # Optional: E-Mail Key für OTP
$JwtSecret        = "lokaler-geheimer-schluessel-mindestens-32-zeichen"
$ContainerName    = "evidence-hub-local"
$ProjectDirectory = $PSScriptRoot                             # Verwendet automatisch das aktuelle Skript-Verzeichnis

# ------------------------------------------------------------------------------
# 🔍 2. SYSTEMPRÜFUNG: DOCKER DESKTOP
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  🚀 Freelancer Evidence Hub - Lokaler Start (Docker)      " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Prüfen, ob Docker installiert ist
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker wurde nicht gefunden!" -ForegroundColor Red
    Write-Host "👉 Bitte installieren Sie Docker Desktop für Windows: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    Exit 1
}

# Prüfen, ob Docker Desktop aktuell läuft
docker info > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ Docker Desktop läuft noch nicht!" -ForegroundColor Yellow
    Write-Host "⏳ Starte Docker Desktop... Bitte warten Sie einen Moment..." -ForegroundColor Cyan
    
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe" -ErrorAction SilentlyContinue
    
    $timeoutSeconds = 60
    $elapsed = 0
    while ($elapsed -lt $timeoutSeconds) {
        Start-Sleep -Seconds 3
        $elapsed += 3
        docker info > $null 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Docker Desktop ist jetzt betriebsbereit!" -ForegroundColor Green
            break
        }
        Write-Host "   Warte auf Docker Engine ($elapsed / $timeoutSeconds s)..." -ForegroundColor DarkGray
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Docker Desktop konnte nicht automatisch gestartet werden. Bitte starten Sie Docker Desktop manuell." -ForegroundColor Red
        Exit 1
    }
} else {
    Write-Host "✅ Docker Desktop ist aktiv und bereit." -ForegroundColor Green
}

# ------------------------------------------------------------------------------
# 📦 3. UMGEBUNGSVARIABLEN SETZEN & DOCKER COMPOSE AUSFÜHREN
# ------------------------------------------------------------------------------
Write-Host "🔧 Konfiguriere Umgebungsvariablen..." -ForegroundColor Cyan
$env:PORT_FRONTEND   = $FrontendPort
$env:PORT_BACKEND    = $BackendPort
$env:LEXWARE_API_KEY = $LexwareApiKey
$env:RESEND_API_KEY  = $ResendApiKey
$env:JWT_SECRET      = $JwtSecret

Set-Location $ProjectDirectory

Write-Host "🐳 Starte lokale Container..." -ForegroundColor Cyan
docker compose up -d --remove-orphans

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "  ✅ EVIDENCE HUB WURDE ERFOLGREICH LOKAL GESTARTET!        " -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Web-Oberfläche:   http://localhost:$FrontendPort" -ForegroundColor White
    Write-Host "⚡ Lokale API:       http://localhost:$BackendPort" -ForegroundColor White
    Write-Host "📂 Quellordner:      $ProjectDirectory" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "💡 Nützliche Befehle:" -ForegroundColor Yellow
    Write-Host "   - Status / Logs anzeigen:   docker compose logs -f" -ForegroundColor DarkGray
    Write-Host "   - Container stoppen:        docker compose down" -ForegroundColor DarkGray
    Write-Host "   - Container neu starten:    docker compose restart" -ForegroundColor DarkGray
    Write-Host ""
    
    # Automatisch Browser öffnen
    Start-Process "http://localhost:$FrontendPort"
} else {
    Write-Host "❌ Fehler beim Starten der Docker-Container." -ForegroundColor Red
}
