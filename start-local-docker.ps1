# ==============================================================================
# FREELANCER EVIDENCE & BILLING HUB - LOKALER DOCKER DESKTOP STARTER
# ==============================================================================
# Dieses Skript startet den Evidence Hub vollkommen autark und lokal in Docker.
# Es werden KEINE Daten an Cloudflare gesendet.
# ==============================================================================

# ------------------------------------------------------------------------------
# 🔧 1. KONFIGURATION & VARIABLEN (Hier bei Bedarf anpassen)
# ------------------------------------------------------------------------------
$FrontendPort     = 8080                                      # Lokaler Web-Port (Standard: 8080)
$BackendPort      = 8787                                      # Lokaler API-Port (http://localhost:8787)
$LexwareApiKey    = "IHR_LEXWARE_API_KEY_HIER_EINTRAGEN"      # Optional: Lexware API Key
$ResendApiKey     = "IHR_RESEND_API_KEY_HIER_EINTRAGEN"       # Optional: E-Mail Key für OTP
$GeminiApiKey     = if ($env:GEMINI_API_KEY) { $env:GEMINI_API_KEY } else { "" } # Optional: Google Gemini API Key
$JwtSecret        = "lokaler-geheimer-schluessel-mindestens-32-zeichen"
$ContainerName    = "evidence-hub-local"
$ProjectDirectory = $PSScriptRoot                             # Verwendet automatisch das aktuelle Skript-Verzeichnis

# Prüfen, ob Port 8080 bereits durch einen anderen Prozess belegt ist
$portConflict = Get-NetTCPConnection -LocalPort $FrontendPort -State Listen -ErrorAction SilentlyContinue
if ($portConflict) {
    Write-Host "⚠️ Port $FrontendPort ist auf dem Host bereits belegt. Wechsle automatisch auf Port 8085..." -ForegroundColor Yellow
    $FrontendPort = 8085
}

# ------------------------------------------------------------------------------
# 🔍 2. SYSTEMPRÜFUNG: DOCKER DESKTOP & LOKALE KI-SERVICES
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

# 🤖 2.1 KI-Umgebungsprüfung (Ollama, Docker Model Runner & Gemini)
Write-Host ""
Write-Host "🤖 Prüfe KI-Infrastruktur..." -ForegroundColor Cyan
$ollamaActive = $false
try {
    $ollamaCheck = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -TimeoutSec 1 -ErrorAction SilentlyContinue
    if ($ollamaCheck -and $ollamaCheck.models) {
        $ollamaActive = $true
        $modelNames = ($ollamaCheck.models | ForEach-Object { $_.name }) -join ", "
        Write-Host "   🟢 Lokaler Ollama AI Server erkannt (Port 11434)" -ForegroundColor Green
        Write-Host "      Verfügbare lokale Modelle: $modelNames" -ForegroundColor DarkGray
    }
} catch {
    # Kein lokaler Ollama-Port aktiv
}

if (-not $ollamaActive) {
    Write-Host "   ⚪ Kein lokaler Ollama AI Server auf Port 11434 gefunden (optional für 100% Offline-KI)." -ForegroundColor DarkGray
}

if ($GeminiApiKey -and $GeminiApiKey.Length -gt 5) {
    Write-Host "   🟢 Google Gemini API Key konfiguriert (Cloud-Vision & Beleg-KI aktiv)" -ForegroundColor Green
} else {
    Write-Host "   ℹ️ Google Gemini API Key noch nicht hinterlegt (kann direkt in den Einstellungen der Web-App eingegeben werden)." -ForegroundColor DarkYellow
}

# ------------------------------------------------------------------------------
# 📦 3. UMGEBUNGSVARIABLEN SETZEN & DOCKER COMPOSE AUSFÜHREN
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "🔧 Konfiguriere Umgebungsvariablen..." -ForegroundColor Cyan
$env:PORT_FRONTEND   = $FrontendPort
$env:PORT_BACKEND    = $BackendPort
$env:LEXWARE_API_KEY = $LexwareApiKey
$env:RESEND_API_KEY  = $ResendApiKey
$env:GEMINI_API_KEY  = $GeminiApiKey
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
