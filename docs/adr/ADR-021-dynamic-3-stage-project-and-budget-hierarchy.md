# ADR-021: Dynamische 3-stufige Projekt- & Budget-Hierarchie mit Reisekosten-Verrechnung

## Status
Akzeptiert (Accepted)

## Datum
17. September 2026

## Kontext & Problemstellung
Im freiberuflichen Architektur- und Beratungsalltag beauftragen Endkunden oder zwischengeschaltete Personalvermittler / Kooperationspartner Freelancer häufig über einen übergreifenden Rahmenvertrag (Gesamtbudget). In der tatsächlichen Projektpraxis gliedert sich dieser Auftrag jedoch dynamisch auf:
1. **Mehrere parallele Programme, Projekte oder Workstreams:** Ein Auftraggeber stellt für verschiedene Initiativen oder Streams Teilbudgets bereit.
2. **Teilprojekte / Arbeitspakete:** Innerhalb eines Streams oder Programms existieren konkrete Arbeitspakete, auf die Zeiten und Reisekosten gebucht werden.
3. **Flexible Budgetallokation (Gepoolt vs. Eigenes Budget):**
   * Der Freelancer kennt in vielen Fällen nur das Gesamtbudget des Hauptauftrags und soll Zeiten/Reisen zwar detailliert auf Teilprojekte buchen, die interne Budgetbelastung greift jedoch auf das übergeordnete Budget zu (`PooledFromParent`).
   * In anderen Fällen existieren für einzelne Streams feste, eigenständige Kontingente (`Dedicated`).
4. **Geltung von Reisekosten-Budgets:**
   * Reisekosten (Fahrtkosten, Verpflegungsmehraufwand, Übernachtung, Belege) können nach tatsächlichem Beleg (`None`), mit einem festen Reisebudget (`Dedicated`) oder gepoolt über die übergeordnete Projektstufe (`PooledFromParent`) abgerechnet werden.

Bisher unterstützte das System lediglich eine flache Projektstruktur. Eine transparente hierarchische Abbildung mit Rollup-Kennzahlen, dynamischer Unterebenen-Anlage und integriertem Reisekosten-Tracking fehlte.

---

## Getroffene Entscheidungen

### 1. Verbindliche 3-stufige Hierarchiedefinition
Die Projekthierarchie wird in drei semantische Stufen unterteilt:
* **Stufe 1:** Gesamtprojekt (Hauptauftrag / Rahmenvertrag)
* **Stufe 2:** Projekt / Programm / Stream / Arbeitspaket (untergeordnet dem Rahmenvertrag)
* **Stufe 3:** Teilprojekt / Arbeitspaket (untergeordnet einem Projekt, Stream oder Programm)

### 2. Relationales D1-Datenbankschema (Migration 0022)
Die Tabelle `projects` wurde abwärtskompatibel um folgende Felder erweitert:
* `parent_project_id TEXT NULL`: Verweis auf das übergeordnete Projekt (`REFERENCES projects(id) ON DELETE SET NULL`).
* `hierarchy_level INTEGER NOT NULL DEFAULT 1`: Hierarchiestufe (1, 2 oder 3).
* `budget_mode TEXT NOT NULL DEFAULT 'Dedicated'`: Modus des Honorarbudgets (`'Dedicated'` für fixes Eigenkontingent oder `'PooledFromParent'` für Zugriff auf übergeordnetes Budget).
* `travel_budget_net REAL NOT NULL DEFAULT 0.0`: Maximales Netto-Reisekostenbudget.
* `travel_budget_mode TEXT NOT NULL DEFAULT 'Dedicated'`: Abrechnungsmodus der Reisekosten (`'Dedicated'`, `'PooledFromParent'` oder `'None'` für Abrechnung nach Beleg).

### 3. Hierarchische Rollup-Berechnung & Vererbung
* **Honorar-Rollup:** Bei Stufe-1-Projekten aggregiert die API `/customers/:id/overview` und `/projects/:id/details` neben den direkt gebuchten Stunden automatisch alle geleisteten Stunden und Beträge sämtlicher untergeordneter Streams und Teilprojekte.
* **Reisekosten-Rollup:** Sämtliche Reisekosten aus `trips` werden der jeweiligen Projektebene zugerechnet und bei übergeordneten Projekten im Rollup zusammengeführt.
* **Transparente Budget-Auslastung:** Bei gepoolten Projekten buchen Zeiteinträge und Reisekosten direkt gegen den Deckel der übergeordneten Stufe, wodurch Überbuchungen frühzeitig sichtbar werden.

### 4. Dynamische Benutzeroberfläche & Cascading Selectors
* **Kunden-Cockpit (Baumdarstellung):** Übersichtliche Einrückung und optische Kennzeichnung (Stufe-1-Karten mit Stufe-2- und Stufe-3-Subkarten), Budgetstatus-Badges und Rollup-Balken.
* **Dynamischer Unterebenen-Builder:** Bei der Projektanlage können über die Schaltfläche `+ Unterebene / Stream hinzufügen` direkt untergeordnete Streams mit eigenen oder gepoolten Budgets definiert und in einer atomaren Transaktion synchron angelegt werden (analog zur Rundreise-UX).
* **Cascading Dropdowns:** In der Zeiterfassung und Reisekosten-Erfassung werden Projekte hierarchisch strukturiert dargestellt (`📁 [Stufe 1] ...`, `└── 🔹 [Stufe 2] ...`, `└── ▪️ [Stufe 3] ...`).

---

## Rechtliche & steuerliche Hinweise (Disclaimer)
* **Keine Rechts- oder Steuerberatung:** Die hierarchische Strukturierung von Projekten und Budgets dient ausschließlich der internen betriebswirtschaftlichen Steuerung, Dokumentation und Vorbereitung von Abrechnungen. Sie ersetzt keine steuerliche Beratung.
* **GoBD & Leistungsnachweise:** Für die GoBD-Konformität (§ 146 AO) und die steuerliche Anerkennung von Reisekosten (§ 9 EStG / § 4 Abs. 5 EStG) bleibt jeder Tätigkeitsnachweis und Reisebeleg als originärer Einzelbeleg unveränderbar erhalten und mit einem kryptografischen SHA-256 Hash versiegelt.

---

## Konsequenzen
* **Positiv:**
  * Vollständige Flexibilität bei komplexen Multistream-Mandaten und Rahmenverträgen.
  * Klare Abgrenzung zwischen eigenständigen Projektkontingenten und geteilten Budgets.
  * Nahtlose Erfassung von Reisekosten sowohl auf Gesamtprojektebene als auch auf Stream- und Arbeitspaketebene.
  * 100 % abwärtskompatibel zu bestehenden Projekten und Zeiteinträgen.
* **Aufwand:**
  * Bei der Projektanlage müssen bei Bedarf übergeordnete Projekte und Budgetmodi ausgewählt werden.
