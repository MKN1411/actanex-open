# ADR-026: Kfz-Vollkosten- & Kilometersatz-Planer (Unverbindliche Rechenhilfe & Kalkulationsassistent)

## Status
Akzeptiert (Accepted)

## Datum
5. Oktober 2026

## Kontext & Problemstellung
Freiberufliche Cloud-, Security- und Software-Architekten nutzen für Dienstreisen und Auswärtstätigkeiten häufig ein eigenes Fahrzeug (z. B. geleastes Elektrofahrzeug oder Verbrenner). 

1. **Begrenzung der gesetzlichen Mindestpauschale:**
   * Die gesetzliche Mindestpauschale für geschäftliche Dienstreisen beträgt in Deutschland standardmäßig 0,30 € je gefahrenem Kilometer (gem. § 9 Abs. 1 Satz 3 Nr. 4a EStG / BRKG).
   * Bei modernen Leasingfahrzeugen, Elektrofahrzeugen (Wallbox-Ladestrom, Vollkasko, Sonderzahlungen) oder Neufahrzeugen liegen die tatsächlichen Gesamtkosten je Kilometer häufig deutlich über 0,30 €/km (oft zwischen 0,40 €/km und 0,65 €/km).

2. **Kalkulatorischer Aufwand & Fehlende Systemintegration:**
   * Bisher mussten Freiberufler solche Gesamtkostenberechnungen manuell in externen Excel-Tabellen oder Notizen durchführen.
   * Der ermittelte Wert musste manuell in die Systemeinstellungen eingetragen werden; die zugrundeliegenden Berechnungsfaktoren gingen dabei verloren.
   * Bei geänderten Leasingraten, Strompreisen oder Wartungskosten war keine schnelle Neu-Kalkulation im System möglich.

3. **Rechtliche & Steuerliche Abgrenzung (Wichtiger Grundsatz):**
   * Die Software darf **keine Steuerberatung** leisten und **keine rechtlichen Zusicherungen** oder Garantien bezüglich der steuerlichen Anerkennung abgeben.
   * Es muss unmissverständlich klargestellt werden, dass es sich um eine **reine, unverbindliche Rechen- und Planungshilfe** handelt. Die steuerliche Geltendmachung eines tatsächlichen Kilometersatzes (z. B. nach R 9.5 LStR) obliegt der eigenverantwortlichen Dokumentation des Steuerpflichtigen und der Abstimmung mit einem Steuerberater bzw. dem Finanzamt.

---

## Getroffene Entscheidungen

### 1. Bereitstellung eines interaktiven Kalkulators (`#vehicle-planning-modal`)
* Im Konfigurations-Center (*⚙️ Konfiguration & Steuersätze*) wird direkt neben dem Feld `Dienstreise PKW (€/km)` eine Schaltfläche **`[ 🧮 Kfz-Planer & Vollkosten-Rechner ]`** integriert.
* Das Modal bietet eine strukturierte Vollkosten-Erfassung nach zwei Hauptkostengruppen:
  1. **Fixkosten pro Jahr:**
     * Monatliche Leasing- / Finanzierungsrate ($\times 12$).
     * Einmalzahlung / Überführung / Sonderzahlung verteilt über die Gesamtlaufzeit in Monaten ($(\text{Einmalzahlung} / \text{Monate}) \times 12$).
     * Kfz-Versicherung (Haftpflicht & Kasko) pro Jahr.
     * Kfz-Steuer pro Jahr (mit Hinweis auf Steuerbefreiung für E-Autos in DE bis 2030).
     * Sonstige fixe Kosten (Stellplatz, Schutzbrief etc.).
  2. **Variable Kosten & Verbrauch pro Jahr:**
     * Differenzierung nach Antriebsart:
       * **Elektrofahrzeug (BEV):** Durchschnittsverbrauch (kWh/100 km) $\times$ Ladestrompreis (€/kWh) $\times (\text{Jahres-km} / 100)$.
       * **Verbrenner / Hybrid:** Durchschnittsverbrauch (Liter/100 km) $\times$ Kraftstoffpreis (€/l) $\times (\text{Jahres-km} / 100)$.
       * **Direkte Energiekosten:** Fester Eurobetrag pro Jahr.
     * Jährliche Wartung, Verschleiß, Reifen und Inspektion.
     * Fahrzeugpflege, Zubehör und sonstige Aufwendungen.

