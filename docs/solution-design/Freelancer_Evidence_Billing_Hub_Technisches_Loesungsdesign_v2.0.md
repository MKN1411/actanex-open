# FREELANCER EVIDENCE & BILLING HUB
## Technisches Lösungsdesign v2.5
**Zeiterfassung • fachlicher Tätigkeitsnachweis • ÖPNV/PKW-Reisen • Zero-Trust-Kundenfreigabe • Lexware Office XL • GoBD- & Steuer-Nachweise • Disaster Recovery**

* **Dokumenttyp:** Technisches Lösungsdesign / Übergabedokument
* **Version:** 2.5 (Enterprise Serverless & Edge Architecture + Docker Fallback)
* **Stand:** 21. August 2026
* **Status:** Erfolgreich implementiert & in Produktion
* **Zielgruppe:** Freelancer / Entwicklung, Architektur, Steuerberatung, Projektpartner

> [!NOTE]
> **Rechtlicher Hinweis:** Dieses Dokument beschreibt ein technisches und fachliches Zielbild. Steuerliche und rechtliche Bewertungen (z. B. Abgrenzung § 18 EStG oder steuerliche Betriebsstätten nach BFH) werden vom System objektiv vorbereitet und dokumentiert, jedoch nicht automatisiert rechtsverbindlich entschieden. Sie sind bei Bedarf mit Steuerberatung bzw. Rechtsberatung abzustimmen.

---

## Dokumentenlenkung

| Version | Datum | Änderung | Status |
| :--- | :--- | :--- | :--- |
| **1.0** | 20.08.2026 | Erstfassung des Lösungsdesigns auf Basis klassischer Azure-PaaS-Dienste. | Archiviert |
| **2.0** | 20.08.2026 | **Architektur-Evolution auf 100 % Cloud-Serverless & 0 € Fixkosten:** Aufteilung in Cloudflare (Pages, D1 SQL, R2 Storage, Zero Trust OTP) und Worker-Engine. | Archiviert |
| **2.5** | 21.08.2026 | **Enterprise Erweiterung:** Live Executive Controlling Dashboard, bidirektionale Lexware Webhooks mit automatischer Storno-Erkennung, GoBD Merkle-Root-Siegelung, 4-teiliges Backup- & DATEV/CSV-Export-Center sowie 100 % autarker Docker Desktop Fallback. | **Aktuell / In Produktion** |

---

## Inhaltsverzeichnis

