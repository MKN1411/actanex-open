# ADR-025: Nachträgliche Projekt-Budget-Anpassung, hierarchisches PDF-Reporting mit Endkunde & Einsatzort sowie Reststunden-Ausweis

## Status
Akzeptiert (Accepted)

## Datum
1. Oktober 2026

## Kontext & Problemstellung
Im operativen Projekt- und Abrechnungsalltag eines freiberuflichen IT- und Cloud-Architekten traten folgende Anforderungen auf:

1. **Korrektur von Projekt- und Stundenbudgets:**
   * Bei der Erfassung von Projektaufträgen oder Rahmenverträgen kann es zu Übertragungsfehlern bezüglich des geplanten Stundenbudgets (`planned_hours`), Stundensatzes oder Netto-Gesamtbudgets kommen.
   * Der Cloudflare Worker verfügte bisher lediglich über `POST /api/v1/projects` zur Neuanlage, nicht jedoch über eine `PUT /api/v1/projects/:id`-Schnittstelle zur gezielten nachträglichen Bearbeitung.
   * Im Frontend fehlte ein direkter, unkomplizierter 1-Klick-Workflow zur Anpassung des Projektbudgets.

2. **Hierarchisches PDF-Reporting (Projekt-Gruppierung):**
   * Der Zwischenbericht (`generateIntermediateReportPdf`) listete Zeiteinträge bisher rein chronologisch in einer flachen Tabelle auf. Bei mehreren parallelen Streams oder Arbeitspaketen fehlte die visuelle Trennung und Zwischensummenbildung je Projekt.
   * Kunden und Projektleiter (z. B. PMOs) fordern strukturierte Auswertungen, bei denen Leistungen nach Projekten gegliedert sind und Zwischensummen in Stunden und Euro ausgewiesen werden.

3. **Transparenz von Endkunde und Einsatzort:**
   * Bei Beauftragungen über Personaldienstleister/Agenturen (z. B. Vermittler / Agentur GmbH) unterscheidet sich der Vertragspartner vom eigentlichen Einsatz- und Endkunden (z. B. ACME Enterprise AG).
   * Zudem muss aus steuerlichen Gründen und zur Leistungsprüfung der Einsatzort (z. B. `Remote` oder `OnSite / Berlin`) für jeden Leistungstag im Nachweisdokument klar erkennbar sein.

4. **Vollständige Budget-Transparenz (Reststunden im Rollup):**
   * In der Gesamtbudget-Rollup-Box wurde bisher ausschließlich der verbleibende Euro-Betrag (`Rest-Gesamtbudget: 46327.50 €`) dargestellt. Für das operative Kapazitätsmanagement ist die sofortige Sichtbarkeit der verbleibenden Reststunden (`(514.75 h)`) unerlässlich.

---

## Getroffene Entscheidungen

### 1. Cloudflare Worker API: Endpunkt `PUT /api/v1/projects/:id`
* Implementierung eines PATCH-/PUT-Handlers in `src/Worker/src/index.ts`:
  * Aktualisiert flexibel: `name`, `project_number`, `end_customer_name`, `planned_hours`, `default_hourly_rate`, `total_budget_net`, `travel_budget_net`, `travel_budget_mode`, `budget_mode`, `hierarchy_level`, `start_date`, `end_date`, `approver_name`, `approver_email`.
  * Automatische Synchronisation des Gesamtbudgets: Wenn `planned_hours` und `default_hourly_rate` übergeben werden, wird `total_budget_net = planned_hours * default_hourly_rate` konsistent berechnet.
  * Revisionssichere Protokollierung des Updates im Audit-Trail mit dem Event `PROJECT_UPDATED`.

### 2. Frontend: Quick-Edit Modal für Projektbudgets
* Hinzufügen des Modals `#quick-edit-project-modal` und des Buttons **`[✏️ Budget anpassen]`** auf den Projektkarten im Cockpit sowie im Abrechnungsbaum.
* Sofortige synchrone Neuberechnung des Budgets bei Anpassung der Stunden oder Stundensätze.
* Automatischer Reload der Hierarchiebäume und Cockpits nach erfolgreichem Speichern.

### 3. PDF-Berichts-Engine: Projekt-Gruppierung & Transparenz
* Ergänzung der Checkbox `[x] Nach Projekten gruppieren (inkl. Projekt-Zwischensummen)` im Report-Builder.
* Erweiterung des Datenmodells im PDF-Generator um `end_customer_name`, `location` und `work_category`.
* Bei aktivierter Gruppierung:
  * Eigenständige Projekt-Karten mit Stufen-Badge (Stufe 1/2/3), Projektname und Projektnummer.
  * Meta-Leiste: **Auftraggeber**, **Endkunde / Projektkunde**, **Stundensatz**.
  * Detaillierte Zeiteintragstabelle inklusive Spalte **Ort / Art** (`Remote`, `OnSite`).
  * Ausweisung von **Projekt-Zwischensummen** (`Zwischensumme [Projekt]: X.XX h (XXX.XX € Netto)`).
* Bei deaktivierter Gruppierung: Kompakte chronologische Gesamttabelle mit integrierten Tags für Endkunde und Einsatzort.

### 4. Rollup-Box: Ausweisung von Reststunden und Restbudget
* Aktualisierung der Rollup-Box in der Kunden- und Cockpit-Ansicht:
  `Rest-Gesamtbudget: 46327.50 € (514.75 h)`
* Formel: $\text{Reststunden} = \text{planned\_hours} - \text{rollup\_hours}$ (mit Fallback auf $\text{rollup\_remaining\_budget\_net} / \text{default\_hourly\_rate}$).

---

## Konsequenzen

### Positiv
* **Fehlerkorrektur ohne Datenbank-Eingriff:** Übertragungsfehler in Projektaufträgen können direkt und sicher über die Benutzeroberfläche korrigiert werden.
* **Audit-Sicherheit:** Jede Budgetanpassung wird unveränderbar mit Zeitstempel und Details im Audit-Log dokumentiert.
* **Prüffähige Nachweise:** Der Zwischenbericht erfüllt sämtliche Vorgaben von Endkunden, Agenturen und Steuerprüfern hinsichtlich Transparenz von Einsatzort, Endkunde und Zwischensummen.
* **Effizientes Kapazitätscontrolling:** Freiberufler sehen sofort auf einen Blick, wie viele Reststunden in Rahmenverträgen und Streams verbleiben.
