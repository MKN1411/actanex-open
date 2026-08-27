# ADR-014: Cross-Device Mobile QR-Code Beleg-Erfassung & Ephemere Session-Sicherheit

## Status
**Akzeptiert (Accepted)** — 2026-08-24 (Release v2.8.0)

## Kontext & Problemstellung
Die Webanwendung des Freelancer Evidence & Billing Hubs ist auf hochauflösenden Desktop- und Laptop-Monitoren für Controlling, Zeiterfassung, Freigabeverwaltung und Buchhaltungs-Exporte optimiert. 

Wenn der Freiberufler am Schreibtisch sitzt und einen physischen Papierbeleg (z. B. Restaurant-Rechnung oder Taxi-Quittung) erfassen möchte, ist der Umweg über E-Mail, Cloud-Ordner oder AirDrop umständlich. Das direkte Aufrufen der komplexen Hauptanwendung auf dem kleinen Smartphone-Bildschirm wäre wiederum überfrachtet, erfordert einen Login und birgt die Gefahr von Fehlbedienungen.

## Entscheidung
Wir etablieren ein **Cross-Device Mobile QR-Upload-Verfahren** mit ephemeren (kurzlebigen), kryptografisch gesicherten Einmal-Sessions:

### 1. Ablauf & Architektur
1. **Session-Erstellung am Desktop:**
   - Klick auf `📱 Smartphone QR-Scan` ruft `POST /api/v1/vouchers/upload-session/create` auf.
   - Der Server generiert ein kryptografisches Token: `scan_` + 24 Zufallsbytes (Hex-kodiert).
   - Die Session wird in der D1-Tabelle `voucher_upload_sessions` mit Status `pending` und einem TTL-Ablaufzeitstempel von **15 Minuten** gespeichert.
   - Der Desktop generiert lokal im Browser einen QR-Code mit der URL: `https://[domain]/?uploadSession=scan_[token]`.

2. **Kamera-Erfassung am Smartphone:**
   - Der Nutzer scannt den QR-Code mit der nativen Smartphone-Kamera-App (iOS Camera / Android Lens).
   - Die Web-App erkennt den Parameter `?uploadSession=` beim Laden (`DOMContentLoaded`) und schaltet sofort in die **Vollbild-Mobilansicht** (`#mobile-upload-view`).
   - Alle Desktop-Menüs, Sidebar, Header und geschützten Verwaltungsdaten werden ausgeblendet.

3. **Multi-Foto Upload ($1..n$ Belege):**
   - Das Smartphone nutzt die HTML5 Media Capture API:
     ```html
     <input type="file" accept="image/*" capture="environment" multiple>
     ```
   - Der Nutzer kann $1..n$ Fotos schießen (z. B. Gastro-Rechnung + Kartenzahlungsslip + Parkschein).
   - Nach Bestätigung sendet das Smartphone die Dateien an `POST /api/v1/vouchers/upload-session/:sessionId/upload`.
   - Der Worker speichert die Dateien im Cloudflare R2-Storage und setzt den Status der Session auf `ready`.

4. **Desktop-Übernahme & KI-Trigger:**
   - Der Desktop pollt den Status alle 2 Sekunden (`GET /api/v1/vouchers/upload-session/:sessionId/status`).
   - Sobald `ready` gemeldet wird, schließt sich das QR-Modal, das Desktop-Belegformular öffnet sich mit den Vorschaubildern, und der Cloudflare Workers AI Vision Scanner extrahiert die Belegdaten.

---

## 🔒 Sicherheitsanalyse & Best Practices

### A. Eindeutigkeit & Kryptografische Entropie
- Jedes Session-Token besitzt mindestens **192 Bit Entropie** (`crypto.getRandomValues()`). Ein Brute-Force-Erraten ist mathematisch ausgeschlossen.
- Jede Session ist an den ausstellenden Tenant bzw. Worker gebunden.

### B. Zeitliche Begrenzung (TTL) – Warum 15 Minuten Best Practice sind
- **Empfohlene Best Practice:** 10 bis 15 Minuten.
  - *Zu kurz (z. B. 2–3 Minuten):* Der Nutzer muss den QR-Code scannen, die Kamera fokussieren, 2 bis 3 Belege (Vorder-/Rückseite, EC-Slip) nacheinander abfotografieren und bei schlechtem Mobilfunknetz übertragen. Ein 3-Minuten-Timeout führt hierbei zu frustrierenden Abbrüchen.
  - *Zu lang (> 30 Minuten):* Erhöht das Fenster für ungenutzte verwaiste Sessions.
  - **15 Minuten** bieten die optimale Balance aus stressfreier Bedienung und strikter Eingrenzung der Angriffsfläche.
- Abgelaufene Sessions werden serverseitig bei jeder Anfrage via SQL (`WHERE expires_at_utc < CURRENT_TIMESTAMP`) abgewiesen und bereinigt.

### C. Smartphone-Berechtigungen & Datenschutz (Zero-App Footprint)
- **Keine App-Installation erforderlich:** Funktioniert in Safari (iOS) und Chrome/Firefox (Android) rein webbasiert.
- **Kein Vollzugriff auf private Fotogalerie:** 
  - Durch das HTML5-Attribut `capture="environment"` öffnet das Betriebssystem direkt den Sucher der Rückkamera.
  - Die Webanwendung erhält ausschließlich Zugriff auf genau die Fotos, die der Nutzer in dieser Interaktion aufnimmt.
  - Es besteht kein permanenter Zugriff auf Standort, Kontakte oder sonstige Gerätedaten.
- **Kein persistenter lokaler Speicher auf dem Smartphone:**
  - Die Bilddaten werden im Arbeitsspeicher gehalten, per HTTPS an Cloudflare übertragen und nach dem Schließen des Browser-Tabs rückstandslos verworfen.

## Konsequenzen
- Extrem hohe Bediengeschwindigkeit beim Digitalisieren von Papierbelegen am Arbeitsplatz.
- Vollständige Einhaltung des Zero-Trust- und Least-Privilege-Prinzips.
- Keine Notwendigkeit für native iOS/Android App-Store-Deployments.
