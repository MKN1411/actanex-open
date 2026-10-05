# ActaNex Open – statischer Code-Review

Datum: 05.10.2026
Repository: MKN1411/actanex-open (öffentlich)
Geprüfter Commit: 5da781235d9b3ccb7675974f38e28685afb5052c

## Ergebnis

16 Befunde: 3 kritisch, 8 hoch, 5 mittel. Der aktuelle Stand sollte vor einer Bereitstellungsanleitung für unabhängige Benutzer korrigiert und in einer isolierten Umgebung geprüft werden. Insbesondere API-Autorisierung, Sonderzugänge und OTP-Empfängerprüfung sind weiterhin ungelöst. Die getrennten ActaNex-Worker-/D1-/R2-Namen sind eine Verbesserung, beheben aber die feste Frontend-API-Auswahl und die Deployment-/Seed-Probleme nicht.

## Umfang und Grenzen

Risikoorientierte statische Prüfung des aktiven Worker-Einstiegs, Desktop-API und Legacy-Bundle, Router, PWAs, neuer Services, Deploymentdateien und ausgewählter .NET-Komponenten. Vorhandene README, Sicherheitsdokumentation, Recovery-Handbuch, CONTRIBUTING sowie V3-ADRs wurden einbezogen. Keine produktiven API-Aufrufe, Änderungen am Anwendungscode, Deployments oder Ausnutzungsversuche.

Die Windows-Sandbox blockierte lokale Prozessausführung bereits vor Shell-Start („managed networking requires the elevated Windows sandbox backend“). Deshalb keine Build-, Browser-, Docker-, PowerShell-Analyzer- oder Restore-Tests. Keine vollständige Git-Historien-, Binär-/PDF-Inhalts- oder Dependency-CVE-Prüfung. Vorhandene Secrets in externen Diensten wurden nicht ausgelesen. Ob Live-Deployments denselben Commit verwenden oder zusätzliche Cloudflare-Access-Regeln besitzen, ist unbestätigt. Befunde beschreiben den Quellcode und daraus ableitbares Verhalten.

## Befunde

### A01 – Kritisch: Fachliche API-Routen ohne serverseitige Autorisierung

