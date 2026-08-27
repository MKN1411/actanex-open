# GoBD-Muster-Verfahrensdokumentation: Freelancer Evidence & Billing Hub
## Vorlage zur Dokumentation der geordneten Zeiterfassung, Leistungsnachweise, Reisekosten und Schnittstellen zu Lexware Office

> [!NOTE]
> **Rechtlicher Hinweis & Zweck dieser Vorlage:**  
> Dieses Dokument ist eine **Muster-Verfahrensdokumentation (Vorlage)**, die Freiberuflern und Beratern als technische und organisatorische Grundlage für die eigene Betriebsorganisation dient.  
> Nach den Grundsätzen der Finanzverwaltung (**GoBD**, BMF-Schreiben vom 28.11.2019) kann eine Software alleine keine rechtliche Konformitätsgarantie erzeugen. Die GoBD-Ordnungsmäßigkeit entsteht dadurch, dass der Steuerpflichtige die hier dokumentierten Prozesse **im eigenen Geschäftsbetrieb tatsächlich umsetzt, an seine individuellen Verhältnisse anpasst und aktuell hält**. Eine Abstimmung mit dem eigenen Steuerberater wird empfohlen.

---

* **Unternehmen / Steuerpflichtiger:** [Name / Freiberufliche IT- & Cloud-Architektur]
* **Geltungsbereich:** Zeiterfassung, Tätigkeitsnachweise, Reisekostenabrechnung, digitale Kundenfreigaben, Lexware-Schnittstelle, Backup & Archivierung
* **Gültig ab:** 21. August 2026 (ab Version 2.5.0)
* **Gesetzliche Grundlagen:** GoBD (BMF-Schreiben vom 28.11.2019 / IV A 4 - S 0316/19/10003), § 145–147 AO, § 14 UStG, § 18 EStG

---

## 1. Allgemeine Beschreibung & Systemzweck

### 1.1 Zweck des IT-Systems
Der *Freelancer Evidence & Billing Hub* dient der geordneten, zeitnahen und nachvollziehbaren Erfassung, Aufbereitung und Bereitstellung von:
1. Tatsächlich geleisteter Arbeitszeit und vertraglich abrechenbarer Projektzeit.
2. Fachlichen Tätigkeitsbeschreibungen zur Dokumentation der freiberuflichen Prägung (§ 18 EStG).
3. Multimodalen Geschäftsreisen (PKW, Bahn, ÖPNV, Flug) und steuerlichen Reisekostenbelegen (SKR04).
4. Nachweisbaren Kundenfreigaben über ein webbasiertes Zero-Trust-OTP-Verfahren.
5. Vorbereitung und strukturierter Übergabe von Rechnungsdaten an das Buchhaltungssystem **Lexware Office XL**.
6. Export von revisionsorientierten Nachweisarchiven (PDF-ZIP, Belege-ZIP, DATEV-CSV, SQL-Snapshot).

### 1.2 Abgrenzung der Systeme (System of Record)
* **Lexware Office XL (Führendes Buchhaltungssystem):** Offizielles Hauptbuch, Stammdatenverwaltung, Rechnungsnummernvergabe, E-Rechnungsausstellung (ZUGFeRD / XRechnung), Zahlungsüberwachung und Umsatzsteuervoranmeldung.
* **Evidence Hub (Cloudflare Serverless Edge + Docker Desktop Fallback):** Vorgelagertes System für Leistungsnachweise, Projektstunden, Reisekostenerfassung, Freigabeprotokolle und vorgelagerte Audit-Trails.

---

## 2. Fachlicher Ablauf & Revisionskette

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│ 1. Zeiterfassung│ ──► │ 2. Leistungsnachweis │ ──► │ 3. Kundenfreigabe   │
│    & Belege     │     │    & SHA-256 Siegel  │     │    (Zero Trust OTP) │
└─────────────────┘     └──────────────────────┘     └─────────────────────┘
                                                                │
