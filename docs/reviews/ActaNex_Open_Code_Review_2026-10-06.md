# ActaNex Open – erneuter statischer Review vom 06.10.2026

Repository: MKN1411/actanex-open
Geprüfter Commit: 2115a487a03682b89a7c32140c7f7a56d40bd2be
Vergleichsbasis: 5da781235d9b3ccb7675974f38e28685afb5052c (Review 05.10.2026)

## Ergebnis

Die Umstellung bringt wesentliche Verbesserungen: modulare aktive Worker-Routen/Services, zentrale Authentifizierung, eine Empfängerliste für OTP, echte Digest-Aufrufe, dynamische Backup-Tabellenerkennung, gesperrter Audit-Reset sowie getrennte Docker-Services mit Loopback-Bindung und Healthcheck. Die alte pauschale Aussage, alle fachlichen APIs seien ungeschützt, gilt für diesen Stand nicht mehr.

Es verbleiben 12 dokumentierte Befunde: 1 kritisch, 7 hoch, 4 mittel. Besonders relevant sind die Wiederherstellung des Demo-Administrators, öffentliche Datenzugriffe, Deployment-Seeding, unvollständige Integritätsprüfung und der neue Upsert-Pfad für historische Zeiten. Keine Freigabe für produktiven Einsatz allein aufgrund dieses statischen Reviews.

## Methode und Grenzen

Aktueller main-Commit wurde festgehalten. Der GitHub-Vergleich listet sehr viele entfernte Builddateien; die Compare-Dateiliste kann begrenzt sein. Deshalb wurde zusätzlich der komplette aktuelle Repositorybaum gelesen und die neue Worker-Struktur direkt geprüft. Gelesen wurden der aktive Einstieg und sämtliche Route-/Service-/Utility-Dateien, die aktualisierten PWAs, API-Client, Docker- und Deploymentdateien sowie ausgewählte Dokumentation.

Lokale Ausführung scheitert weiterhin vor dem Shell-Start an der Windows-Sandbox („managed networking requires the elevated Windows sandbox backend“). Kein Build, Browser-/Docker-/Restore-Test oder PSScriptAnalyzer-Lauf. Keine produktiven API-Aufrufe, keine Cloudflare-Änderungen. Der Bericht gilt für Quellcode, nicht als Nachweis des tatsächlich deployten Live-Stands. Secrets und vollständige Git-Historie wurden nicht geprüft.

## Status der alten Befunde

| Alt | Status | Begründung |
|---|---|---|
| A01 API-Autorisierung | Teilweise behoben | Middleware vorhanden; öffentliche Datenpfade bleiben, siehe B02 |
| A02 Sonderzugänge | Weiterhin kritisch | Master-Bypass entfernt; Demo-Self-Healing bleibt, B01 |
| A03 OTP | Teilweise behoben | Empfängerliste ergänzt; Abschlussidentität/Codeverbrauch offen, B04 |
| A04 Deployment-Seeds | Offen | Reguläres deploy.yml führt weiterhin alle 00*.sql aus, B03 |
| A05 API-Adressen | Teilweise behoben | Override ergänzt, persönliche Fallbacks bleiben, B10 |
| A06 mobile Zeit-API | Ursprünglicher Vertragsfehler behoben | Passende Route/Payload/Auth ergänzt; Rohzeit und Upsert neu prüfen, B07/B08 |
| A07 mobile Belege | Teilweise behoben | Upload/KI-Aufruf ergänzt, Zufallsbetrag entfernt; Schema/Inbox offen, B09 |
| A08 Integrität | Teilweise behoben | Echte Digests vorhanden, relevante Inhalte fehlen, B05 |
| A09 Audit-Löschung | Im aktiven Pfad behoben | clear-logs liefert 403 statt DELETE |
| A10 Backup-Tabellen | Teilweise behoben | Dynamische Erkennung; Text-/Restore-Probleme bleiben, B06 |
| A11 Upload-TTL | Offen; zusätzlich Funktionsregression | Keine TTL-Prüfung und QR-Middleware blockiert Blind-Drop, B11 |
| A12 Architektur | Wesentlich behoben | Aktiver Worker nutzt neue Routen und Services |
| A13 alter TaxCompliance-Baustein | Entfallen | Alte ungenutzte Klasse entfernt; keine vollständige fachliche Neubewertung |
| A14 Docker | Wesentlich verbessert | Zwei Services, Healthcheck, Loopback; Port-/Installerabgleich weiterhin zu testen |
| A15 .NET-Workflows | Entfallen | Engine und betroffene Workflows entfernt |
| A16 Build-Artefakte | Teilweise bereinigt | .NET-bin/obj entfernt; Worker-dist, .wrangler-Cache und output weiter vorhanden |