Fundstelle: [src/Worker/src/index.ts:1333–1354](https://github.com/MKN1411/actanex-open/blob/5da781235d9b3ccb7675974f38e28685afb5052c/src/Worker/src/index.ts#L1333-L1354); [src/Worker/src/index.ts:1648–1759](https://github.com/MKN1411/actanex-open/blob/5da781235d9b3ccb7675974f38e28685afb5052c/src/Worker/src/index.ts#L1648-L1759); [src/Worker/src/index.ts:5832–5894](https://github.com/MKN1411/actanex-open/blob/5da781235d9b3ccb7675974f38e28685afb5052c/src/Worker/src/index.ts#L5832-L5894)

Der Fetch-Handler prüft keine gemeinsame Sitzung vor fachlichen Routen. Einstellungen, Kunden und vollständiger SQL-Export sind im Code ohne Authentifizierung erreichbar. Session-Prüfungen existieren bei einzelnen auth-Routen, schützen aber die übrigen APIs nicht. Bei direkt erreichbarem Worker können Geschäftsdaten und gespeicherte Benutzer-Hashes ausgelesen sowie Konfigurationen verändert werden.

Korrektur und Abnahme: Zentrale Sitzungskontrolle mit Ablauf, Benutzeraktivierung und Rollen vor allen internen Routen. Nur explizit öffentliche Endpunkte ausnehmen und diese zweckgebunden schützen. Abnahme: anonyme/abgelaufene/deaktivierte Sitzungen dürfen interne Daten weder lesen noch verändern.

### A02 – Kritisch: Sonderzugänge und Wiederherstellung fest benannter Administratorkonten

Fundstelle: [src/Worker/src/index.ts:966–1015](https://github.com/MKN1411/actanex-open/blob/5da781235d9b3ccb7675974f38e28685afb5052c/src/Worker/src/index.ts#L966-L1015); [src/Worker/src/index.ts:1432–1476](https://github.com/MKN1411/actanex-open/blob/5da781235d9b3ccb7675974f38e28685afb5052c/src/Worker/src/index.ts#L1432-L1476)

ensureAuthTables aktualisiert Passwort-Hashes, Salt und Aktivierungsstatus fest benannter Konten oder legt sie erneut an. Die Funktion wird bei Anmeldungen und weiteren auth-Routen ausgeführt. isMasterMatch erlaubt zudem bestimmte fest eingebaute Kennwörter unabhängig vom gespeicherten Hash. Passwort-/E-Mail-Änderung oder Kontodeaktivierung beseitigen diese Zugänge nicht zuverlässig. Konkrete Kennwörter werden hier nicht wiederholt; sie stehen im öffentlichen Quellcode.

Korrektur und Abnahme: Sonderzugänge entfernen; Ersteinrichtung einmalig und mit individuell erzeugtem Setup-Token durchführen. Bestehende Benutzer beim Laufzeitstart nicht aktualisieren. Bei produktiver Nutzung nach Korrektur betroffene Kennwörter wechseln und Sitzungen widerrufen. Abnahme: geänderte oder deaktivierte Konten bleiben auch nach Neustart und erneutem Login unverändert.

### A03 – Kritisch: OTP-Freigaben sind nicht auf berechtigte Empfänger beschränkt

Fundstelle: [src/Worker/src/index.ts:7221–7275](https://github.com/MKN1411/actanex-open/blob/5da781235d9b3ccb7675974f38e28685afb5052c/src/Worker/src/index.ts#L7221-L7275); [src/Worker/src/index.ts:7294–7344](https://github.com/MKN1411/actanex-open/blob/5da781235d9b3ccb7675974f38e28685afb5052c/src/Worker/src/index.ts#L7294-L7344)

request-otp akzeptiert eine frei übergebene E-Mail-Adresse. Der Vergleich mit Freigebern beeinflusst nur den Namen und lehnt andere Empfänger nicht ab. verify-otp bindet die Prüfung nicht an die übergebene Adresse und übernimmt diese in den Freigabenachweis. Mit Kenntnis einer Leistungsnachweis-ID ist eine Freigabe durch einen unberechtigten Empfänger möglich.

Korrektur und Abnahme: Empfänger aus der serverseitigen Freigeberliste bestimmen; OTP an Identität, Dokumentversion und tatsächlichen Dokumenthash binden. Identität beim Abschluss aus dem verifizierten Datensatz übernehmen; atomarer Codeverbrauch, Rate-/Versuchslimits. Abnahme: fremde Empfänger werden abgewiesen; Identität kann nicht beim Abschluss geändert werden.

### A04 – Hoch: Deployment spielt bei jedem Lauf Demo-Seeds ein

Fundstelle: [.github/workflows/deploy.yml:52–62](https://github.com/MKN1411/actanex-open/blob/5da781235d9b3ccb7675974f38e28685afb5052c/.github/workflows/deploy.yml#L52-L62); [src/Worker/db/0002_seed_data.sql:9–56](https://github.com/MKN1411/actanex-open/blob/5da781235d9b3ccb7675974f38e28685afb5052c/src/Worker/db/0002_seed_data.sql#L9-L56)

Die Schleife über 00*.sql enthält 0002_seed_data.sql. Diese verwendet INSERT OR REPLACE unter anderem für app_settings, customers, projects, time_entries und users. Das Deployment wird bei jedem Push auf main ausgeführt. Soweit die Statements erfolgreich sind, können Einstellungen und Datensätze mit denselben Schlüsseln erneut durch Seed-Werte ersetzt werden. SQL-Fehler werden durch || true unterdrückt.

Korrektur und Abnahme: DDL-Migrationen und Demo-Seeding strikt trennen. Seeds nur explizit in einer isolierten Demo-Datenbank ausführen. Migrationshistorie mit einmaliger Anwendung und Schema-Abschlussprüfung einsetzen; relevante Fehler abbrechen lassen. Abnahme: zwei Deployments bewahren individuell geänderte Einstellungen und fachliche Datensätze unverändert.

### A05 – Hoch: Desktop und PWAs verwenden persönliche API-Adressen

Fundstelle: [src/Web/js/core/api.js:6–13](https://github.com/MKN1411/actanex-open/blob/5da781235d9b3ccb7675974f38e28685afb5052c/src/Web/js/core/api.js#L6-L13); [src/Web/pwa/time-tracker.html:195–201](https://github.com/MKN1411/actanex-open/blob/5da781235d9b3ccb7675974f38e28685afb5052c/src/Web/pwa/time-tracker.html#L195-L201); [src/Web/pwa/receipt-inbox.html:157–163](https://github.com/MKN1411/actanex-open/blob/5da781235d9b3ccb7675974f38e28685afb5052c/src/Web/pwa/receipt-inbox.html#L157-L163)

Die API-Auswahl erfolgt anhand der Zeichenfolgen demo/open im Hostnamen und verweist auf feste Worker unter dem persönlichen Cloudflare-Namensraum. Andere Domains fallen auf den persönlichen Produktionsworker zurück. Ein neuer Benutzer erhält daher keine unabhängige Frontend/API-Verbindung.

Korrektur und Abnahme: Instanzkonfiguration mit expliziter API-URL für Desktop und PWAs generieren; keine fremde Produktionsadresse als Standard. Abnahme: neue Benutzerkonten und eigene Domains verwenden ausschließlich ihre eigene API.

### A06 – Hoch: ActaChron synchronisiert an eine nicht vorhandene API-Route

Fundstelle: [src/Web/pwa/time-tracker.html:403–432](https://github.com/MKN1411/actanex-open/blob/5da781235d9b3ccb7675974f38e28685afb5052c/src/Web/pwa/time-tracker.html#L403-L432); [src/Web/pwa/time-tracker.html:506–525](https://github.com/MKN1411/actanex-open/blob/5da781235d9b3ccb7675974f38e28685afb5052c/src/Web/pwa/time-tracker.html#L506-L525); [src/Worker/src/index.ts:3615–3655](https://github.com/MKN1411/actanex-open/blob/5da781235d9b3ccb7675974f38e28685afb5052c/src/Worker/src/index.ts#L3615-L3655)

Die PWA sendet POST /timesheets/entries. Im aktiven Worker existiert dafür keine Route; Zeitbuchungen werden unter /time-entries verarbeitet. Auch der Payload der PWA mit hours und taskDescription entspricht nicht unmittelbar dem vorhandenen Zeiterfassungskontrakt. Die PWA verwendet zudem keinen Bearer-Token. Bei nicht erfolgreichen HTTP-Antworten bleibt der Datensatz unsynchronisiert, ohne klare Fehlermeldung.

Korrektur und Abnahme: Gemeinsamen API-Vertrag implementieren, Authentifizierung der PWA integrieren und verständliche Fehler anzeigen. Offline-Sync mit stabilen Client-IDs und Idempotenz absichern. Abnahme: eine mobile Buchung erscheint genau einmal im Desktop; Offline-Wiederholung erzeugt keine Duplikate.

### A07 – Hoch: ActaVault-Upload passt nicht zum Worker und zeigt erfundene Belegwerte

Fundstelle: [src/Web/pwa/receipt-inbox.html:169–213](https://github.com/MKN1411/actanex-open/blob/5da781235d9b3ccb7675974f38e28685afb5052c/src/Web/pwa/receipt-inbox.html#L169-L213); [src/Worker/src/index.ts:8472–8484](https://github.com/MKN1411/actanex-open/blob/5da781235d9b3ccb7675974f38e28685afb5052c/src/Worker/src/index.ts#L8472-L8484)

Die Beleg-PWA sendet multipart/form-data an /vouchers/upload-session/file. Der Worker erwartet /vouchers/upload-session/{id}/upload und einen JSON-Body mit files. Session-Erzeugung und Übergabe fehlen in diesem PWA-Pfad. Selbst bei einer erfolgreichen Antwort würde der Browser Händler/USt aus dem Dateinamen und den Betrag mit Math.random erzeugen, statt extrahierte API-Daten zu verwenden.

Korrektur und Abnahme: Upload-Session und passendes Format implementieren oder einen eigenen authentifizierten Inbox-Endpunkt anbieten. Ausschließlich tatsächlich extrahierte Werte mit Herkunft und Unsicherheit anzeigen; fehlende Werte leer lassen. Abnahme: Upload und Desktop-Inbox funktionieren, und der Betrag stammt aus nachprüfbaren Belegdaten statt einer Simulation.

### A08 – Hoch: Dokument- und Monatssiegel sind im aktiven Worker Zufallskennungen

Fundstelle: [src/Worker/src/index.ts:5231–5247](https://github.com/MKN1411/actanex-open/blob/5da781235d9b3ccb7675974f38e28685afb5052c/src/Worker/src/index.ts#L5231-L5247); [src/Worker/src/index.ts:5793–5828](https://github.com/MKN1411/actanex-open/blob/5da781235d9b3ccb7675974f38e28685afb5052c/src/Worker/src/index.ts#L5793-L5828)

frozenHash und merkle_root_hash entstehen in diesen Pfaden aus UUIDs mit SHA256-Präfix. Sie sind nicht an Dokumentbytes oder Audit-Ereignisse gebunden und können Manipulationen nicht nachweisen. Die neue DocumentVault-Klasse und die .NET-Engine haben echte SHA-256-Funktionen, werden aber nicht für diese Worker-Pfade eingesetzt.

Korrektur und Abnahme: Deterministische Hashes aus kanonischen Daten und eingefrorenen PDF-Bytes berechnen. Monatssiegel aus nachvollziehbarem Merkle-Baum/Hash-Kette erstellen. Legacy-Zufallswerte klar kennzeichnen. Abnahme: unveränderte Inhalte ergeben denselben Hash; jede Inhaltsänderung wird erkannt.

### A09 – Hoch: Audit-Reset löscht die gesamte Historie und Siegel

Fundstelle: [src/Worker/src/index.ts:5689–5789](https://github.com/MKN1411/actanex-open/blob/5da781235d9b3ccb7675974f38e28685afb5052c/src/Worker/src/index.ts#L5689-L5789)

Der als Testdatenbereinigung dargestellte Reset führt uneingeschränkt DELETE FROM audit_events und DELETE FROM monthly_archive_seals aus. Eine Administrator-Sitzung wird nicht geprüft. OTP-Versuche werden gezählt, aber nicht begrenzt. Die Empfängeradresse stammt aus den ungeschützten Einstellungen. Das ist mit einer unveränderbaren Historie nicht vereinbar.

Korrektur und Abnahme: Reset in produktiven Instanzen sperren und Testdaten getrennt halten. Sicherheitskontakt nicht über allgemeine Einstellungen umleiten lassen. Rollen-/Versuchskontrolle und erhaltene Audit-Nachweise. Abnahme: keine produktive Aktion entfernt die gesamte historische Protokollierung.

### A10 – Hoch: Vollständiger SQL-Export lässt fachliche und V3-Tabellen aus

Fundstelle: [src/Worker/src/index.ts:5832–5883](https://github.com/MKN1411/actanex-open/blob/5da781235d9b3ccb7675974f38e28685afb5052c/src/Worker/src/index.ts#L5832-L5883); [src/Worker/db/0002_actanex_v3_schema.sql:5–32](https://github.com/MKN1411/actanex-open/blob/5da781235d9b3ccb7675974f38e28685afb5052c/src/Worker/db/0002_actanex_v3_schema.sql#L5-L32)

Die feste Exportliste enthält unter anderem nicht activity_evidences, trip_legs, operational_vouchers, invoice_documents, document_vault oder merchant_rules. Sie fragt trip_segments statt trip_legs ab. Fehler werden als Kommentar übersprungen. CREATE TABLE und R2-Dateien fehlen ebenfalls. Ein herunterladbarer Dump ist daher kein vollständiges Wiederherstellungspaket.

Korrektur und Abnahme: Versioniertes Paket mit konsistentem Datenbankstand, Schema/Migrationsversion, allen fachlichen Tabellen und R2-Objekten erstellen. Vollständigkeitsfehler sichtbar machen. Abnahme: Daten und Dokumente jedes Moduls in einer leeren Umgebung wiederherstellen und vergleichen.

### A11 – Hoch: Mobile Upload-Sessions prüfen ihre Ablaufzeit nicht

Fundstelle: [src/Worker/src/index.ts:8454–8477](https://github.com/MKN1411/actanex-open/blob/5da781235d9b3ccb7675974f38e28685afb5052c/src/Worker/src/index.ts#L8454-L8477); [src/Worker/src/index.ts:8528–8540](https://github.com/MKN1411/actanex-open/blob/5da781235d9b3ccb7675974f38e28685afb5052c/src/Worker/src/index.ts#L8528-L8540)

Beim Erzeugen wird eine Ablaufzeit gespeichert, Upload und Status prüfen jedoch nur, ob der Session-Datensatz existiert. Abgelaufene Sessions bleiben nutzbar, solange die Zeile vorhanden ist. Weitere Uploads können uploaded_files_json ersetzen und vorherige Dateien ohne Session-Verweis zurücklassen.

Korrektur und Abnahme: Ablaufzeit und zulässigen Status serverseitig bei jedem Aufruf prüfen. Verbrauch/Mehrfachupload explizit regeln, Eigentümerschaft und Dateigrenzen prüfen sowie verwaiste Objekte bereinigen. Abnahme: abgelaufene/verbrauchte Sessions werden abgewiesen; frühere Dateien gehen nicht still aus dem Manifest verloren.

### A12 – Mittel: V3-Service-Architektur ist nicht in den aktiven Worker integriert

Fundstelle: [src/Worker/wrangler.jsonc:3–4](https://github.com/MKN1411/actanex-open/blob/5da781235d9b3ccb7675974f38e28685afb5052c/src/Worker/wrangler.jsonc#L3-L4); [ADR-019](https://github.com/MKN1411/actanex-open/blob/5da781235d9b3ccb7675974f38e28685afb5052c/docs/adr/ADR-019-actanex-v3-modular-spa-and-service-architecture.md)

Der aktive Einstieg src/index.ts importiert keine der neuen Klassen AiEngine, DocumentVault, TaxComplianceEngine oder LexwareConnector. Die in ADR-019 beschriebene Service-Entkopplung ist damit für den produktiven Worker nicht umgesetzt. AiEngine.processReceipt nutzt Text-/Dateinamenregeln, liefert Betrag 0 und feste Konfidenzwerte; ein KI-Aufruf fehlt dort. DocumentVault meldet auch nach fehlgeschlagener D1-Registrierung ein Dokument zurück.

Korrektur und Abnahme: Services schrittweise in echte Routen integrieren oder als unvollständige Bausteine kennzeichnen. Für Vault-Schreibvorgänge konsistente Objekt-/Metadatenregistrierung und Fehlerbehandlung implementieren. Abnahme: Route, Service, Persistenz und dokumentierte Funktion sind durch Integrationstests verbunden.

### A13 – Mittel: Neue Zeitberechnungsfunktion verwirft Minuten und behandelt Mitternacht falsch

Fundstelle: [src/Worker/src/services/tax_compliance.ts:6–20](https://github.com/MKN1411/actanex-open/blob/5da781235d9b3ccb7675974f38e28685afb5052c/src/Worker/src/services/tax_compliance.ts#L6-L20)

calculateVMA liest nur die Stundenkomponente. 08:30–16:00 wird rechnerisch wie acht Stunden behandelt, Minuten werden ignoriert. 00 wird durch || auf Standardstunden ersetzt. Der Code verwendet >= 8, während der eigene Kommentar > 8 beschreibt. Math.abs bei Datumsdifferenzen verdeckt umgekehrte Zeiträume. Die Klasse ist aktuell nicht im aktiven Worker eingebunden; der Befund betrifft den neuen Baustein.

Korrektur und Abnahme: Validierte Datums-/Minutenberechnung verwenden, Nullwerte von fehlenden Werten unterscheiden, rückwärts liegende Zeiträume ablehnen und Grenzfälle explizit definieren. Abnahme: 7:30, 8:00, 8:01, Mitternacht und ungültige Zeiträume anhand vereinbarter Regeln testen. Dies ist eine technische Berechnungsprüfung, keine steuerrechtliche Bewertung.

### A14 – Mittel: Docker kann laufende Oberfläche trotz fehlender API melden

Fundstelle: [docker-compose.yml:11–26](https://github.com/MKN1411/actanex-open/blob/5da781235d9b3ccb7675974f38e28685afb5052c/docker-compose.yml#L11-L26)

API-Installation und Wrangler laufen als Hintergrundkette; serve läuft separat. Fehler des Backends müssen den Container nicht stoppen. Healthcheck fehlt. Port-Mappings binden nicht ausdrücklich an Loopback; die API-URL bleibt 8787 auch bei geändertem Host-Port. Abhängigkeiten werden bei jedem Start installiert.

Korrektur und Abnahme: Getrennte Services beziehungsweise zuverlässige Prozessüberwachung, API-/DB-Healthchecks, vorbereitete Images und konfigurierbare API-URL. Einzelplatzbetrieb an Loopback binden. Abnahme: API-Ausfall meldet Fehler, abweichende Ports funktionieren und LAN-Erreichbarkeit entspricht dem vorgesehenen Betrieb.

### A15 – Mittel: Build-Workflows beginnen mit dotnet restore ohne Root-Projekt

Fundstelle: [.github/workflows/generate-timesheet.yml:27–31](https://github.com/MKN1411/actanex-open/blob/5da781235d9b3ccb7675974f38e28685afb5052c/.github/workflows/generate-timesheet.yml#L27-L31); [.github/workflows/sync-lexware-draft.yml:31–35](https://github.com/MKN1411/actanex-open/blob/5da781235d9b3ccb7675974f38e28685afb5052c/.github/workflows/sync-lexware-draft.yml#L31-L35)

Im geprüften Repositorybaum gibt es kein Root-csproj und keine .sln/.slnx. dotnet restore wird dennoch im Repositorywurzelordner aufgerufen. Anders als im zuvor geprüften Evidence-Hub-Repo ist die Engine hier vorhanden; das Problem ist ihr fehlender expliziter Restore-Pfad. CONTRIBUTING.md verweist außerdem auf nicht vorhandene Testprojekte.

Korrektur und Abnahme: Projektpfad beim Restore/Build explizit angeben oder eine Solution ergänzen. Dokumentierte Tests tatsächlich bereitstellen. Abnahme: frischer Checkout baut aus Quellen; Workflows hängen nicht von eingecheckten bin/obj-Artefakten ab.

### A16 – Mittel: Open-Source-Repository enthält Build-, Laufzeit- und Ausgabe-Artefakte

Fundstelle: Repositorybaum: src/Engine/**/bin, src/Engine/**/obj, src/Worker/.wrangler/cache, src/Worker/dist, output und src/Web/signature_default.json.

Trotz .gitignore sind zahlreiche bin/obj-Dateien, eine lokale Wrangler-Cachedatei, generierte Worker-Ausgaben und PDF/XLSX-Ausgaben versioniert. Das erzeugt widersprüchliche Quell-/Buildstände und unnötig große Klone. Ausgaben und Standard-Signaturdatei sollten vor einer allgemeinen Veröffentlichung auf persönliche Inhalte geprüft werden; deren vollständige Inhaltsprüfung und Git-Historie waren nicht Teil dieses Reviews.

Korrektur und Abnahme: Öffentliche Quellcodefreigabe getrennt von Betriebsartefakten verwalten. Bestehende Dateien gemäß Archivierungsvorgabe zunächst sichern; spätere Entfernung aus dem aktiven Baum gezielt planen. Releases aus sauberem Checkout erzeugen. Bei bestätigten sensiblen Inhalten zusätzlich historische Veröffentlichung und ggf. Widerruf von Zugangsdaten behandeln. Abnahme: sauberer Build ohne vorhandene Binaries und explizite Freigabe aller enthaltenen Ausgabe-/Signaturdaten.

## Abgleich mit Dokumentation und vorherigem Review

- SECURITY.md beschreibt Sitzungsschutz aller geschützten Endpunkte und unveränderte Konten bei Initialisierung. A01/A02 widersprechen diesen Zusagen.
- ADR-020 beschreibt funktionierenden Offline-Sync; A06 zeigt einen nicht implementierten API-Vertrag.
- ADR-021 beschreibt echte OCR/Inbox und adaptives Lernen; A07/A12 zeigen Simulation und fehlende Service-Integration.
- ADR-019 beschreibt unabhängige Services, aber der aktive Worker nutzt weiterhin den monolithischen Einstieg.
- Recovery-Handbuch und Integritätsbeschreibungen versprechen vollständige Wiederherstellung sowie inhaltsgebundene SHA-256-/Merkle-Nachweise. A08–A10 zeigen konkrete Grenzen.
- Das allgemeine bootstrap-infrastructure.yml verwendet weiterhin alte evidence-hub-Ressourcennamen und Platzhalter, während deploy.yml ActaNex-Namen verwendet. Die Einstiegspfade müssen vereinheitlicht werden.
- verify-compliance-and-generate-evidence.yml nutzt weiterhin eine feste persönliche Evidence-Hub-API und erzeugt positive Statusangaben auch nach tolerierten Abfragefehlern. Das ist kein belastbarer Nachweis für ActaNex Open.
- Im Unterschied zum vorherigen Evidence-Hub-Review ist die .NET-Engine vorhanden; deren Abwesenheit ist hier kein Befund. Auch die konkreten Cloudflare-Ressourcennamen wurden geändert. Ältere Ergebnisse wurden deshalb nicht ungeprüft übernommen.
- DocumentVault und Sha256Hasher enthalten echte Digest-Funktionen; das behebt die UUID-basierten Siegel im tatsächlich eingesetzten Worker nicht automatisch.

## Priorisierte nächste Schritte

1. A01–A03 beheben; öffentliche Nutzung und Kundenfreigaben absichern.
2. Demo-Seeding aus regulärem Deployment entfernen und Instanzkonfiguration vereinheitlichen.
3. Mobile API-Verträge, authentifizierten Sync und echte OCR-Antworten umsetzen.
4. Integrität, Audit-Erhalt und vollständige Wiederherstellung verifizieren.
5. Services, Docker und .NET-Workflows mit sauberem Checkout testen.
6. Danach README/ADRs/Recovery-Anleitung an den geprüften Stand anpassen.
7. Erst anschließend die gewünschte Cloudflare-/Docker-Anleitung als ChatGPT-Seite veröffentlichen.

## Prüfmatrix nach Korrekturen

| Bereich | Erforderliche Prüfung |
|---|---|
| Auth | Anonym, abgelaufen, deaktiviert, fehlende Rolle, Passwortwechsel und Neustart |
| OTP | Berechtigte Empfänger, Identitätsbindung, Versuchslimit, atomarer Verbrauch |
| Deployment | Leeres Konto, erneutes Deployment, unveränderte Benutzerdaten, eigene API |
| ActaChron | Online/Offline-Sync, Wiederholung, Idempotenz, klarer Fehlerstatus |
| ActaVault | Upload-Session, Ablauf, echte Extraktion, Desktop-Inbox |
| Integrität | Gleicher Inhalt gleicher Hash; Manipulation erkannt |
| Recovery | Leere Zielumgebung, alle Fach-/V3-Tabellen und R2-Objekte |
| Build | Explizite .NET-Projekte, TypeScript und PowerShell Analyzer; keine eingecheckten Binaries erforderlich |

Dieser Bericht wurde auf einem separaten Review-Branch gespeichert. main, Anwendungscode und produktive Ressourcen bleiben unverändert. Es ist keine Sicherheitszertifizierung der Live-Instanz.