┌─────────────────┐     ┌──────────────────────┐                ▼
│ 5. GoBD-Archiv  │ ◄── │ 4. Rechnungsentwurf  │ ◄──────────────┘
│    & DATEV-CSV  │     │    in Lexware Office │
└─────────────────┘     └──────────────────────┘
```

### Schritt 1: Zeitnahe Erfassung & Belege (§ 18 EStG)
* Arbeitszeiten werden zeitnah erfasst. Für ingenieurähnliche Tätigkeiten werden strukturierte Nachweisfelder (*Problemstellung, Methodik, technische Leistung, Resultat*) dokumentiert.
* Reisekosten und Belege (Tankbelege, Bahntickets, Bewirtung) werden digital erfasst und im Objektspeicher R2 abgelegt.

### Schritt 2: Periodenabschluss & Kryptografisches Hashing
* Nach Abschluss des Monats wird der Leistungsnachweis fixiert (`Submitted`).
* Es wird ein **SHA-256-Hash** über die Datensätze und das PDF gebildet (`data_hash_sha256`, `pdf_frozen_hash`).

### Schritt 3: Kundenfreigabe via Zero Trust OTP
* Der Auftraggeber erhält einen gesicherten Zugangslink und authentifiziert sich per E-Mail-Einmalpasswort (OTP).
* Bei Genehmigung wird der Vorgang mit Zeitstempel, E-Mail-Adresse, IP-Adresse und SHA-256-Hash in der Tabelle `approvals` versiegelt.
* **Unveränderbarkeit:** Genehmigte Stundenzettel können nicht mehr im laufenden Status modifiziert werden. Korrekturen erfordern die Anlage einer Version $n+1$.

### Schritt 4: Übergabe an Lexware Office XL
* Nach Genehmigung erzeugt das System idempotent einen Rechnungsentwurf in Lexware.
* Bei Stornierungen in Lexware empfängt der Hub Push-Webhooks, entsperrt die Zeiteinträge im Hub und dokumentiert das Ereignis im Audit-Trail.

### Schritt 5: Monatssiegel & DATEV-Export
* Zum Monatsabschluss wird ein **SHA-256 Merkle-Root-Siegel** über alle Monats-Events gebildet.
* Alle Daten stehen als PDF-Sammelarchiv, Beleg-ZIP und DATEV-kompatible CSV-Datei für die Steuerberatung bereit.

---

## 3. Technische Systemdokumentation & IT-Sicherheit

### 3.1 Speicher- und Datenbankarchitektur
* **Datenbank:** Cloudflare D1 (Verteilte SQLite 3 Engine mit relationaler Integrität, Fremdschlüsseln und Indizes).
* **Objektspeicher:** Cloudflare R2 (S3-kompatibel, geordnete Ablage aller Originalquittungen und unterschriebener PDFs).
* **Audit-Trail:** Tabelle `audit_events` (Append-Only; jede statusverändernde Transaktion wird mit Akteur, Zeitstempel und Payload protokolliert).

### 3.2 Datensouveränität & Ausfallsicherheit
* **Kein Provider Lock-in:** Standardisiertes SQLite-Datenbankschema. Vollständiger 1-Klick SQL-Dump (`/api/v1/export/full-disaster-recovery-sql`) jederzeit verfügbar.
* **Autarker Notfallbetrieb:** Lokaler Betrieb via Docker Desktop (`start-local-docker.ps1`) für den 100 %igen Offline-Betrieb.

---

## 4. Internes Kontrollsystem (IKS) & Nachvollziehbarkeit

1. **Vier-Augen-Prinzip / Kundenfreigabe:** Rechnungsentwürfe werden erst nach nachgewiesener Zero-Trust OTP-Freigabe des Auftraggebers finalisiert.
2. **GoBD-Unveränderbarkeit & Festschreibung:** Änderungen an gesperrten oder abgerechneten Datensätzen sind softwareseitig durch Status-Sperren (`is_locked = 1` bzw. `status = 'Approved'`) unterbunden. Nachträgliche Korrekturen erfordern zwingend eine neue Version ($n+1$).
3. **Protokollprüfung:** Mathematische Nachprüfbarkeit aller Monatsabschlüsse über den kryptografischen SHA-256 Merkle-Root-Hash.

---

## 5. Revisionsnachweis & Systemabnahme
Ein formaler Nachweis über die technische Integrität, den Secrets-Lifecycle und die Endabnahme der Plattform (Version 2.7.0 LTS) ist im **[`System_Verification_and_Compliance_Evidence_Report.md`](System_Verification_and_Compliance_Evidence_Report.md)** dokumentiert.
