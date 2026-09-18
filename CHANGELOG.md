# 📋 Changelog & Release Notes

Alle nennenswerten Änderungen und Weiterentwicklungen des **Freelancer Evidence & Billing Hubs** werden in diesem Dokument festgehalten.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/) und folgt den Konventionen von [Semantic Versioning](https://semver.org/lang/de/).

---

## [2.13.0] - 2026-09-19 (LTS)

### 🌟 Highlights
* **Interaktiver Zwischenbericht & PDF-Builder:** Umfassende Auswertung über alle/ausgewählte Kunden und Projekte nach Monat, Quartal, Jahr oder frei wählbarem Datumsbereich.
* **Optionaler betragsloser Tätigkeitsnachweis:** Optionale Ausblendung aller Stundensätze und Beträge (`report-opt-hide-rates`) für reine Stundennachweise an PMOs/Projektleitungen.
* **Schnell-Zeiterfassung im Abrechnungsbaum (Option A):** Dedizierter `[+ Zeit erfassen]`-Aktionsbutton pro Projekt im Hierarchiebaum mit synchroner Live-Aktualisierung.
* **Dynamische Vorgabewerte:** Datumsfelder werden mit dem tagesaktuellen Systemdatum vorbelegt; 30-Minuten-Pause standardmäßig deaktiviert (manuelle Aktivierung).
* **Präzisierung GoBD-Deklaration & Ehrliche Terminologie (Weg A):** Bereinigung des Report-Footers auf *Revisionssicherer Prüfpfad*; Umbenennung des Menüpunkts in *Audit-Protokolle*; Vermeidung unzulässiger Software-Garantieversprechen.
* **3-stufiger 2FA/OTP Testdaten-Reset:** Absicherung der Testdaten- und Protokoll-Bereinigung durch Warn-Dialog, `RESET`-Texteingabe und 6-stelligen Einmalcode (OTP) per E-Mail mit serverseitiger SHA-256 Hash-Verifikation.
* **ADR-024 & Version 3.0 Roadmap:** Neues Architecture Decision Record zur Neuausrichtung des Audit-Trails und Festschreibung von Weg B (echte SHA-256 Hash-Kette & Merkle-Tree) für v3.0.

### 🚀 Hinzugefügt & Verbessert (Added & Changed)
* **ADR-023:** *Dynamische Benutzer-Voreinstellungen, Schnell-Zeiterfassung im Projektfokus, Flexibler PDF-Zwischenbericht & Betragslose Tätigkeitsnachweise*.
* **Web UI:** Einklappbare Optionen im Report-Builder, formatierte A4-Druckansicht mit Summenblock, `#quick-time-modal`.

---

## [2.12.0] - 2026-09-18 (LTS)

### 🌟 Highlights
* **Optionale ADR- & § 18 EStG-Erfassung auf Stufen 1, 2 und 3:** Flexible Erfassung von Nachweisen und Architekturentscheidungen über alle Projekt-Hierarchieebenen hinweg.
* **Einklappbare UI-Sektion:** Standardmäßig kollabiert für schnelles operatives Buchen; mit einem Klick erweiterbar für komplexe Architecture Decision Records.
* **Deliverable- / ADR-Referenzfeld:** Spezifisches Eingabefeld für ADR-Nummern und Arbeitsergebnisse mit Weiterleitung an Rechnungs- und Prüfberichte.

### 🚀 Hinzugefügt (Added)
* **ADR-022:** *Optionale ADR- & § 18 EStG Problemlösungsnachweis-Erfassung auf allen Projektstufen*.
* **Worker API:** Optionale Persistenz in `POST /api/v1/time-entries` und `PUT /api/v1/time-entries/:id`; Join-Erweiterung in `GET /api/v1/billing/hierarchy`.

---

## [2.11.0] - 2026-09-17 (LTS)

### 🌟 Highlights
* **Dynamische 3-stufige Projekt- & Budget-Hierarchie:** Vollständige Unterstützung mehrstufiger Programm- und Auftragsstrukturen:
  * **Stufe 1:** Gesamtprojekt (Hauptauftrag / Rahmenvertrag)
  * **Stufe 2:** Projekt / Programm / Stream / Arbeitspaket (untergeordnet dem Rahmenvertrag)
  * **Stufe 3:** Teilprojekt / Arbeitspaket (untergeordnet einem Projekt, Stream oder Programm)
* **Flexible Budget-Geltung & Verrechnung:** Honorar- und Reisekostenbudgets können flexibel für Stufe 1, 2 oder 3 definiert werden. Freiberufler können zwischen eigenem Festkontingent (`Dedicated`) und gepooltem Zugriff auf das übergeordnete Budget (`PooledFromParent`) wählen.
* **Reisekosten-Integration:** Vollständige Einbindung von Reisekosten in die Projekthierarchie mit drei Abrechnungsmodi (`Dedicated`, `PooledFromParent`, `None` / nach Beleg).
* **Rollup-Kennzahlen & Hierarchie-Baum:** Automatisches Rollup über alle geleisteten Stunden, Honorare und Reisekosten untergeordneter Streams im Gesamtprojekt-Cockpit.
* **Dynamischer Unterebenen-Builder:** Schnelles Hinzufügen von Streams und Arbeitspaketen direkt im Projektanlageformular (analog zur Rundreise-UX).
* **Kaskadierende Auswahllisten:** Strukturierte, eingerückte Projektanzeige in der Zeiterfassung und Reisekostenerfassung (`📁 [Stufe 1]`, `└── 🔹 [Stufe 2]`, `└── ▪️ [Stufe 3]`).

### 🚀 Hinzugefügt (Added)
* **ADR-021:** *Dynamische 3-stufige Projekt- & Budget-Hierarchie mit Reisekosten-Verrechnung*.
* **D1-Migration 0022:** Neue relationale Spalten `parent_project_id`, `hierarchy_level`, `budget_mode`, `travel_budget_net`, `travel_budget_mode` in `projects`.
* **API Endpoints:** Rollup-Aggregation in `GET /customers/:id/overview` und `GET /projects/:id/details`; synchrone Unterprojekterstellung in `POST /projects`.

---

## [2.10.0] - 2026-09-08 (LTS)

### 🌟 Highlights
* **Google Gemini Multimodal Vision Integration:** Direkte Unterstützung der Google Gemini API zur hochpräzisen OCR- und Datenextraktion von Belegen, Quittungen und mehrseitigen PDF-Rechnungen. Standardmäßig ist **Google Gemini 3.7 Flash** vorausgewählt, mit nahtlosem Fallback auf Cloudflare Workers AI.
* **Interaktives KI-Prüfmodal (Review-Modal):** Vor Übernahme der KI-Ergebnisse in die Abrechnungstabelle öffnet sich ein strukturiertes Prüffenster mit Belegvorschau, Feldkontrolle (Brutto, Netto, Vorsteuer 19 % / 7 %, Aussteller, Datum) und Quellmodell-Transparenz.
* **Sequenzielle Prüfwarteschlange:** Gleichzeitiges Hochladen mehrerer Belege wird geordnet nacheinander über eine FIFO-Prüfwarteschlange abgearbeitet.
* **Einheitliche Modellauswahl:** Das KI-Dropdown unter *Belege & Betriebsausgaben* wurde vollständig mit den Reisekosten- und Einstellungsoptionen harmonisiert (Gemini 3.7 Flash, 3.1 Flash-Lite, 2.5 Flash etc.).
* **Robuster lokaler Docker-Fallback:** Synchronisation des lokalen SQLite-Schemas mit allen D1-Migrationen (`trip_legs`, `operational_vouchers`, `expense_date`), Behebung von Redirect-Loops und automatische Erkennung lokaler KI-Services (Ollama auf Port 11434).
* **Automatischer Port-Wechsel:** Der lokale Starter `start-local-docker.ps1` weicht bei belegtem Port 8080 automatisch auf Port 8085 aus und öffnet die Anwendung selbsttätig im Browser.

### 🚀 Hinzugefügt (Added)
* **ADR-019:** *Google Gemini Multimodal Vision Integration mit Cloudflare Workers AI Fallback & Interaktiver Prüfwarteschlange*.
* **ADR-020:** *Lokale Docker-Desktop Fallback-Infrastruktur & Lokale KI-Erkennung*.
* **API Endpoints:** Erweiterung von `/api/v1/vouchers/scan-ai` um Gemini API-Key-Durchleitung (`geminiApiKey`) und Modell-Routing.
* **Docker Setup:** `GEMINI_API_KEY` Durchleitung in `docker-compose.yml` und KI-Erkennungsroutine in `start-local-docker.ps1`.

### 🔧 Verbessert & Behoben (Fixed & Changed)
* **Datenbankschema:** Sicherstellung der Spalte `expense_date` in `trip_expenses` sowie aller Archivabfragen (`/archive/overview`).
* **PDF-Stream-Dekompression:** Robuste PDF-Beleg-Verarbeitung für Gemini und Cloudflare.
* **Belegvorschau:** Korrektur affiner Transformationsmatrizen im mobilen Dokumentenscanner (Beseitigung schwarzer Bilder).

---

## [2.9.0] - 2026-08-24 (LTS)

### 🌟 Highlights
* **GoBD-Stammdaten & Freelancer-Profil:** Vollständige Verwaltung aller steuerlichen und betrieblichen Daten (Firmenname, Inhaber, Anschrift, EÜR, Ist-Versteuerung, Steuernummer, USt-IdNr., W-IdNr.) mit 1-Klick-Import aus der Lexware Office Organization API.
* **Selektiver Steuerberater-Export (CSV, DATEV EXTF 700 & ZIP):** Master-Checkbox „Alle / Keine“ sowie Einzel-Checkboxen pro Belegzeile ermöglichen den punktgenauen Export ausgewählter Nachweise an die Steuerkanzlei.
* **Interne Dienstreisen ohne Dummy-Kunde (MCT Community Events, Konferenzen & Fortbildung):** Reisekosten und Spesen können ab sofort ohne Kunden- und Projektzwang als 100%ige steuerliche Betriebsausgabe (EÜR / SKR04) erfasst werden.
* **Genereller mobiler QR-Scan für Reisekosten:** Direkte Erfassung von Hotel-, Bahn- und Parkbelegen per Smartphone-Kamera direkt in die Reisekosten-Abrechnung.
* **Zentraler Schalter für KI-Vision Belegerkennung:** Datenschutz- und kontrollorientierter Toggle zur Aktivierung/Deaktivierung von Cloudflare Workers AI Inferenz.
* **Präzise Perioden-Filterung:** SQL- und UI-gestützte Filterung nach Abrechnungsmonat (z. B. Juli 2026) schließt Fremdmonate exakt aus.

### 🚀 Hinzugefügt (Added)
* **ADR-016:** *Freelancer-Stammdatenprofil, Lexware-Synchronisation & GoBD-Deckblatt*.
* **ADR-017:** *Selektive Steuerberater-Exporte und interne Dienstreisen ohne Dummy-Kunde*.
* **D1-Migration 0020:** Spalten `company_name`, `company_street`, `company_zip`, `company_city`, `company_address`, `company_type`, `tax_assessment_type`, `tax_number`, `vat_id`, `w_idnr`, `taxation_type`, `enable_ai_vision` in `app_settings` sowie `trip_id`, `tax19_gross`, `tax7_gross`, `tax19_amount`, `tax7_amount` in `operational_vouchers`.
* **API Endpoints:**
  - `POST /api/v1/settings/import-lexware-profile`: Direkter Import der Firmendaten aus Lexware Office.

---

## [2.8.0] - 2026-08-24 (LTS)

### 🌟 Highlights
* **Neues Modul „Belege & Betriebsausgaben“:** Vollständige Verwaltung von Geschäftsessen (§ 4 Abs. 5 EStG), Taxifahrten, GoBD-Eigenbelegen, GWG (< 800 €) und laufenden Betriebsausgaben.
* **Serverless Cloudflare Workers AI Vision Scanner:** Automatisches OCR- und Datenextraktions-System auf Basis von `@cf/meta/llama-3.2-11b-vision-instruct` zur sofortigen Erkennung von Lokalname, Datum, Brutto-/Nettobetrag, Steuersatz, Zahlungsart und Trinkgeld.
* **Cross-Device Mobile QR-Code Erfassung:** Schlanke, mobile Beleg-Fotoseite für Smartphones ohne Login-Ballast. Der Desktop erzeugt einen temporären QR-Code (15 Minuten TTL); das Smartphone überträgt $1..n$ Fotos in Echtzeit per HTML5-Kamera direkt an den PC-Arbeitsplatz.
* **Systemgestützter 70/30-Splitter für gemischte Runden (§ 12 / § 4 Abs. 5 EStG):** Automatische rechnerische Aufteilung nach Teilnehmer-Kopfanteilen bei Familien- und Mitgründertreffen als strukturierte Dokumentationshilfe zur steuerneutralen Ausgliederung des Privatanteils und Vorsteuerberechnung auf den geschäftlichen Nettoanteil.
* **GoBD-Belegdeckblatt mit SHA-256 Hash:** Druckfertiges DIN A4-Deckblatt als Dokumentationsnachweis inklusive SKR04/SKR03-Buchungsstempel (`4650`/`4654`) und kryptografischem Integritätsnachweis.
* **DATEV EXTF 700 & Lexware Office Integration:** Nahtloser Export in das amtliche 116-Spalten DATEV-Format und automatischer API-Upload nach `/v1/vouchers`.

### 🚀 Hinzugefügt (Added)
* **ADR-013:** *Cloudflare Workers AI Vision Scanner für Belege & Bewirtungsquittungen*.
* **ADR-014:** *Cross-Device Mobile QR-Code Beleg-Erfassung & Ephemere Session-Sicherheit*.
* **ADR-015:** *Gemischte Bewirtungsaufteilung nach Kopfanteilen (§ 4 Abs. 5 / § 12 EStG) & GoBD-Belegdeckblatt*.
* **D1-Migration 0019:** Tabellen `operational_vouchers` und `voucher_upload_sessions`.
* **API Endpoints:**
  - `POST /api/v1/vouchers/scan-ai`: AI Vision Extraktion.
  - `POST /api/v1/vouchers/upload-session/create`: Erstellung ephemerer QR-Sessions.
  - `POST /api/v1/vouchers/upload-session/:sessionId/upload`: Multi-Beleg-Upload vom Smartphone.
  - `GET /api/v1/vouchers/upload-session/:sessionId/status`: Statusabfrage der Smartphone-Session.
  - `GET / POST / PUT / DELETE /api/v1/vouchers`: CRUD-Operationen für operative Belege.
  - `POST /api/v1/vouchers/:id/sync-lexware`: Belegsynchronisation mit Lexware Office.

---

## [2.7.0] - 2026-08-22 (LTS)

### 🌟 Highlights
* **Zero-Code 1-Klick GitHub Actions Bootstrapper:** Vollständige Einrichtung der Cloudflare-Infrastruktur (D1-Datenbank, R2-Buckets, Worker-API, Pages Web-App) zu 100 % browserbasiert ohne lokale Terminal-Befehle oder CLI-Installationen.
* **Automatisierter Live-Compliance-Inspektor:** Neuer Workflow (`verify-compliance-and-generate-evidence.yml`) zur dynamischen Abfrage der echten Instanz-IDs (D1 UUID, R2 Bucket, API Health) und Erstellung von revisionsorientierten Prüfprotokoll-Artefakten.
* **Technisches Eigenerklärungs-Framework & BMF-Abgrenzung:** Klare juristische Deklaration als technische Dokumentationshilfe ohne unzulässige Gewährleistungs- oder Zertifizierungsversprechen nach BMF-GoBD-Standard.
* **Least-Privilege Token-Architektur:** Detaillierte Dokumentation und standardisiertes Berechtigungsprofil für sichere, minimale Cloudflare API-Tokens (Account: D1, Workers, R2, Pages).
* **Automatisierte 18-Stufen SQL-Migrationskette:** Transaktionssichere und idempotente Ausführung aller D1-Schemas direkt aus der GitHub Actions Cloud.

### 🚀 Hinzugefügt (Added)
* **ADR-011:** *Zero-Code GitHub Actions & Cloudflare 1-Klick Bootstrapper*.
* **ADR-012:** *Automatisierte Live-Compliance-Inspektion & Technisches Eigenerklärungs-Framework*.
* **Setup-Leitfaden:** *`docs/procedures/Zero_Code_1_Klick_Cloudflare_Setup.md`* mit Schritt-für-Schritt-Anleitung, Least-Privilege-Rechtetabelle und Klickpfaden.
* **Systemprüfbericht:** *`docs/procedures/System_Verification_and_Compliance_Evidence_Report.md`* und instanzspezifisches Protokoll für Produktivumgebungen.
* **Erweiterte Resend API-Key Secret-Injektion:** Automatisches Setzen des `RESEND_API_KEY` Secrets auf dem Worker für den E-Mail-OTP-Freigabeworkflow.

---

## [2.6.0] - 2026-08-22 (LTS)

### 🌟 Highlights
* **Offizieller DATEV EXTF Export (Format 700):** Vollständige Unterstützung des amtlichen 116-Spalten Buchungsstapel-Formats (Kategorie 21) für Kanzleien und Steuerberater mit Berater- und Mandantennummer.
* **Lexware Offline-CSV Belegexport:** Semicolon-separierter Stapel-Import für Einnahmen und Ausgaben ohne aktive Lexware-API.
* **22 IT-Freelancer Reisekostenkategorien:** Ausbau der Vorkontierung auf 22 praxisnahe Kategorien inklusive Konferenzen, Coworking, Auslands-Roaming, Eil-Hardware und getrennter Hotel-/Frühstücks-Splittung nach SKR04 und SKR03.
* **Stand-Alone Abrechnungsmodus:** Entkopplung von externen Buchhaltungssystemen. Manuelle Erfassung und Statusverfolgung extern erstellter Rechnungsnummern (z. B. Word, SevDesk, FastBill).
* **Automatisches Cloudflare Continuous Deployment:** Vollautomatisierter GitHub Actions Workflow (`deploy.yml`) für 0-Downtime Worker & Pages Deployments auf `main`.

### 🚀 Hinzugefügt (Added)
* **ADR-008:** *Decoupled Billing Provider & Stand-Alone Workflow*.
* **ADR-009:** *Official DATEV EXTF Format 700 Accounting Export*.
* **ADR-010:** *Lexware Offline-CSV Import Format*.
* **DATEV Referenztabelle in Einstellungen (Karte 9):** Vollständige Read-Only-Übersicht aller 22 Reisekostenkonten und Erlöskonten (4400/8400 bzw. 4185/8195) mit Ausblick auf den visuellen Kontenplan-Editor in v3.0.
* **System- & Support-Diagnose Bundle:** Erstellung und 1-Klick-Download eines anonymisierten JSON-Diagnoseberichts zur Fehlerbehebung.
* **Dynamische SKR-Beschriftungen:** Tabellenüberschriften und Spalten im Reisekosten-Modul passen sich in Echtzeit an den gewählten Kontenrahmen (SKR04 / SKR03) an.

### 🔧 Verbessert & Behoben (Fixed & Changed)
* **Reisekosten-Erfassung UI:** Automatisches Setzen des korrekten USt-Satzes (19 %, 7 %, 0 %) bei Kategorie-Wechsel. Gruppierung in 5 übersichtliche `<optgroup>`s.
* **Syntax & Error-Handling:** Absicherung von `downloadDiagnosticsBundle` und dynamischer View-Ermittlung.
* **R2 Storage Binding Check:** Korrektur des internen Bindungsnamens (`STORAGE`) in den Diagnoseprüfungen.

---

## [2.5.0] - 2026-08-21

### 🚀 Hinzugefügt (Added)
* **Kunden-Stammdaten & Kundennummern:** Dediziertes Kundennummern-Feld (`customer_number`) in der Datenbank, UI und Leistungsnachweisen.
* **Erweiterte Audit-Protokollierung:** GoBD-konforme Erfassung aller Änderungen an Stamm- und Abrechnungsdaten.
* **Disaster Recovery SQL-Dump:** Vollständiger 1-Klick SQLite-Dump im Backup-Center.

---

## [2.0.0] - 2026-08-15

### 🌟 Major Architecture Shift: Cloudflare Serverless (0,00 € / Monat)
* **Zero-Cost Hosting:** Vollständige Umstellung auf Cloudflare Workers, Pages, D1 (SQLite) und R2.
* **Zero-Trust OTP Freigabecenter:** Kundenfreigabe über signierte Einmal-Links mit 6-stelligem E-Mail-Code ohne Passwortzwang.
* **GoBD-Merkle-Root-Monatssiegel:** Mathematische Versiegelung aller monatlichen Audit-Events mittels SHA-256 Hash-Kette.
* **Lexware Office XL Live-Integration:** Bidirektionale Synchronisation von Angeboten, Auftragsbestätigungen und Rechnungsentwürfen inklusive Webhook-Rückkanal.

---

## [1.0.0] - 2026-08-01

### 🚀 Initial Release
* Grundlegende Zeiterfassung nach § 18 EStG für IT-Freelancer.
* Generierung von druckfertigen PDF- und Excel-Stundennachweisen.
* Lokales Docker- und CLI-Fundament.