### 2. Live-Kalkulation, Formel & Orientierungs-Vergleich
* **Formel:**
  $$\text{Kilometersatz} = \frac{\text{Summe Fixkosten} + \text{Summe Variable Kosten}}{\text{Geplante Jahres-Gesamtfahrleistung (km)}}$$
  (kaufmännisch gerundet auf 2 Dezimalstellen).
* **Orientierungs-Vergleich:**
  Gegenüberstellung bei geschätzten geschäftlichen Jahreskilometern (z. B. 5.000 km):
  $$\text{Gesetzlich (0,30 €/km)} \quad \text{vs.} \quad \text{Individuell} \quad \rightarrow \quad \text{Kalkulatorischer Hebel / Mehraufwand}$$

### 3. Persistenz in Cloudflare D1 & App-Settings
* Die Tabelle `app_settings` wird um die Spalte `vehicle_planning_json TEXT DEFAULT '{}'` erweitert (Migration `0023_vehicle_planning_settings.sql` und dynamische Migration in `ensureSettings`).
* Bei Klick auf **`[ 📥 Als Satz übernehmen ]`**:
  * Der gerundete Satz wird in `#cfg-mileage-rate` und `globalSettings.mileage_rate_business` übernommen.
  * Alle Planungsparameter werden als JSON strukturiert in D1 persistiert.
  * Neben dem Eingabefeld erscheint ein informativer Status-Badge mit Fahrzeugbezeichnung.
  * Ein Reset-Button **`[ Standard 0,30 € ]`** ermöglicht jederzeit die sofortige Rückkehr zur gesetzlichen Mindestpauschale.

### 4. 1-Klick Nachweis-Export in die Zwischenablage
* Die Schaltfläche **`[ 📋 Nachweis kopieren ]`** formatiert die vollständige Kalkulation mit allen Kostenpositionen, Berechnungsdatum, Formeln und Disclaimer als sauberen Textblock für die Dokumentenablage oder zur Vorlage beim Steuerberater.

### 5. Durchgängige dynamische Nutzung im gesamten System
* In allen Reiseformularen, Etappen-Modals und Reiseberichten wird die Beschriftung der PKW-Auswahl dynamisch aktualisiert:
  `🚗 Eigener PKW (0,47 €/km, Eigenbeleg)`.
* Die interne Kostenberechnung (`calculateCarCost`, `calculateLegCost`, etc.) greift synchron auf `globalSettings.mileage_rate_business` zu.

### 6. Klarer Haftungsausschluss & Transparenz
* Sowohl im Modal, im kopierten Nachweistext als auch in den Dokumentationen wird prominent klargestellt:
  > *„Unverbindliche Rechenhilfe zur Orientierung und internen Kostenkalkulation. Keine Steuer- oder Rechtsberatung. Die steuerliche Geltendmachung eines tatsächlichen Kilometersatzes obliegt der ordnungsgemäßen Gesamtkostendokumentation und der Abstimmung mit einem Steuerberater bzw. Finanzamt.“*

---

## Konsequenzen

### Positiv
* **Hohe Zeitersparnis:** Freiberufler ermitteln ihren fahrzeugindividuellen Kostensatz in unter 60 Sekunden direkt im System.
* **Transparente Dokumentation:** Die Berechnungsparameter gehen nicht verloren, sondern bleiben strukturiert hinterlegt und können jederzeit nachjustiert werden.
* **Rechtssicherheit durch klare Abgrenzung:** Keine irreführenden Steuerversprechen; eindeutige Deklaration als interne Rechen- und Orientierungshilfe.
* **Flexibilität:** Schneller Wechsel zwischen Standardpauschale (0,30 €) und fahrzeugindividuellem Satz mit einem Klick.
