# ADR-023: Dynamische Benutzer-Voreinstellungen, Schnell-Zeiterfassung im Projektfokus, Flexibler PDF-Zwischenbericht & Betragslose Tätigkeitsnachweise

## Status
Akzeptiert (Accepted)

## Datum
18. September 2026 (Erweitert am 19. September 2026)

## Kontext & Problemstellung
Im operativen Tagesgeschäft des Freelancer Evidence & Billing Hubs zeigten sich im Abrechnungs- und Erfassungsalltag folgende Optimierungspotenziale:
1. **Statisches Datums-Default:** Beim Öffnen der Zeiterfassung war bisher ein historisches statisches Testdatum (`2026-08-20`) hinterlegt. Für die tägliche Buchung muss stets automatisch das **aktuelle Datum des lokalen Endgeräts** vorausgewählt sein.
2. **Pausen-Vorauswahl:** Standardmäßig waren 30 Minuten Pause fest aktiviert und wurden sofort von der Nettoarbeitszeit abgezogen. Viele Freelancer erfassen Arbeitszeiten in separaten Blöcken oder ohne formelle Pausenabzüge, sodass die automatische Aktivierung zu Fehlbuchungen oder wiederkehrendem Deaktivierungsaufwand führte.
3. **Kontextwechsel bei der Abrechnung:** In der zentralen Arbeitsansicht *Abrechnung & Freigaben* (Projekt- und Stream-Bäume) fehlte die Möglichkeit, direkt auf ein fokussiertes Projekt eine Zeitbuchung vorzunehmen, ohne die Ansicht verlassen und Kunde/Projekt erneut manuell auswählen zu müssen.
4. **Fehlende Zwischenberichte & interne Gesamtauswertungen:** Bisher konnten Leistungsnachweise nur für einzelne Abrechnungsperioden eines einzelnen Projekts generiert werden. Für internes Controlling, Quartalsabschlüsse oder summarische Mandanten-Zwischenstände über mehrere Projekte oder Kunden hinweg fehlte eine flexible Auswertungskomponente.
5. **Bedarf an betragslosen Tätigkeitsnachweisen:** Gegenüber externen Stakeholdern (z. B. Scrum Mastern, technischen Product Ownern oder PMOs des Kunden) müssen oft reine Stundennachweise ohne finanzielle Interna (Stundensätze, Tagessätze, Honorarsummen) vorgelegt werden.
6. **Rechtliche Präzision bei GoBD-Hinweisen:** In informellen Arbeitsdokumenten (wie internen Zwischenberichten) darf keine pauschale GoBD-Garantie („gem. GoBD“) suggeriert werden, da GoBD-Konformität ein organisatorisches Gesamtverfahren des Steuerpflichtigen darstellt und Software rechtlich keine GoBD-Zertifizierung garantieren kann.

---

## Getroffene Entscheidungen

### 1. Dynamisches lokales Tagesdatum & inaktive Standardpause
* Das Eingabefeld `#form-date` wird beim Laden der Anwendung und beim Wechsel in die Zeiterfassung dynamisch mit dem aktuellen Tagesdatum des Endbenutzers (`new Date().toLocaleDateString('sv')` `YYYY-MM-DD`) initialisiert.
* Die Pausen-Checkbox `#form-has-break` ist standardmäßig **deaktiviert** (`checked = false`), das Minuten-Auswahlfeld bleibt ausgeblendet und die Pausendauer beträgt standardmäßig `0 Minuten`. Der Abzug wird nur aktiviert, wenn der Benutzer die Checkbox bewusst anwählt.

### 2. Projektzentrierte Schnellerfassung aus „Abrechnung & Freigaben“ (Option A)
* Jede Projekt- und Stream-Karte im hierarchischen Abrechnungsbaum (`renderBillingHierarchy`) erhält einen direkten Aktionsbutton `[+ Zeit erfassen]`.
* Ein Klick öffnet ein dediziertes Schnell-Modal (`#quick-time-modal`), in dem Kunde, Projekt, Hierarchiestufe und Stundensatz fest verankert sind.
* Nach dem Speichern wird der Zeiteintrag via `POST /api/v1/time-entries` persistiert und der Abrechnungsbaum aktualisiert sich ohne Seitenwechsel synchron live.

