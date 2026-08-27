# ADR-019: ActaNex V3 – Modulare SPA- und Service-Architektur

## Status
Akzeptiert (Version 3.0)

## Kontext
Im Zuge der Weiterentwicklung von Version 2.x zu Version 3.0 (ActaNex / ACNX) stieg der Funktionsumfang erheblich an. Ein monolithischer Ansatz im Frontend und Backend erschwerte die gezielte Wartung und Erweiterung. Zudem sollte ein modernes Desktop-Layout (zweigeteilte Sidebar + Slide-Over Drawer von rechts mit integrierter Belegvorschau) implementiert werden, ohne auf veraltete `<iframe>`-Technologien zurückzugreifen.

## Entscheidung
1. **Frontend-Architektur:** Einführung einer schlanken Single-Page Application (SPA) mit nativer Subsite-Struktur für mobile PWAs (`/pwa/time-tracker.html` und `/pwa/receipt-inbox.html`).
2. **Backend-Service-Entkopplung:** Strukturierung der Backend-Fachlogik im Cloudflare Worker in eigenständige Service-Klassen:
   - `AiEngine` (Vision OCR, Confidence-Scoring, Vendor Learning)
   - `DocumentVault` (Zentrales R2-Dokumentenarchiv & GoBD SHA-256 Hashing)
   - `TaxComplianceEngine` (VMA-Pauschalen § 9 EStG, Pendlersätze)
   - `LexwareConnector` (Entkoppelter REST-Client für Lexware Office API)
3. **Desktop-Layout:** Zweigeteiltes linkes Menü (feste Icon-Rail + auf-/einklappbare Submenü-Spalte) und Slide-Over Drawer von rechts für Detailbearbeitung und Belegvorschau.

## Konsequenzen
- **Vorteile:** Klare Modularität, extrem schnelle Ladezeiten, zukunftssicher erweiterbar, keine iFrame-Nachteile.
- **Wartung:** Jedes Modul und jeder Service kann unabhängig voneinander gewartet und getestet werden.

> [!IMPORTANT]
> **Haftungs- & Steuerrechts-Disclaimer:**
> Diese Architektur und alle darin enthaltenen Berechnungs- und Automatisierungsfunktionen stellen ein rein technisches Hilfsmittel dar. Es werden keinerlei Garantien, Erfolgszusagen oder steuerliche/rechtliche Beratungsleistungen erbracht. Die vollständige Prüfpflicht verbleibt beim Anwender.