## Offene und neue Befunde

### B01 – Kritisch: Demo-Administrator wird weiterhin automatisch zurückgesetzt

Fundstellen: [src/Worker/src/services/auth.service.ts:44–58](https://github.com/MKN1411/actanex-open/blob/2115a487a03682b89a7c32140c7f7a56d40bd2be/src/Worker/src/services/auth.service.ts#L44-L58); [src/Worker/src/services/db_bootstrap.service.ts:34–55](https://github.com/MKN1411/actanex-open/blob/2115a487a03682b89a7c32140c7f7a56d40bd2be/src/Worker/src/services/db_bootstrap.service.ts#L34-L55)

Der allgemeine isMasterMatch-Bypass wurde entfernt. Dennoch ersetzt handleLogin das Demo-Administratorkonto, wenn es fehlt oder einen anderen Passwort-Hash besitzt, durch einen festen Hash und aktiviert es. Dies erfolgt vor der Passwortprüfung und ohne serverseitige Begrenzung auf eine separate Demo-Umgebung. ensureAuthTables erstellt das Demo-Konto zudem bei Fehlen erneut. Individuelle Passwortänderung, E-Mail-Änderung oder Deaktivierung verhindern die Wiederherstellung damit weiterhin nicht zuverlässig.

Korrektur und Abnahme: Self-Healing aus dem normalen Login entfernen. Demo-Benutzer nur in ausdrücklich getrennten Demo-Instanzen provisionieren. Ersteinrichtung als einmaligen administrativen Vorgang mit individuellen Zugangsdaten gestalten; danach alte Sitzungen widerrufen. Abnahme: Änderungen und Deaktivierung bleiben nach Anmeldung und Neustart erhalten.

### B02 – Hoch: Öffentliche Ausnahmen geben Geschäfts- und Belegdaten frei

Fundstellen: [src/Worker/src/index.ts:66–131](https://github.com/MKN1411/actanex-open/blob/2115a487a03682b89a7c32140c7f7a56d40bd2be/src/Worker/src/index.ts#L66-L131); [src/Worker/src/index.ts:138–153](https://github.com/MKN1411/actanex-open/blob/2115a487a03682b89a7c32140c7f7a56d40bd2be/src/Worker/src/index.ts#L138-L153); [src/Worker/src/routes/timesheets_approval.routes.ts:678–768](https://github.com/MKN1411/actanex-open/blob/2115a487a03682b89a7c32140c7f7a56d40bd2be/src/Worker/src/routes/timesheets_approval.routes.ts#L678-L768)

Die zentrale Middleware schützt viele interne Routen, nimmt aber Diagnostik, Belegdownloads, PDF-/Signaturdownloads und approval-data aus. Diagnostik liefert ohne Sitzung aktuelle Audit-Beschreibungen und Bestandszahlen. approval-data liefert bei Kenntnis einer Nachweis-ID Projektwerte, Ansprechpartner, Freigeberadressen, Zeiten und Reisen ohne weitere Prüfung. Beleg-Routen lesen bekannte Objektkeys ohne zweckgebundenes Zugriffstoken. Nicht jeder öffentliche Kundenpfad ist daher allein durch seine Routenbezeichnung sicher.

Korrektur und Abnahme: Diagnostik auf Admins begrenzen. Öffentliche Freigaben und Downloads mit kurzlebigen, dokumentgebundenen Capability-Tokens beziehungsweise signierten Links absichern. Prüfung innerhalb des Endpunkts einschließlich Ablauf und erlaubter Aktion. Abnahme: eine ID oder ein R2-Key allein erlaubt keinen Zugriff.

### B03 – Hoch: Reguläres Deployment spielt weiterhin Demo-Seeds ein

Fundstellen: [.github/workflows/deploy.yml:52–62](https://github.com/MKN1411/actanex-open/blob/2115a487a03682b89a7c32140c7f7a56d40bd2be/.github/workflows/deploy.yml#L52-L62); [src/Worker/db/0002_seed_data.sql:9–56](https://github.com/MKN1411/actanex-open/blob/2115a487a03682b89a7c32140c7f7a56d40bd2be/src/Worker/db/0002_seed_data.sql#L9-L56)

deploy.yml ist weiterhin unverändert: Jede 00*.sql-Datei wird ausgeführt, einschließlich 0002_seed_data.sql mit INSERT OR REPLACE. Einstellungen und gleichnamige Daten können bei wiederholten Deployments durch Seed-Werte ersetzt werden. Alle SQL-Fehler werden unterdrückt. Die Umstrukturierung des Workers hat diesen Deployment-Befund nicht behoben.

Korrektur und Abnahme: Seeds aus regulären Migrationen ausschließen und nur ausdrücklich in Demo-Datenbanken ausführen. Migrationshistorie und verbindliche Abschlussprüfung einführen. Abnahme: Wiederholungsdeployment bewahrt Benutzerdaten und individuelle Einstellungen.

### B04 – Hoch: OTP-Empfängerprüfung verbessert, Abschlussidentität weiter manipulierbar

Fundstellen: [src/Worker/src/routes/timesheets_approval.routes.ts:802–811](https://github.com/MKN1411/actanex-open/blob/2115a487a03682b89a7c32140c7f7a56d40bd2be/src/Worker/src/routes/timesheets_approval.routes.ts#L802-L811); [src/Worker/src/routes/timesheets_approval.routes.ts:857–907](https://github.com/MKN1411/actanex-open/blob/2115a487a03682b89a7c32140c7f7a56d40bd2be/src/Worker/src/routes/timesheets_approval.routes.ts#L857-L907)

request-otp weist nicht gelistete Empfänger jetzt zurück. verify-otp übernimmt aber weiterhin body.email in approved_by und approver_email, ohne sie an validOtp.email zu binden. Der Codeverbrauch und die Freigabe erfolgen getrennt ohne bedingtes atomisches Update. Es fehlen im geprüften Pfad Versuchslimits; der gespeicherte Dokumenthash wird mit VERIFIED_VIA_OTP ersetzt. Die Kundene-Mail wird auch bei expliziten Projektfreigebern zusätzlich zugelassen, während approval-data sie nur als Fallback ausweist.

Korrektur und Abnahme: Identität ausschließlich aus dem verifizierten OTP-Datensatz übernehmen. Empfängerrichtlinie vereinheitlichen, echten Dokumentversionshash binden, Codeverbrauch/Zustandswechsel atomar ausführen und Versuchslimits implementieren. Abnahme: gültiger Code mit anderer body.email kann keine fremde Identität protokollieren; parallele Wiederholung erzeugt keine zweite Freigabe.

### B05 – Hoch: Neue Hashes erfassen nicht die vollständigen Nachweisinhalte

Fundstellen: [src/Worker/src/routes/timesheets_approval.routes.ts:220–233](https://github.com/MKN1411/actanex-open/blob/2115a487a03682b89a7c32140c7f7a56d40bd2be/src/Worker/src/routes/timesheets_approval.routes.ts#L220-L233); [src/Worker/src/services/gobd_vault.service.ts:100–120](https://github.com/MKN1411/actanex-open/blob/2115a487a03682b89a7c32140c7f7a56d40bd2be/src/Worker/src/services/gobd_vault.service.ts#L100-L120); [src/Worker/src/routes/trips_expenses.routes.ts:1150–1150](https://github.com/MKN1411/actanex-open/blob/2115a487a03682b89a7c32140c7f7a56d40bd2be/src/Worker/src/routes/trips_expenses.routes.ts#L1150-L1150)

Die Hauptpfade verwenden jetzt echte SHA-256-Digests. Der Monats-Hash lässt aber actor, description und data_payload_json aus. Änderungen dieser Audit-Inhalte bei gleichbleibenden IDs/Zeitstempeln/Typen verändern den Hash nicht. Der Nachweis-Hash lässt unter anderem Tätigkeitsbeschreibung, Evidence-Felder und PDF-Bytes aus und enthält den aktuellen Generierungszeitpunkt. Das ist kein Hash der eingefrorenen PDF und keine vollständige Inhaltsprüfung. Der Reisebericht verwendet weiterhin eine Zufalls-UUID mit SHA256_TRIP-Präfix.

Korrektur und Abnahme: Kanonischen vollständigen Datensatz und separat die PDF-Bytes hashen; gespeicherten Snapshot für Verifikation verwenden. Alle relevanten Audit-Felder in die Hash-Kette aufnehmen. Hash-Kette als solche dokumentieren statt als Merkle-Baum. Abnahme: Änderung jedes relevanten Inhaltsfelds muss erkannt werden.

### B06 – Hoch: SQL-Backup verändert Zeilenumbrüche und bleibt kein vollständiges Restore-Paket

Fundstellen: [src/Worker/src/services/gobd_vault.service.ts:148–225](https://github.com/MKN1411/actanex-open/blob/2115a487a03682b89a7c32140c7f7a56d40bd2be/src/Worker/src/services/gobd_vault.service.ts#L148-L225)

Die automatische Tabellenerkennung beseitigt einen wesentlichen alten Exportfehler. Neu werden jedoch Zeilenumbrüche in Stringwerten durch die wörtlichen Zeichen Backslash+n ersetzt. SQLite-Stringliterale wandeln diese nicht beim INSERT in echte Zeilenumbrüche zurück. Mehrzeilige Beschreibungen, Mailvorlagen und JSON-Texte werden dadurch verändert. Schema, R2-Objekte, konsistenter Snapshot und harte Vollständigkeitsprüfung fehlen weiterhin; Abfragefehler werden nur kommentiert.

Korrektur und Abnahme: Textwerte originalgetreu erhalten; unterstützte Datentypen und Schema versioniert exportieren. Fehler abbrechen lassen und Objekte als Teil des Pakets sichern. Abnahme: Text mit LF/CRLF, Anführungszeichen und JSON sowie alle Tabellen/Dateien in einer leeren Umgebung vollständig vergleichen.

### B07 – Hoch: Idempotenz-Upsert kann bereits freigegebene Zeiten überschreiben

Fundstellen: [src/Worker/src/routes/time_entries.routes.ts:42–59](https://github.com/MKN1411/actanex-open/blob/2115a487a03682b89a7c32140c7f7a56d40bd2be/src/Worker/src/routes/time_entries.routes.ts#L42-L59); [src/Worker/src/routes/time_entries.routes.ts:100–129](https://github.com/MKN1411/actanex-open/blob/2115a487a03682b89a7c32140c7f7a56d40bd2be/src/Worker/src/routes/time_entries.routes.ts#L100-L129)

Der neue POST akzeptiert eine vorhandene body.id und aktualisiert bei Konflikt Projekt, Datum, Ist-/Abrechnungsstunden und Beschreibung. Geprüft wird die Aktivierung des übergebenen Projekts, nicht der bestehende Zeiteintrag und dessen freigegebene/invoicierte Nachweisversion. So kann der Upsert die für unveränderbar erklärten historischen Zeiten umgehen. Zudem wird bei geändertem Projekt timesheet_version_id nicht entsprechend aufgelöst.

Korrektur und Abnahme: Idempotente Wiederholung von einer Änderung unterscheiden. Bei vorhandener ID ursprünglichen Datensatz und Nachweisstatus prüfen; identischer Retry darf nur das vorhandene Ergebnis liefern. Änderungen an gesperrten Versionen ausschließlich als neue Revision. Abnahme: POST mit der ID einer freigegebenen Zeit kann Inhalt oder Projekt nicht ändern.

### B08 – Mittel: ActaChron überträgt gerundete Stunden als Rohzeit

Fundstellen: [src/Web/pwa/time-tracker.html:439–475](https://github.com/MKN1411/actanex-open/blob/2115a487a03682b89a7c32140c7f7a56d40bd2be/src/Web/pwa/time-tracker.html#L439-L475)

Die PWA bewahrt rawMinutes lokal, sendet für actualHours und billableHours aber beide Male entry.durationHours, also die gerundeten Stunden. Beispiel: 61 Minuten mit Aufrundung auf 15 Minuten werden serverseitig als 75 Minuten Istzeit und 75 Minuten Abrechnungszeit gespeichert. ADR-020 verlangt die Trennung.

Korrektur und Abnahme: actualHours aus rawMinutes/60 und billableHours aus der Rundungsregel ableiten. Abnahme: 61 Minuten ergeben rund 1,0167 Stunden Rohzeit und 1,25 Stunden Abrechnung; keine Umdeutung der Rohzeit.

### B09 – Hoch: ActaVault-OCR-Vertrag und zentrale Inbox bleiben unvollständig

Fundstellen: [src/Web/pwa/receipt-inbox.html:208–253](https://github.com/MKN1411/actanex-open/blob/2115a487a03682b89a7c32140c7f7a56d40bd2be/src/Web/pwa/receipt-inbox.html#L208-L253); [src/Worker/src/services/ai_vision.service.ts:118–128](https://github.com/MKN1411/actanex-open/blob/2115a487a03682b89a7c32140c7f7a56d40bd2be/src/Worker/src/services/ai_vision.service.ts#L118-L128); [src/Worker/src/routes/vouchers.routes.ts:74–90](https://github.com/MKN1411/actanex-open/blob/2115a487a03682b89a7c32140c7f7a56d40bd2be/src/Worker/src/routes/vouchers.routes.ts#L74-L90)

Direktupload und KI-Aufruf existieren jetzt, Zufallsbeträge wurden entfernt. Die PWA liest aber merchantName/vatRate/totalAmount/invoiceDate, während der KI-Service supplierName/taxRate/amountGross/voucherDate liefert. Sie zeigt daher Fallbacks oder leeren Betrag trotz erfolgreicher Extraktion. Der Upload schreibt nur R2, kein zentrales Inbox-/Draft-Datensatz wird angelegt; das Ergebnis wird nur im lokalen Browser gespeichert. Offline werden Dateiname und Metadaten, aber keine Datei für einen späteren Upload gesichert.

Korrektur und Abnahme: Gemeinsames typisiertes OCR-Antwortschema verwenden. Zentrale Inbox mit Objektverweis und Status persistieren. Offline-Dateien dauerhaft als Blob speichern und Uploadqueue implementieren. Abnahme: realer Betrag wird angezeigt, der Beleg erscheint am Desktop eines anderen Geräts, und Offline-Belege lassen sich nach Wiederverbindung hochladen.

### B10 – Mittel: API-Konfiguration ist optional; persönliche Fallbacks bleiben aktiv

Fundstellen: [src/Web/js/core/api.js:6–15](https://github.com/MKN1411/actanex-open/blob/2115a487a03682b89a7c32140c7f7a56d40bd2be/src/Web/js/core/api.js#L6-L15); [src/Web/pwa/time-tracker.html:195–208](https://github.com/MKN1411/actanex-open/blob/2115a487a03682b89a7c32140c7f7a56d40bd2be/src/Web/pwa/time-tracker.html#L195-L208)

window.ACTANEX_API_BASE und ein LocalStorage-Override sind ergänzt. Ohne diese Werte bleibt die Hostnamen-Heuristik mit persönlichen Worker-URLs aktiv. deploy.yml erzeugt keine zwingende Instanzkonfiguration. Eigene Domains und neue Konten können daher weiterhin an die falsche Umgebung angebunden werden.

Korrektur und Abnahme: Verbindliche Konfiguration für Desktop und PWAs beim Deployment erzeugen. Fehlende oder ungültige URL als Fehler anzeigen, keine fremde API als stillen Standard. Abnahme: frische Kopie/eigene Domain spricht ausschließlich die eigene API an.

### B11 – Mittel: QR-Upload benötigt jetzt Admin-Sitzung; Ablaufprüfung weiterhin fehlt

Fundstellen: [src/Worker/src/index.ts:138–157](https://github.com/MKN1411/actanex-open/blob/2115a487a03682b89a7c32140c7f7a56d40bd2be/src/Worker/src/index.ts#L138-L157); [src/Worker/src/routes/vouchers.routes.ts:97–104](https://github.com/MKN1411/actanex-open/blob/2115a487a03682b89a7c32140c7f7a56d40bd2be/src/Worker/src/routes/vouchers.routes.ts#L97-L104); [src/Worker/src/routes/vouchers.routes.ts:153–165](https://github.com/MKN1411/actanex-open/blob/2115a487a03682b89a7c32140c7f7a56d40bd2be/src/Worker/src/routes/vouchers.routes.ts#L153-L165)

Die QR-Upload-/Statuspfade sind nicht auf der öffentlichen Ausnahmeliste. Der mobile Blind-Drop ohne Admin-Login wird dadurch mit 401 abgewiesen, obwohl eine Upload-Session existiert. Innerhalb der Route wird weiterhin nur die Existenz der Session geprüft, nicht expires_at_utc oder der zulässige Status. Die Middleware löst den fehlenden Session-Ablaufschutz somit nicht.

Korrektur und Abnahme: Upload-Session als eng begrenzte Berechtigung für mobilen Schreibzugriff prüfen; Desktop-Polling separat authentifizieren. Ablauf, Status, Größe und Dateitypen im Uploadpfad erzwingen. Abnahme: gültiger QR-Link funktioniert ohne Admin-Token; abgelaufener/verbrauchter Link funktioniert nicht.

### B12 – Mittel: Bootstrap, Paket-Skripte und Abnahmebericht verwenden andere Ressourcen

Fundstellen: [.github/workflows/bootstrap-infrastructure.yml:78–97](https://github.com/MKN1411/actanex-open/blob/2115a487a03682b89a7c32140c7f7a56d40bd2be/.github/workflows/bootstrap-infrastructure.yml#L78-L97); [src/Worker/package.json:8–10](https://github.com/MKN1411/actanex-open/blob/2115a487a03682b89a7c32140c7f7a56d40bd2be/src/Worker/package.json#L8-L10); [.github/workflows/verify-compliance-and-generate-evidence.yml:39–49](https://github.com/MKN1411/actanex-open/blob/2115a487a03682b89a7c32140c7f7a56d40bd2be/.github/workflows/verify-compliance-and-generate-evidence.yml#L39-L49)

Bootstrap nutzt actanex-db/actanex-storage und den Platzhalter YOUR_D1_DATABASE_ID_HERE; die Open-Konfiguration verwendet actanex-open-db/actanex-open-storage und eine andere Platzhalter-ID. Lokale npm-Datenbankbefehle nennen evidence-hub-db. Verifikation fragt den persönlichen actanex-worker statt den Open-Worker ab und schreibt weiterhin positive Statusangaben trotz tolerierter Fehler.

Korrektur und Abnahme: Alle Pfade aus einer gemeinsamen Instanzkonfiguration ableiten, IDs strukturiert aktualisieren und Assertions mit verbindlichem Fehlerstatus verwenden. Abnahme: Erstinstallation und Nachweis betreffen dieselbe Zielinstanz und scheitern sichtbar bei falschen Bindungen.

## Weitere Prüfpunkte und Dokumentation

- README und SECURITY.md enthalten noch ältere pauschale Sicherheits-/Integritätszusagen. Sie sollten erst nach Abnahme des neuen Codes aktualisiert werden.
- start-local-docker.ps1 und Recovery-Befehle verwenden weiterhin den alten Containernamen evidence-hub-local; Compose erstellt actanex-backend-local und actanex-frontend-local. Wiederherstellungsbefehle müssen auf den Backend-Service umgestellt werden.
- Der Health-Endpunkt liefert healthy auch wenn die Laufzeitinitialisierung intern Fehler abfängt. Docker-Healthcheck ist damit ein Erreichbarkeitsnachweis, keine vollständige Schema-Abnahme.
- Versionsangaben im Worker und package.json nennen weiterhin 2.15.0, während die Open-Konfiguration 3.0.0 verwendet.
- Globale HTTP-Fehler liefern err.stack an den Client. Produktionsantworten sollten keine internen Stacktraces offenlegen.
- Historische Review-Berichte bleiben in ihren bisherigen Branches erhalten. Dieser Bericht ersetzt oder löscht sie nicht.

## Priorität und notwendige Tests

1. B01–B04: Accounts, öffentliche Berechtigungen, Datenbewahrung und Freigabeidentität absichern.
2. B05–B07: vollständige Hash-Abdeckung, originalgetreuer Restore und Schutz historischer Zeitbuchungen.
3. B08–B12: tatsächliche mobile Rohzeit, zentrale Beleg-Inbox, Instanzkonfiguration und QR-Upload testen.
4. Danach Auth-Matrix, Kontoänderung/Neustart, OTP-Wiederholung, zwei Deployments mit Benutzerdaten, Manipulation jedes Hashfelds, Restore mit mehrzeiligen Texten, mobile Online/Offline-Nutzung und Cross-Device-Beleganzeige in isolierten Instanzen prüfen.
5. Erst anschließend Bereitstellungsanleitung und öffentliche ChatGPT-Seite an den verifizierten Stand anpassen.

Anwendungscode, main, Live-Projekt und Cloudflare-Ressourcen wurden durch diesen Review nicht verändert. Nur dieses neue Dokument wird in einem separaten Review-Branch gespeichert.