### 3. Flexibler Zwischenbericht- und PDF-Übersichts-Builder
* In der Aktionsleiste von *Abrechnung & Freigaben* wird ein zentraler Button `[📄 Zwischenbericht / PDF-Übersicht]` bereitgestellt.
* Der Dialog (`#report-builder-modal`) ermöglicht:
  * **Umfangsselektion:**
    * Alle Kunden & alle Projekte
    * Bestimmter Kunde (alle Projekte)
    * Bestimmter Kunde & gezielt ausgewählte Teilprojekte/Streams (Multi-Checkbox-Auswahl)
  * **Zeitraum-Filterung:**
    * Monat (Auswahl historischer oder aktueller Abrechnungsmonate)
    * Quartal (Q1, Q2, Q3, Q4 + Jahresangabe)
    * Gesamtjahr (z. B. 2026)
    * Freier Datumsbereich (Von - Bis)
  * **Optionen:**
    * Optional zuschaltbare Reisekosten-Einbeziehung (Standard: **inaktiv**)
    * Filter für rein abrechenbare Leistungen
    * **Neu: Ohne Stundensätze & Beträge drucken** (`#report-opt-hide-rates`, Standard: inaktiv)

### 4. Druck- und PDF-Ausgabe (`generateIntermediateReportPdf`)
* Öffnet ein druckoptimiertes A4-Dokument im Browser (`window.open`).
* **Standard-Modus (Kaufmännisch):**
  * Spalten: Datum, Projekt/Stream, Zeitraum (von-bis), Pause, geleistete Dauer, Stundensatz, Kurzbeschreibung, Netto-Betrag.
  * Kompakter kaufmännischer Summenblock: Gesamtarbeitsstunden, abrechenbare vs. nicht abrechenbare Stunden, Netto-Honorar, optionale Reisekosten-Summe, Netto-Gesamtbetrag sowie Bruttobetrag inkl. 19 % USt.
* **Betragsloser Modus (Reiner Tätigkeits- und Stundennachweis):**
  * Spalten `Satz` und `Netto (€)` werden vollständig ausgeblendet; der Tätigkeitsbeschreibung steht die volle Tabellenbreite zur Verfügung.
  * Eventuelle Reisekosten zeigen den Zweck/die Kategorie ohne finanzielle Beträge.
  * Der Summenblock wandelt sich in eine rein aufwands- und stundenbezogene Auswertung (Geleistete Stunden, Abrechenbar / Nicht abrechenbar, Erfasste Arbeitstage, Gesamtzahl Buchungen, Ø Stunden pro Tag) komplett ohne Euro-Werte.

---

## Rechtliche & GoBD-Einordnung

* **Keine unzulässige GoBD-Garantie:**
  * Die GoBD (*Grundsätze zur ordnungsmäßigen Führung und Aufbewahrung von Büchern, Aufzeichnungen und Unterlagen in elektronischer Form sowie zum Datenzugriff*) richten sich primär an die Organisations- und Buchführungsprozesse des Steuerpflichtigen.
  * Keine Software kann für sich isoliert eine rechtliche GoBD-Konformität des Nutzers „garantieren“.
  * Das System stellt unveränderliche Datenhaltung, SHA-256 Hash-Chains und lückenlose Audit-Trails nach GoBD-Grundsätzen bereit, vermeidet jedoch irreführende Formulierungen wie „gem. GoBD“ auf informellen internen Zwischenberichten.
* **Revisionssicherer Prüfpfad:**
  * Der Footer des Zwischenberichts lautet sachlich: `Freelancer Evidence & Billing Hub v2.13.0 • Interne Auswertung & Tätigkeitsnachweis • Revisionssicherer Prüfpfad • Erstellt am [Datum]`.
* **Steuerliche Transparenz:**
  * Der Zwischenbericht dient als Controlling- und Vorbereitungsdokument. Er ersetzt bei Rechnungslegung nicht den festgeschriebenen monatlichen Einzelleistungsnachweis, liefert jedoch lückenlose Transparenz für Projektleitung und Eigencontrolling.

---

## Konsequenzen
* **Positiv:**
  * Schneller Erfassungs-Workflow ohne lästige Fehleinträge durch veraltete Datums- oder Pausenvorauswahlen.
  * Nahtloses Buchen direkt aus dem Abrechnungsbaum.
  * Leistungsfähige Quartals- und Jahresauswertungen auf Knopfdruck.
  * Diskretion und Flexibilität durch Weitergabe reiner Tätigkeitsnachweise ohne Offenlegung von Honorarsätzen.
  * Höhere rechtliche Stringenz und Übereinstimmung mit dem Software-Haftungsausschluss.
* **Kompatibilität:**
  * 100 % abwärtskompatibel zu bestehenden Daten und Endpunkten.