1. [Kurzfassung](#kurzfassung)
2. [Ausgangslage und Zielsetzung](#1-ausgangslage-und-zielsetzung)
3. [Leitprinzipien und Architekturentscheidungen (ADRs)](#2-leitprinzipien-und-architekturentscheidungen)
4. [Fachliche Domänen](#3-fachliche-domänen)
5. [Reise- und Reisekostenmodell – ÖPNV-first](#4-reise--und-reisekostenmodell--öpnv-first)
6. [Timesheet, Dokumente und Versionierung](#5-timesheet-dokumente-und-versionierung)
7. [Kundenfreigabe (Zero Trust)](#6-kundenfreigabe)
8. [Lexware-Integration](#7-lexware-integration)
9. [Datenmodell (Cloudflare D1 / Relational)](#8-datenmodell)
10. [Systemarchitektur & Arbeitsteilung](#9-systemarchitektur--arbeitsteilung)
11. [API-Design & Workflow-Orchestrierung](#10-api-design--workflow-orchestrierung)
12. [Dokument- und Archivkonzept (GoBD & Cloudflare R2)](#11-dokument--und-archivkonzept)
13. [Sicherheit, Datenschutz & Zero Trust](#12-sicherheit-und-datenschutz)
14. [Fehlerbehandlung und Robustheit](#13-fehlerbehandlung-und-robustheit)
15. [Reporting und Exporte](#14-reporting-und-exporte)
16. [Verfahrensdokumentation](#15-verfahrensdokumentation)
17. [MVP- und Umsetzungsplan](#16-mvp--und-umsetzungsplan)
18. [Teststrategie und Abnahmeszenarien](#17-teststrategie-und-abnahmeszenarien)
19. [GitHub-Repository- und Delivery-Konzept](#18-github-repository--und-delivery-konzept)
20. [Übergabekriterien für die Entwicklung](#19-übergabekriterien-für-die-entwicklung)
21. [Empfohlene erste Umsetzungsschritte](#20-empfohlene-erste-umsetzungsschritte)
22. [Quellen und normative Hinweise](#21-quellen-und-normative-hinweise)
* [Anhang A – Beispiel: fachlich aussagekräftiger Rechnungs-/Leistungsnachweis](#anhang-a--beispiel-fachlich-aussagekräftiger-rechnungs-leistungsnachweis)
* [Anhang B – Beispiel: ÖPNV-Reise](#anhang-b--beispiel-reise)
* [Anhang C – Definition of Done für MVP](#anhang-c--definition-of-done-für-mvp)

---

## Kurzfassung

Der **Freelancer Evidence & Billing Hub** ist eine hochgradig automatisierte Plattform zur Erfassung und revisionssicheren Verknüpfung von Projektzeiten, Tätigkeitsnachweisen (§ 18 EStG), multimodalen ÖPNV-Reisen, Kundenfreigaben und Belegen vor **Lexware Office XL**.

Lexware bleibt das führende System für Kundenstammdaten, Serviceartikel, Rechnungsnummernvergabe und Buchhaltung. Der Hub schließt die Lücke davor: Er stellt eine lückenlose **Beweiskette** her:
$$\text{Auftrag / PO} \longrightarrow \text{Tätigkeitsnachweis} \longrightarrow \text{ÖPNV-Reise} \longrightarrow \text{Kundenfreigabe} \longrightarrow \text{Lexware Draft-Rechnung} \longrightarrow \text{GoBD-Audit-Archiv}$$

### Technische Kern-Innovation in Version 2.5
Statt teurer, dauerhaft laufender Cloud-Server oder schwerfälliger externer Worker-Warteschlangen nutzt das System eine **vollständige 100 % Cloudflare Serverless Edge Runtime** (0,00 € Fixkosten):
1. **Cloudflare Pages:** Blitzschnelle Single Page Application (Pure Vanilla JS) mit Client-seitigem ZIP-Packaging (JSZip).
2. **Cloudflare Workers (API & Engine):** Komplette Geschäftslogik, dynamische PDF-Generierung, SHA-256 Hashing, Lexware REST-Integration, Webhooks und E-Mail-OTP Dispatching.
3. **Cloudflare D1 (SQLite Engine):** Relationale Speicherung aller Zeiterfassungen, Reisekosten, GoBD-Audit-Logs und Merkle-Siegel.
4. **Cloudflare R2:** S3-kompatibler Objektspeicher für Belege und signierte Nachweise.
5. **Autarker Docker Desktop Fallback:** 100 % Offline-Lauffähigkeit auf dem lokalen Rechner ohne Cloudflare.

```
                    KUNDE / APPROVER                    FREELANCER (Admin)
                           │                                    │
                           ▼                                    ▼
         ┌─────────────────────────────────────────────────────────────┐
         │             CLOUDFLARE (24/7 Serverless Edge)               │
         │  • Pages UI: Mobile & Desktop Zeiterfassung                 │
         │  • Zero Trust OTP: Sichere Kundenfreigabe per E-Mail-Code   │
         │  • Workers API: PDF-Engine, Hashing, Webhooks & REST API    │
         │  • D1 SQL: Zeiten, Reisen, Snapshots, GoBD-Audit-Trail      │
         │  • R2 Storage: Belegdateien & signierte Dokumente           │
         └─────────────────────────────┬───────────────────────────────┘
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼                                                     ▼
┌───────────────────────┐                             ┌───────────────────────┐
│   Lexware Office XL   │                             │  Resend E-Mail Engine │
│  (Rechnungen & Sync)  │                             │   (OTP Freigabecodes) │
└───────────────────────┘                             └───────────────────────┘
```

---

## 1. Ausgangslage und Zielsetzung

### 1.1 Ausgangslage
Für freiberufliche IT-Architektur- und Beratungsleistungen müssen Arbeitszeiten, komplexe Problemlösungen und Reisekosten kundenbezogen erfasst, vom Projektverantwortlichen freigegeben und anschließend in Lexware Office XL abgerechnet werden.
* **Fachliche Tiefe:** Reine Stundenzahlen genügen bei Betriebsprüfungen nicht. Für den Nachweis freiberuflicher/ingenieurähnlicher Tätigkeit (§ 18 EStG) müssen Problemstellung, Methodik und konkrete Arbeitsergebnisse festgehalten werden.
* **Kundenfreigabe:** Muss schnell, digital, ohne Passworteinrichtung für den Kunden (Email-OTP) und revisionssicher (kryptografisch an den Stundenzettel gebunden) erfolgen.
* **ÖPNV-first Reisen:** Reisen erfolgen überwiegend mit öffentlichen Verkehrsmitteln (Tür-zu-Tür). Reisezeit und Arbeitszeit während der Bahnfahrt müssen strikt getrennt werden.
* **Lexware-Rolle:** Lexware soll Rechnungen verwalten; die eigene Plattform vermeidet ERP-Eigenentwicklungen, sichert aber die Vorgelagerten Nachweise GoBD-konform ab.

### 1.2 Nicht-Ziele
* Keine eigene Finanzbuchhaltung (bleibt in Lexware Office XL).
* Keine eigene E-Rechnungs-Syntaxengine (ZUGFeRD/XRechnung werden über Lexware erzeugt).
* Keine automatische steuerliche Rechtsberatung (das System liefert objektive Fakten und Prüfberichte für den Steuerberater).
* Kein Vollzeit-Projektmanagementsystem (kein Ersatz für Jira oder GitHub Issues).

---

## 2. Leitprinzipien und Architekturentscheidungen

| ID | Architekturentscheidung | Begründung & Tragweite |
| :--- | :--- | :--- |
| **ADR-001** | **Lexware bleibt System of Record für Rechnungen** | Verhindert regulatorische Eigenentwicklungen; Rechnungsnummernkreis und Buchhaltung liegen in Lexware. |
| **ADR-002** | **Eigener Evidence Store vor Lexware** | Lexware speichert keine tiefen technischen Problemnachweise, multimodalen Bahnsegmente oder Freigabeprotokolle. |
| **ADR-003** | **Genehmigte Versionen sind immutable** | Ein genehmigter Stundenzettel wird niemals in der Datenbank überschrieben. Korrekturen erzeugen zwingend Version $n+1$. |
| **ADR-004** | **Zero Trust / E-Mail-OTP für Kundenfreigabe** | Keine unsicheren "Secret Links" und keine lokalen Kundenpasswörter. Authentisierung erfolgt über Cloudflare Access E-Mail-OTP. |
| **ADR-005** | **Google Routes nur für Live-Routing (kein Rohdaten-Archiv)** | Google API Terms verbieten langfristiges Caching von Routing-Rohdaten. Nur die vom Nutzer bestätigten Fakten werden gespeichert. |
| **ADR-006** | **100 % Cloudflare Serverless Edge Runtime** | 0 € monatliche Fixkosten. Weltweite 24/7-Verfügbarkeit, keine Runner-Latenz, GitHub nur als passive CI/CD-Pipeline. |
| **ADR-007** | **Autarker lokaler Betrieb mit Docker Desktop** | 100 % Offline-Lauffähigkeit und SQLite-Portabilität ohne Vendor-Lock-in. |
| **ADR-008** | **Rechnungserzeugung standardmäßig als Lexware-Draft** | API setzt `finalize=false`. Verhindert versehentliche Falschbuchungen vor der finalen Sichtprüfung. |
| **ADR-009** | **Strikte Idempotenz und Rate-Limiting** | Schützt vor Doppelrechnungen (`IdempotencyKey`) und hält das Lexware-Limit von max. 2 Requests/s sauber ein. |
| **ADR-010** | **Cloudflare R2 für Belegarchivierung (0 € Egress)** | 10 GB kostenloser Speicher, keine Downloadgebühren, S3-kompatibel für PDF- und Belegdateien. |
| **ADR-011** | **Trennung von Reisezeit vs. Arbeitszeit im Zug** | Verhindert vertraglich und strafrechtlich unzulässige Doppelabrechnungen von Arbeitsstunden und Reisezeiten. |
| **ADR-012** | **Versionierte Steuerregeln (TaxRules)** | Pauschalen (z. B. Verpflegungsmehraufwand 2026: 14 € / 28 €) ändern sich; historische Berechnungen bleiben reproduzierbar. |

---

## 3. Fachliche Domänen

### 3.1 Kunde und Projekt
* Kunden stammen führend aus Lexware (`LexwareContactId`).
* Projekte führen PO-Nummer, Laufzeit, Stundensätze, Freigabeberechtigte und projektbezogene Reiseregeln.
* Beim Periodenabschluss wird ein **Kunden- und Preissnapshot** fixiert, sodass spätere Stammdatenänderungen alte Abrechnungen nicht verändern.

### 3.2 Serviceartikel & Rechnungspositionen
Lexware unterscheidet Artikel vom Typ `PRODUCT` und `SERVICE`. Bei Rechnungsentwürfen kann ein bestehender Service referenziert werden; die konkrete Rechnungsposition überschreibt die Beschreibung mit dem projektspezifischen Leistungszeitraum, ohne den Artikelstamm in Lexware zu verändern.

*Beispielhafte Service-Mappings:*
* `IT-ARCH`: IT-Architektur und technische Lösungsplanung
* `IT-ANALYSIS`: System-, Risiko- und Anforderungsanalyse
* `IT-ENG`: Technische Konzeption und Engineering
* `IT-SEC`: Security- und Compliance-Architektur
* `WORKSHOP`: Technischer Workshop / Requirements Engineering
* `TRAVEL-COST`: Weiterberechnete Reisekosten laut Belegnachweis
* `TRAVEL-TIME`: Abrechenbare Reisezeit (falls vertraglich vereinbart)

### 3.3 Zeiterfassung & Evidence-Felder (§ 18 EStG)
Jeder Zeiteintrag (`TimeEntry`) trennt **Ist-Arbeitszeit** und **vertraglich abrechenbare Zeit**. Zur Absicherung der freiberuflichen Tätigkeit werden strukturierte Nachweisfelder geführt:

```text
TimeEntry:
├── ActualDuration (z. B. 08:15)
├── BillableDuration (z. B. 08:00 nach Rundungstakt)
├── ActivityCategory (z. B. ARCHITECTURE, SECURITY_DESIGN, ENGINEERING)
├── ShortDescription (für Rechnung & Kundenübersicht)
└── ActivityEvidence (Strukturierter Nachweis für Audit/Finanzamt):
    ├── ProblemStatement (Ausgangslage/Problem)
    ├── Methodology (Angewandte ingenieurmäßige Methodik)
    ├── TechnicalActivity (Konkret erbrachte technische Leistung)
    ├── Result (Technisches Arbeitsergebnis)
    ├── Responsibility (Eigenverantwortlicher Anteil)
    └── Deliverable (Artefakt: ADR, Solution Design, Testbericht)
```

---

## 4. Reise- und Reisekostenmodell – ÖPNV-first

### 4.1 Tür-zu-Tür-Prinzip
Eine Geschäftsreise wird als zusammenhängende Kette erfasst:
$$\text{Wohnung} \xrightarrow{\text{WALK}} \text{Bushaltestelle} \xrightarrow{\text{BUS}} \text{Bahnhof} \xrightarrow{\text{TRAIN}} \text{Zielbahnhof} \xrightarrow{\text{TRANSIT/WALK}} \text{Endkunde}$$

### 4.2 Reisezeit vs. Arbeitszeit im Zug
Um Doppelabrechnungen zu verhindern, führt das System getrennte Kennzahlen:
* **ElapsedTravelTime:** Gesamte tatsächliche Reisezeit von Tür zu Tür.
* **WorkTimeDuringTravel:** Während der Bahnfahrt geleistete Projektarbeit (als regulärer `TimeEntry` gebucht).
* **PureTravelTime:** `ElapsedTravelTime` minus `WorkTimeDuringTravel`.
* **BillableTravelTime:** Nur die laut Kundenvertrag vergütete Reisezeit.
* **TotalAbsenceDuration:** Gesamte Abwesenheitsdauer für Verpflegungsmehraufwände (§ 9 EStG / LStH 2026: > 8 Std. = 14 €, 24 Std. = 28 €).

### 4.3 Wiederkehrende Standorte & Betriebsstättenprüfung (BFH 2026)
Der BFH hat mit Urteil vom 05.02.2026 (III R 18/25) die Kriterien für Betriebsstätten bei Selbständigen präzisiert. Der Hub codiert **keine starren Schwellen**, sondern aggregiert objektive Fakten:
* Anzahl Vor-Ort-Tage vs. Remote-Tage
* Durchschnittliche Vor-Ort-Besuche pro Monat & prozentualer Anteil
* Status-Klassifikation: `BUSINESS_TRAVEL` (Auswärtstätigkeit), `TAX_ADVISOR_REVIEW` oder `BUSINESS_LOCATION`.

---

## 5. Timesheet, Dokumente und Versionierung

### 5.1 Periodenabschluss & Validierungen
Vor Erzeugung einer `TimesheetVersion` prüft das System:
* Keine Zeitüberschneidungen.
* Keine doppelte Abrechnung von Bahn-Arbeitszeit und Reisezeit.
* Vorhandensein aller Pflichtbelege zu Reisekosten.
* Vollständigkeit von PO-Nummer und Leistungsbeschreibungen.

### 5.2 Statusmodell & Unveränderbarkeit
```text
DRAFT ──► SUBMITTED ──► APPROVED ──► READY_FOR_BILLING ──► BILLED ──► ARCHIVED
              │
              └──► REJECTED ──► neuer DRAFT (Version n+1)
```
* Jede `TimesheetVersion` erhält beim Abschluss einen **SHA-256-Datenhash** und einen **SHA-256-Dokumentenhash**.
* Eine genehmigte Version (`APPROVED`) ist **physisch und logisch unveränderbar**.

### 5.3 Dokumentengenerierung & Revisionssichere Exporte
* **PDF-Leistungsnachweis (Edge Engine):** Deckblatt, Stundensummen, detaillierte Tätigkeitsliste (§ 18 EStG), Reisebelege, SHA-256-Kurzreferenz, Auftragnehmer-Signatur und digitaler Freigabestempel.
* **DATEV- & CSV-Export:** Vollständiges Buchungsjournal (DATEV-kompatibel mit Semikolon, Komma als Dezimaltrenner, UTF-8 BOM) für den direkten Steuerberater- und Excel-Import.
* **Client-seitige ZIP-Archive (JSZip):** Sammeldownloads aller Kunden-PDFs und R2-Belege ohne Cloudflare CPU-Limits.

---

## 6. Kundenfreigabe

### 6.1 Online-Freigabe über Cloudflare Zero Trust (Email-OTP)
1. Das System generiert einen Freigabelink: `https://hub.domain.de/approval/{requestId}`.
2. Der Projektverantwortliche wird über **Cloudflare Access** per **E-Mail-Einmalpasswort (OTP)** authentisiert (keine Passworteinrichtung erforderlich).
3. **Kryptografisches Binding:** Die Genehmigung speichert Benutzer-ID, Authentisierungszeitpunkt (UTC), IP/Land und den exakten **SHA-256-Hash** des angezeigten Stundenzettels.

```
+---------------+     1. Klick Freigabelink      +-------------------+
|               | -----------------------------> | Cloudflare Access |
|               | <----------------------------- | (E-Mail OTP PIN)  |
| Projektowner  |     2. PIN eingeben            +-------------------+
|               |                                          |
| (Kunde)       |     3. Stundenzettel prüfen &            | 4. Hash-Binding
|               |        "Genehmigen" klicken              v
|               | -----------------------------> [ Timesheet APPROVED ]
+---------------+                                [ Hash SHA-256 fixiert ]
```

### 6.2 Fallback: Offline-PDF & E-Mail-Import
* **Signiertes PDF:** Upload des vom Kunden gegengezeichneten Dokuments; Speicherung von Original + Signatur + Hashwerten.
* **Freigabe per E-Mail:** Import der originalen `.eml`-Datei inklusive Header, Message-ID und Hashwert.

---

## 7. Lexware-Integration

### 7.1 Schnittstellenprinzipien
* **API-Basis:** `https://api.lexware.io`
* **Sicherheit:** API-Schlüssel werden ausschließlich verschlüsselt in GitHub Secrets und Cloudflare Environment Secrets gehalten (niemals im Frontend).
* **Rate-Limit-Schutz:** Lexware begrenzt Zugriffe auf **2 Requests pro Sekunde** (`HTTP 429`). Der Worker führt clientseitiges Token-Bucket-Rate-Limiting mit Exponential Backoff aus.

### 7.2 Idempotente Rechnungsentwürfe (Draft-First)
Vor dem Aufruf von `POST /v1/invoices` erzeugt das System einen deterministischen **IdempotencyKey**:
$$\text{IdempotencyKey} = \text{SHA256}(\text{ProjectId} + \text{Period} + \text{TimesheetVersionNo} + \text{BillingBatchId})$$

* Parameter: `finalize = false` (erzeugt sicheren Entwurf in Lexware).
* Rückgabewert: Speicherung von `LexwareInvoiceId` und `InvoiceNumber` in der lokalen Datenbank.

---

## 8. Datenmodell

Das relationale Datenmodell läuft auf **Cloudflare D1 (SQLite auf der Edge)** mit strikten Fremdschlüsseln und Constraints:

```
┌──────────────────┐       ┌────────────────────────┐       ┌──────────────────────┐
│     Customer     │1     *│        Project         │1     *│      TimeEntry       │
│──────────────────│───────│────────────────────────│───────│──────────────────────│
│ Id (PK)          │       │ Id (PK)                │       │ Id (PK)              │
│ LexwareContactId │       │ CustomerId (FK)        │       │ ProjectId (FK)       │
│ Name, Snapshots  │       │ ProjectNo, PO, Rates   │       │ StartTime, EndTime   │
└──────────────────┘       └───────────┬────────────┘       │ Actual/BillableHours │
                                       │                    │ ActivityCategory     │
                                       │1                   └──────────┬───────────┘
                                       │                               │1
                                       │*                              │1
                           ┌───────────▼────────────┐       ┌──────────▼───────────┐
                           │    TimesheetVersion    │       │   ActivityEvidence   │
                           │────────────────────────│       │──────────────────────│
                           │ Id (PK)                │       │ TimeEntryId (FK)     │
                           │ ProjectId (FK)         │       │ ProblemStatement     │
                           │ VersionNo, Period      │       │ Methodology, Result  │
                           │ Status (DRAFT/APPROVED)│       │ Deliverable          │
                           │ DataHashSha256         │       └──────────────────────┘
                           │ PdfR2Key, XlsxR2Key    │
                           └───────────┬────────────┘
                                       │1
                                       │*
                           ┌───────────▼────────────┐       ┌──────────────────────┐
                           │        Approval        │       │     BillingBatch     │
                           │────────────────────────│       │──────────────────────│
                           │ Id (PK)                │       │ Id (PK)              │
                           │ TimesheetVersionId(FK) │       │ IdempotencyKey (UQ)  │
                           │ ApproverEmail, Method  │       │ LexwareInvoiceId     │
                           │ ApprovedAtUtc, Hash    │       │ DraftCreatedUtc      │
                           └────────────────────────┘       └──────────────────────┘
```

---

## 9. Systemarchitektur & Arbeitsteilung

### 9.1 Matrix der Zuständigkeiten

| Komponente / Aufgabe | Ausführende Plattform | Technologie | Grund |
| :--- | :--- | :--- | :--- |
| **Web-UI (Zeiterfassung & Dashboard)** | **Cloudflare Pages** | Pure Vanilla JS (HTML5/CSS3) | Blitzschnelle Ladezeiten, weltweit im Edge-CDN, 0 € Kosten. |
| **Kunden-Approval-Portal** | **Cloudflare Pages + Zero Trust** | E-Mail OTP & DeepLink | 24/7 online ohne eigenen Server, keine Kundenpasswörter. |
| **Transaktionsdatenbank** | **Cloudflare D1** | Serverless SQL (SQLite 3) | Integriert in Edge-Worker, 5 GB gratis, ACID-fähig, kein Lock-in. |
| **Beleg- & Dokumentenspeicher** | **Cloudflare R2** | S3-kompatibler Object Storage | 10 GB kostenlos, 0 € Egress-Gebühren für Downloads. |
| **REST-API, PDF-Engine & Sync** | **Cloudflare Workers** | TypeScript / Edge Worker | Sofortige Echtzeit-Ausführung (< 100ms) ohne externe Runner. |
| **Lexware Rechnungs-Sync & Webhooks** | **Cloudflare Workers** | TypeScript Worker | Kontrolliertes Rate-Limiting, Idempotenz, Push-Webhooks für Stornos. |
| **GoBD-Audit-Trail & Merkle-Siegel** | **Cloudflare Workers** | TypeScript / Web Crypto | Mathematische SHA-256 Merkle-Root-Versiegelung von Monatsabschlüssen. |
| **CI/CD Deployment** | **GitHub Actions** | GitHub Workflow | Automatisiertes Testen und Ausrollen bei `git push`. |

---

## 10. API-Design & Workflow-Orchestrierung

### 10.1 Cloudflare Worker API (Auszug)
* `GET /api/v1/dashboard/stats` – Live-Controlling, 3-Monats-Umsatz, offene Posten & Forecast
* `GET /api/v1/projects` & `GET /api/v1/customers` – Mandanten- und Projektverwaltung
* `POST /api/v1/time-entries` – Zeitbuchung mit § 18 EStG Evidence-Feldern
* `POST /api/v1/trips` – Reise- und Spesenabrechnung inkl. R2-Belegupload
* `POST /api/v1/timesheets/generate` – Leistungsnachweiserstellung & SHA-256 Hashing
* `POST /api/v1/public/timesheets/:id/otp/request` & `/verify` – Zero-Trust OTP Freigabe
* `POST /api/v1/webhooks/lexware` – Bidirektionaler Webhook-Empfänger für Stornos & Zahlungen
* `POST /api/v1/export/*` – Gefilterte Exporte für PDFs, Belege (ZIP), DATEV/CSV & SQL-Dumps

### 10.2 Sofortige Edge-Ausführung
Alle Geschäftslogiken (PDF-Generierung, Hashing, Lexware-API-Sync und E-Mail-Versand) werden direkt und ohne Verzögerung im Cloudflare Worker an der Edge ausgeführt. Es existiert keine Laufzeitabhängigkeit von externen CI/CD-Runnern.

---

## 11. Dokument- und Archivkonzept (GoBD & Cloudflare R2)

### 11.1 Das "Evidence Package"
Für jede gestellte Rechnung existiert ein logisches und physisches Evidence Package:
```text
EvidencePackage_RE-2026-0042/
├── Invoice_Lexware_RE-2026-0042.pdf      # Offizielle Lexware-Rechnung
├── Timesheet_v1.0_APPROVED.pdf           # GoBD-Leistungsnachweis (Edge PDF Engine)
├── Timesheet_v1.0_Buchungsjournal.csv    # DATEV-/Excel-kompatibler Export aller Buchungen
├── Approval_Protocol.json                # OTP-Protokoll, Zeitstempel, IP, Hash
├── Receipts/                             # Alle Bahn- und Reisebelege (aus R2)
│   ├── Ticket_DB_2026-09-12.pdf
│   └── Hotel_Invoice_2026-09-12.pdf
└── Manifest_SHA256.json                  # Kryptografisches Hash- & Merkle-Manifest
```

### 11.2 Aufbewahrungsklassen
* **ACCOUNTING_EVIDENCE (10 Jahre):** Rechnungen, Leistungsnachweise, Freigabeprotokolle, Reisebelege.
* **OPERATIONAL_LOG (90 Tage):** Technische Logdaten und Dispatch-Events.

---

## 12. Sicherheit, Datenschutz & Zero Trust

1. **Keine Secrets im Client:** Lexware-API-Keys und Routing-Schlüssel liegen nur in GitHub Actions Secrets bzw. Cloudflare Worker Secrets.
2. **Zero Trust Authentication:** Externe Kunden identifizieren sich über Cloudflare Access E-Mail-OTP; kein Zugriff auf das interne Dashboard.
3. **Dokumentenintegrität:** Jede PDF- und Datensatzänderung führt zu einem veränderten SHA-256-Hash.
4. **Datensparsamkeit:** Private Adressen (z. B. Startwohnung bei Reisen) werden pseudonymisiert oder nur auf Segmentebene verarbeitet.

---

## 13. Fehlerbehandlung und Robustheit

| Situation | Systemverhalten |
| :--- | :--- |
| **Lexware wirft HTTP 429 (Rate Limit)** | GitHub Action wartet mit Exponential Backoff und Retry-After-Header. |
| **Lexware wirft HTTP 504 / Timeout** | Vor Wiederholung prüft der Worker anhand des `IdempotencyKey`, ob der Draft bereits in Lexware existiert. |
| **Kunde lehnt Stundenzettel ab (Reject)** | Status wechselt auf `REJECTED` mit Pflichtkommentar; Version bleibt unverändert im Archiv; neue `DRAFT`-Version $n+1$ wird geöffnet. |
| **Belegdatei beschädigt/abgelehnt** | Upload wird blockiert; Korrektur erzeugt neue `DocumentVersion` (kein Überschreiben). |

---

## 14. Reporting und Exporte

1. **Kundenexport:** Genehmigtes Timesheet-PDF + XLSX + abrechenbare Reisekosten.
2. **Steuer- und Betriebsprüfungsexport (GoBD):**
   * Vollständiger Jahresordner mit allen Rechnungen, Stundenzetteln, Belegen und Nachweisen.
   * `Activities_2026.xlsx` & `Travel_2026.xlsx`.
   * `Evidence_Index_2026.xlsx` als interaktiver Index mit Querverweisen.
3. **Tätigkeitsportfolio (§ 18 EStG):** Jahreszusammenfassung nach Tätigkeitskategorien (*Architecture, Security Design, Engineering*) als Nachweis der freiberuflichen Prägung.

---

## 15. Verfahrensdokumentation (GoBD)

Parallel zur Implementierung wird im Ordner `docs/procedures/` die Verfahrensdokumentation geführt:
1. **Allgemeine Beschreibung:** Fachlicher Zweck, Rollen, Schnittstellen zu Lexware.
2. **Anwenderdokumentation:** Schritt-für-Schritt-Anleitung für Zeiterfassung, Monatsabschluss, Reiseerfassung und Korrekturversionen.
3. **Technische Systemdokumentation:** Datenbankschema, Cloudflare D1/R2 Konfiguration, GitHub Actions Workflows, Hashing-Verfahren.
4. **Betriebsdokumentation:** Backup-Strategie (D1-Export auf lokalen PC/GitHub), Secret-Rotation, Notfallprozess.

---

## 16. MVP- und Umsetzungsplan

### Phasenübersicht

```text
Phase 0: PoC & Validierung (Lexware API, Edge PDF Engine, Cloudflare D1/R2)
   │
Phase 1: Foundation (D1 DB Schema, Cloudflare Pages Setup, Worker API)
   │
Phase 2: Time & Evidence (Zeiterfassung UI, § 18 EStG Tätigkeitsfelder, Validierung)
   │
Phase 3: Edge PDF & DATEV Export Engine (GoBD-konformer Dokumentengenerator & JSZip)
   │
Phase 4: Zero Trust Approval (E-Mail OTP Freigabe & SHA-256 Hash-Binding)
   │
Phase 5: Lexware Integration (Idempotente Rechnungserstellung & Webhooks)
   │
Phase 6: Travel & Tax (ÖPNV/PKW-Reisen, Spesenbelege, Merkle-Root-Archivierung)
   │
Phase 7: Datensouveränität (1-Klick Backup-Center & Docker Desktop Fallback)
```

---

## 17. Teststrategie und Abnahmeszenarien

| ID | Testfall | Erwartetes Ergebnis |
| :--- | :--- | :--- |
| **T01** | Zeit erfassen mit Rundungstakt | `ActualDuration` bleibt exakt erhalten; `BillableDuration` folgt der Regel. |
| **T02** | Arbeit während der Zugfahrt | Keine doppelte Abrechnung von Arbeits- und Reisezeit. |
| **T03** | Timesheet-Abschluss & Hashing | Edge PDF Engine generiert PDF; SHA-256 Hash wird berechnet und in D1 gespeichert. |
| **T04** | Korrektur nach Genehmigung | Genehmigte Version bleibt unverändert `APPROVED`; Korrektur erzeugt Version $n+1$. |
| **T05** | Fremder Nutzer öffnet Freigabelink | Freigabecenter verweigert Zugriff ohne passenden 6-stelligen E-Mail-OTP Code. |
| **T06** | Lexware Draft-Rechnung erzeugen | Draft mit referenziertem Serviceartikel und Projekt-Beschreibung entsteht in Lexware. |
| **T07** | Doppelte Rechnungsübertragung | `IdempotencyKey` verhindert zuverlässig das Anlegen einer zweiten Rechnung. |
| **T08** | Lexware HTTP 429 Drosselung | Worker führt Backoff aus und schließt den Vorgang erfolgreich ab. |
| **T09** | GoBD-Nachweiskette | Ausgehend von der Lexware-Rechnung sind Stundenzettel, Freigabe und Belege auffindbar. |

---

## 18. GitHub-Repository- und Delivery-Konzept

* **Branching:** `main` ist produktiv und geschützt; Entwicklung erfolgt über saubere Git-Commits.
* **CI/CD:** Automatisiertes Deployment der Worker-API und Pages-Weboberfläche bei `git push`.
* **Archivierung:** Revisionssichere Belege und Snapshots werden über das Backup-Center exportiert.

---

## 19. Quellen und normative Hinweise

* **[Q1] Lexware Public API Documentation:** https://developers.lexware.io/docs/
* **[Q2] Lexware API Kochbuch Rechnungen:** https://developers.lexware.io/cookbooks/invoices/
* **[Q3] Cloudflare D1 & R2 Dokumentation:** https://developers.cloudflare.com/d1/ | https://developers.cloudflare.com/r2/
* **[Q4] BMF – GoBD (Grundsätze zur ordnungsmäßigen Führung und Aufbewahrung von Büchern):** https://ao.bundesfinanzministerium.de/ao/2025/Anhaenge/BMF-Schreiben-und-gleichlautende-Laendererlasse/Anhang-33/inhalt.html
* **[Q5] BFH, Urteil vom 05.02.2026 – III R 18/25 (Betriebsstätte / Fahrtkosten Selbständige):** https://www.bundesfinanzhof.de/
* **[Q6] § 18 EStG & EStH (Abgrenzung freiberufliche / ingenieurähnliche Tätigkeit EDV-Berater):** https://amtliche-handbuecher.bundesfinanzministerium.de/
* **[Q7] § 9 EStG & LStH 2026 (Reisekosten und Verpflegungsmehraufwendungen):** https://lsth.bundesfinanzministerium.de/

---

## Anhang A – Beispiel: fachlich aussagekräftiger Rechnungs-/Leistungsnachweis

### 1. Rechnungsentwurf (Lexware Position)
* **Serviceartikel:** `IT-ARCH` (IT-Architektur- und Beratungsleistungen)
* **Beschreibung:**  
  *IT-Architektur- und technische Konzeptionsleistungen – Microsoft 365 / Purview*  
  *Analyse der bestehenden Informationsschutzarchitektur, Erarbeitung des technischen Zielbildes für Data Loss Prevention (DLP) und Sensitivity Labels sowie Konzeption der erforderlichen Policy-, Rollen- und Eskalationsarchitektur.*  
  *Leistungszeitraum: 01.08.2026 – 31.08.2026 | Menge: 37,50 Stunden | Satz: 130,00 €/Std.*

### 2. Detaillierter Tätigkeitsnachweis im Stundenzettel (§ 18 EStG Evidence Store)
* **Problemstellung:** DLP-Regeln decken Endpoint-, SharePoint- und Exchange-Informationsflüsse nicht konsistent ab; unklare Klassifizierungsrichtlinien bei externer Freigabe.
* **Methodik:** Ist-Analyse, Requirements Engineering, Variantenvergleich von Unified DLP vs. Endpoint DLP, Architekturmodellierung.
* **Technische Leistung:** Konzeption des modularen Policy-Scopes, Ausarbeitung von Ausnahme- und Eskalationspfaden, Definition von Regel-Prioritäten.
* **Arbeitsergebnis:** *Technical Architecture Design Document v1.2*, DLP Policy Blueprint, Test- und Rollout-Konzept.
* **Verantwortung:** Eigenverantwortliche architektonische Konzeption und Review mit dem Lead Security Architect.

---

## Anhang B – Beispiel: ÖPNV-Reise

* **Reise-ID:** `TR-2026-0048`
* **Anlass / Projekt:** Kunden-Architekturworkshop vor Ort / Projekt *M365-Migration*
* **Routenablauf (Tür-zu-Tür):**
  * `05:55` Start an Wohnung $\rightarrow$ `06:03` Bushaltestelle (`WALK`, 8 Min)
  * `06:05` Abfahrt Buslinie 4 $\rightarrow$ `06:28` Hauptbahnhof (`BUS`, 23 Min)
  * `06:44` Abfahrt ICE 1505 $\rightarrow$ `09:30` Ziel-Hauptbahnhof (`TRAIN`, 166 Min)
  * `09:35` U-Bahn Linie 2 $\rightarrow$ `09:50` Haltestelle Kunde (`SUBWAY`, 15 Min)
  * `09:52` Fußweg $\rightarrow$ `10:00` Ankunft Endkunde (`WALK`, 8 Min)
* **Gespeicherte Fakten:**
  * Gesamtabwesenheit: 14 Std. 10 Min. (Anspruch Verpflegungsmehraufwand 2026: 14,00 €)
  * Arbeitszeit während ICE-Fahrt: 2,0 Stunden (gebucht als `TimeEntry` *Architecture Concept*)
  * Reine Reisezeit: 2 Std. 05 Min.
  * Belege: DB-Online-Ticket (2. Klasse) im Belegspeicher R2 hinterlegt.

---

## Anhang C – Definition of Done

- [x] Ein Projekt kann mit Lexware-Kunde, Serviceartikel, PO und Stundensatz angelegt werden.
- [x] Zeiten können mit Ist-Dauer, abrechenbarer Dauer und Evidence-Feldern erfasst werden.
- [x] Ein Monatsabschluss erzeugt eine unveränderbare `TimesheetVersion` mit SHA-256-Hash.
- [x] Edge PDF Engine erzeugt den fertigen Leistungsnachweis als PDF und sichert ihn in Cloudflare R2.
- [x] Externe Kundenfreigabe funktioniert über E-Mail-OTP mit Zero-Trust DeepLink.
- [x] Freigabeentscheidung wird kryptografisch mit dem Dokumentenhash verknüpft.
- [x] Lexware Draft Invoice wird mit korrektem Kundenkontakt, Service, Menge und Beschreibung erstellt.
- [x] Rechnungsduplikate sind durch den `IdempotencyKey` technisch ausgeschlossen.
- [x] GoBD-Verfahrensdokumentation und Merkle-Root-Siegelung sind vollständig implementiert.
- [x] 1-Klick Backup-Center (ZIP, DATEV-CSV, SQL) und Docker Desktop Notfallbetrieb sind betriebsbereit.
