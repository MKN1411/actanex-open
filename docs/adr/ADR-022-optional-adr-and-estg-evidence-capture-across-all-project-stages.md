# ADR-022: Optionale ADR- und § 18 EStG Problemlösungsnachweis-Erfassung auf allen Projekthierarchiestufen

## Status
Akzeptiert (Accepted)

## Datum
18. September 2026

## Kontext & Problemstellung
Im Rahmen der freiberuflichen Tätigkeit als Cloud- und IT-Architekt (§ 18 Abs. 1 Nr. 1 EStG - freie Berufe) dient der Problemlösungsnachweis (Ausgangslage, Methodik, Resultat & Deliverable) als fundierte Dokumentation für das interne steuerliche Audit-PDF sowie für Betriebsprüfungen.

Nach der Einführung der 3-stufigen Projekthierarchie (ADR-021):
* **Stufe 1:** Gesamtprojekt (Hauptauftrag / Rahmenvertrag)
* **Stufe 2:** Projekt / Programm / Stream / Arbeitspaket (untergeordnet dem Rahmenvertrag)
* **Stufe 3:** Teilprojekt / Arbeitspaket (untergeordnet einem Projekt, Stream oder Programm)

ergab sich im Arbeitsalltag folgende Anforderung:
1. **Bedarfsgerechte Erfassung statt bürokratischem Zwang:** Für operative Routineaufgaben (z. B. Abstimmungen, Standard-Engineering, Onboarding) soll das Formular schlank und übersichtlich bleiben, ohne dass umfangreiche Nachweisfelder den Erfassungsprozess verlangsamen.
2. **Volle Verfügbarkeit auf Stufe 2 und Stufe 3:** Bei Architektur- und Konzeptionsleistungen, die gezielt auf Streams (Stufe 2) oder Arbeitspaketen (Stufe 3) erbracht werden, müssen Architecture Decision Records (ADR), Deliverables und Problemlösungsnachweise genauso flexibel und strukturiert erfasst werden können wie auf Stufe 1.
3. **Robuste Persistenz:** Sofern nur ein ADR-Deliverable (z. B. `ADR-014 Architecture Blueprint v1.0`) ohne detaillierte Ausgangslage eingetragen wird, durfte der Eintrag nicht verworfen werden (Behebung einer Schema-Inkonsistenz zwischen Frontend-Validierung und `NOT NULL`-Constraints in `activity_evidences`).

---

## Getroffene Entscheidungen

### 1. Einklappbare, optionale Nachweis-Sektion in der Web UI
Sowohl im Erfassungsformular (`view-time-capture`) als auch im Korrektur-Modal (`edit-time-modal`) wurde die Nachweis-Box mit einem intuitiven Einklapp-Mechanismus ausgestattet:
* **Dezenter Status:** Standardmäßig zugeklappt mit klarer Kennzeichnung (`Optional (Stufe 1, 2 & 3)`), sodass operative Tätigkeiten sekundenschnell erfasst werden können.
* **1-Klick-Ausklappbar:** Bei Architektur- und Konzeptleistungen genügt ein Klick auf `Details ausklappen`, um ADR-Referenz, Ausgangslage, Methodik und Resultat zu dokumentieren.
* **Kontextsensitive Hilfestellung:** Je nachdem, ob ein Stufe-1-, Stufe-2- oder Stufe-3-Projekt ausgewählt ist, signalisiert ein Hinweis-Icon die optionale Verfügbarkeit für die jeweilige Ebene.
* **Automatisches Aufklappen bei Bestandsdaten:** Beim Bearbeiten eines bestehenden Zeiteintrags (`openEditTimeEntryModal`) öffnet sich die Box automatisch, sofern Nachweisdaten oder ADR-Referenzen vorhanden sind.

### 2. Spezifisches ADR-Referenz- & Deliverable-Feld
Das Formular wurde um ein dediziertes Eingabefeld für **ADR-Referenzen / Deliverables** ergänzt:
* `form-ev-deliverable` bzw. `edit-ev-deliverable` (z. B. `ADR-014 Architecture Blueprint v1.0 / RFC-003`).
* Der Wert wird synchron sowohl in `activity_evidences.deliverable` als auch in `time_entries.task_or_ticket_reference` gespeichert.

### 3. Ausfallsichere Backend-Persistenz (Cloudflare Worker)
* **Entkoppelte Validierung:** Die API (`POST /api/v1/time-entries` und `PUT /api/v1/time-entries/:id`) prüft flexibel, ob ein beliebiges Nachweisfeld gefüllt ist (`problemStatement`, `methodology`, `result` oder `deliverable`).
* **Constraint-Schutz:** Sofern nur ein ADR-Deliverable erfasst wird, greift ein Fallback für `problem_statement`, sodass relationale `NOT NULL`-Integritätsbedingungen der D1-Datenbank stets erfüllt bleiben.

### 4. Transparente Darstellung im Projekt-Cockpit, Abrechnungsbaum & PDF
* **Projekt-Cockpit & Abrechnungsübersicht:** Zeiteinträge mit hinterlegten ADR-Daten erhalten ein visuelles Badge `[ADR: <Referenz>]` in Indigo-Farbgebung.
* **Leistungs- und Audit-PDF (`openTimesheetPdf`):**
  * Im kaufmännischen Nachweis erscheint die ADR-Referenz als Leistungsnachweis-Merkmal.
  * Im steuerlichen Audit-Bericht (`tax_audit`) werden Ausgangslage, Methodik, Resultat und ADR-Deliverable vollständig für das Finanzamt (§ 18 EStG) ausgewiesen.

---

## Rechtliche & steuerliche Einordnung
* **Beweisvorsorge für freiberuflichen Status (§ 18 EStG):** Durch die lückenlose Zuordnung von ADR-Dokumenten und Denkleistungen auf jeder Ebene (auch bei tief verschachtelten Arbeitspaketen) wird der Nachweis der leitenden, eigenverantwortlichen und schöpferischen Tätigkeit im Sinne des Einkommensteuergesetzes maximal gestärkt.
* **GoBD-Konformität (§ 146 AO):** Nachträgliche Änderungen an ADR-Nachweisen erzeugen revisionssichere Audit-Log-Einträge (`TIME_ENTRY_UPDATED`) und werden bei Festschreibung im Leistungsnachweis gesperrt.

---

## Konsequenzen
* **Positiv:**
  * Perfekte Ergonomie: Keine Überfrachtung bei Standardbuchungen, volle Nachweistiefe bei Architektur-Deliverables.
  * Durchgängige Konsistenz auf Stufe 1, Stufe 2 und Stufe 3.
  * Keine Datenverluste mehr bei reiner Angabe von Deliverable/ADR-Nummern.
  * 100 % abwärtskompatibel zu bestehenden Datensätzen.
