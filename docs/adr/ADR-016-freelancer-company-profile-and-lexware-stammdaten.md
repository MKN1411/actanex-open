# ADR-016: Freelancer-Stammdatenprofil, Lexware-Synchronisation & GoBD-Deckblatt

## Status
Akzeptiert (Accepted)

## Datum
24. August 2026

## Kontext & Problemstellung
Im operativen Alltag von IT-Architekten und Freiberuflern sind verlaessliche, GoBD-konforme Stammdaten auf Belegdeckblaettern, Rechnungsnachweisen und Pruefprotokollen unerlaesslich.
Bisher waren Angaben wie Name, Berufsbezeichnung und Steuernummern statisch im Code hinterlegt. Es fehlte:
1. **Zentrale Konfiguration:** Eine zentrale Pflege aller steuerlichen und betrieblichen Stammdaten (Firmenname, Inhaber, Strasse, PLZ, Ort, Unternehmenstyp, Gewinnermittlung, Steuernummer, USt-IdNr., W-IdNr., Besteuerungsart).
2. **Lexware-Abgleich:** Ein 1-Klick-Import dieser Daten direkt aus der Lexware Office Organization & Profile API (`/v1/profile`).
3. **GoBD-Deckblatt Briefkopf:** Die automatische Einbindung dieser verifizierten Stammdaten in den Briefkopf des GoBD-Kontierungsbelegs / Belegdeckblatts.
4. **Datenschutz & KI-Kontrolle:** Eine Moeglichkeit zur datenschutzkonformen, zentralen Abschaltung der Cloudflare Workers AI Vision Belegerkennung.

## Getroffene Entscheidungen

### 1. Erweiterung der Stammdatenstruktur in `app_settings`
Die zentrale Konfigurationstabelle in Cloudflare D1 wird um folgende Felder erweitert:
* `company_name`: Offizieller Firmenname (z. B. *Cloud Security & Compliance Architecture - Michael Kirst-Neshva*)
* `contractor_name`: Name des Inhabers / Freelancers
* `company_street`, `company_zip`, `company_city`, `company_address`: Anschrift
* `company_type`: Unternehmenstyp (*Freiberufler*, *Einzelunternehmen*, *GmbH*, *UG*)
* `tax_assessment_type`: Gewinnermittlungsart (*EUeR*, *Bilanz*)
* `tax_number`, `vat_id`, `w_idnr`: Steuer-, USt-IdNr. und Wirtschafts-Identifikationsnummer
* `taxation_type`: Besteuerungsart (*Ist-Versteuerung*, *Soll-Versteuerung*)
* `enable_ai_vision`: Schalter fuer KI-Bilderkennung (Standard: `1`)

### 2. Lexware Office Profil-Import API
Neuer Backend-Endpoint `POST /api/v1/settings/import-lexware-profile`:
* Ruft `https://api.lexware.io/v1/profile` bzw. Organization-Endpunkte live ueber den hinterlegten API-Key ab.
* Aktualisiert automatisch Firmenname, Anschrift und Steuernummern in `app_settings`.

### 3. Dynamischer GoBD-Deckblatt-Briefkopf
Das druckfertige DIN A4-Deckblatt rendert ab sofort dynamisch den vollstaendigen, offiziellen Firmenbriefkopf mit Anschrift, E-Mail und USt-IdNr./Steuernummer.

### 4. Datenschutzkonformer KI-Schalter
Unter `⚙️ Konfiguration & Steuersaetze` kann die KI-Bilderkennung (`enable_ai_vision`) deaktiviert werden. In diesem Zustand werden keine Bilddaten an LLM-Endpunkte uebertragen; alle Betraege und Steuersaetze werden rein manuell erfasst.

## Konsequenzen
* **Positiv:** Vollstaendige Uebereinstimmung mit dem amtlichen Lexware-Unternehmensprofil, ordnungsgemaesse Belegdeckblaetter als strukturierte Dokumentationshilfe fuer Betriebspruefungen und volle Datenschutz-Kontrolle ueber KI-Nutzung.
