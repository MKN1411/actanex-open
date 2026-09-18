# ADR-024: Sachliche Neuausrichtung des Audit-Trails, 2FA-OTP-geschützter Testdaten-Reset und Version 3.0 Härtungs-Roadmap

## Status
Akzeptiert (Accepted) – Präzisiert und überarbeitet ADR-003

## Datum
19. September 2026

## Kontext & Problemstellung
Im Rahmen eines internen Architektur-Reviews der Version 2.13.0 wurde die technische Implementierung des Audit-Trails und der Monatsarchivierung kritisch hinterfragt:
1. **Realitätsabgleich Revisionssicherheit:**
   * In früheren Konzepten (ADR-003) wurde von einem „Merkle-Root-Hash“ und „garantierter Unveränderbarkeit“ gesprochen.
   * Technisch handelte es sich bei `rootHash` jedoch um eine UUID mit Präfix (`SEAL_SHA256_...`) ohne tatsächliche mathematische Merkle-Baumberechnung.
   * Zudem verfügte das System über einen administrativen Endpunkt (`POST /api/v1/audit/clear-logs`), der ohne Barriere alle Audit-Events löschen konnte.
2. **Rechtliche Klarheit:**
   * Software kann für sich isoliert niemals eine GoBD-Konformität des Nutzers garantieren, da GoBD die gesamte betriebliche Organisation des Steuerpflichtigen betrifft.
   * Ein formloser Zwischenbericht oder internes Event-Log darf nicht als verbindliches „GoBD-garantiertes Archiv“ überzeichnet werden.
3. **Bedarf für Testdaten-Reset:**
   * Während der Onboarding- und Entwicklungsphase müssen Test- und Demodaten bereinigt werden können. In einer Produktivumgebung darf dies jedoch keinesfalls versehentlich oder unautorisiert per einfachem Klick geschehen.

---

## Getroffene Entscheidungen

### 1. Weg A: Pragmatische Neuausrichtung & Ehrliche Terminologie (Sofort umgesetzt)
* **Begriffsanpassung:**
  * Entfernung irreführender Begriffe wie „unlöschbares GoBD-Archiv“ oder „Merkle-Tree-Siegelung“.
  * Sachliche Deklaration als **„Audit- & Ereignisprotokolle zur lückenlosen Nachvollziehbarkeit von Projektleistungen und Systemereignissen“**.
* **3-Stufen-Schutz für den Testdaten-Reset:**
  * Der frühere ungesicherte Löschbutton wird zu einem **2FA-abgesicherten Testdaten-Reset (Entwickler-/Testmodus)** umgebaut:
    * **Stufe 1:** Warnmeldung und Bestätigungsdialog.
    * **Stufe 2:** Challenge-Response (Eingabe des Worts `RESET` in Großbuchstaben).
    * **Stufe 3 (2FA / OTP per E-Mail):** Das Backend generiert einen 6-stelligen kryptografischen Einmalcode via `POST /api/v1/audit/request-reset-otp`, versendet diesen per E-Mail an die hinterlegte Freelancer-Adresse (`email_sender_email`) und verifiziert den SHA-256-Hash des Codes serverseitig in `POST /api/v1/audit/clear-logs`.
  * Nach erfolgreichem Reset wird der Vorgang mit dem Event `AUDIT_LOG_RESET` revisionssicher protokolliert.

### 2. Weg B: Roadmap für Version 3.0 (Verbindlich in TODO.md verankert)
Für die kommende Hauptversion 3.0 wird die vollständige mathematische Revisionssicherheit implementiert:
* **Kryptografische SHA-256 Hash-Kette (`audit_events`):** Relationale Verknüpfung jedes Events mit dem Hash des Vorgängers (`previous_event_hash`).
* **Echter Merkle-Tree:** Berechnung eines echten binären Merkle-Tree-Root-Hashes über alle Buchungen eines abgeschlossenen Monats.
* **Integritäts-Verifizierer:** Web-UI-Tool zur mathematischen Validierung der gesamten Blockchain-/Audit-Kette.
* **WORM Object Lock:** Cloudflare R2 Bucket mit aktivierter Compliance-Retention-Policy.

---

## Konsequenzen
* **Positiv:**
  * 100 % Ehrlichkeit und professionelle Stringenz gegenüber Kunden, Steuerberatern und Auditoren.
  * Vollständiger Schutz vor versehentlichem oder unbefugtem Löschen von Protokolldaten durch 2FA-OTP.
  * Klare, transparente Architektur-Roadmap für die Version 3.0.
* **Verhältnis zu ADR-003:**
  * ADR-003 wird durch dieses Decision Record bezüglich der Merkle-Tree-Aussagen historisiert; die echte Merkle-Tree-Implementierung wird auf Version 3.0 terminiert.
