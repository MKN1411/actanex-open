# ADR-023: Dynamische Benutzer-Voreinstellungen, Schnell-Zeiterfassung im Projektfokus & Flexibler PDF-Zwischenbericht

## Status
Akzeptiert (Accepted)

## Datum
18. September 2026

## Kontext & Problemstellung
Im operativen Tagesgeschäft des Freelancer Evidence & Billing Hubs zeigten sich im Abrechnungs- und Erfassungsalltag folgende Optimierungspotenziale:
1. **Statisches Datums-Default:** Beim Öffnen der Zeiterfassung war bisher ein historisches statisches Testdatum (`2026-08-20`) hinterlegt. Für die tägliche Buchung muss stets automatisch das **aktuelle Datum des lokalen Endgeräts** vorausgewählt sein.
2. **Pausen-Vorauswahl:** Standardmäßig waren 30 Minuten Pause fest aktiviert und wurden sofort von der Nettoarbeitszeit abgezogen. Viele Freelancer erfassen Arbeitszeiten in separaten Blöcken oder ohne formelle Pausenabzüge, sodass die automatische Aktivierung zu Fehlbuchungen oder wiederkehrendem Deaktivierungsaufwand führte.
3. **Kontextwechsel bei der Abrechnung:** In der zentralen Arbeitsansicht *Abrechnung & Freigaben* (Projekt- und Stream-Bäume) fehlte die Möglichkeit, direkt auf ein fokussiertes Projekt eine Zeitbuchung vorzunehmen, ohne die Ansicht verlassen und Kunde/Projekt erneut manuell auswählen zu müssen.
4. **Fehlende Zwischenberichte & interne Gesamtauswertungen:** Bisher konnten Leistungsnachweise nur für einzelne Abrechnungsperioden eines einzelnen Projekts generiert werden. Für internes Controlling, Quartalsabschlüsse oder summarische Mandanten-Zwischenstände über mehrere Projekte oder Kunden hinweg fehlte eine flexible Auswertungskomponente.

---

## Getroffene Entscheidungen

### 1. Dynamisches lokales Tagesdatum & inaktive Standardpause
* Das Eingabefeld `#form-date` wird beim Laden der Anwendung und beim Wechsel in die Zeiterfassung dynamisch mit dem aktuellen Tagesdatum des Endbenutzers (`new Date().toLocaleDateString('sv')` &rarr; `YYYY-MM-DD`) initialisiert.
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
  * **Kaufmännische Optionen:**
    * Optional zuschaltbare Reisekosten-Einbeziehung (Standard: **inaktiv**)
    * Filter für rein abrechenbare Leistungen
* **Druck- und PDF-Ausgabe (`generateIntermediateReportPdf`):**
  * Öffnet ein druckoptimiertes A4-Dokument im Browser (`window.open`).
  * Schlanke Tabellenstruktur: Datum, Projekt/Stream, Zeitraum (von-bis), Pause, geleistete Dauer, Stundensatz, Kurzbeschreibung, Netto-Betrag.
  * Kompakter kaufmännischer Summenblock: Gesamtarbeitsstunden, abrechenbare vs. nicht abrechenbare Stunden, Netto-Honorar, optionale Reisekosten-Summe, Netto-Gesamtbetrag sowie Bruttobetrag inkl. 19 % USt.

---

## Rechtliche & GoBD-Einordnung
* **GoBD-Integrität:** Alle über die Schnellerfassung oder reguläre Erfassung gespeicherten Zeiten fließen unverändert in das revisionssichere Audit-Log ein.
* **Steuerliche Transparenz:** Der Zwischenbericht dient als Controlling- und Vorbereitungsdokument. Er ersetzt bei Rechnungslegung nicht den festgeschriebenen monatlichen Einzelleistungsnachweis, liefert jedoch lückenlose Transparenz für Projektleitung und Eigencontrolling.

---

## Konsequenzen
* **Positiv:**
  * Deutlich beschleunigter Erfassungs-Workflow ohne lästige Fehleinträge durch veraltete Datums- oder Pausenvorauswahlen.
  * Nahtloses Buchen direkt aus dem Abrechnungsbaum.
  * Leistungsfähige Quartals- und Jahresauswertungen auf Knopfdruck.
* **Kompatibilität:**
  * 100 % abwärtskompatibel zu bestehenden Daten und Endpunkten.
