# ADR-010: Lexware Offline-CSV Beleg- & Rechnungs-Import-Format

## Status
Akzeptiert (Freigegeben für Release v2.6.0)

## Kontext
Viele Freiberufler nutzen **Lexware Office** in kleineren Editionen (z. B. Lexware Office S / M) oder **Lexware Buchhalter Desktop** ohne REST-API-Zugang (Office XL).  
Um diesen Anwendern dennoch eine nahtlose Übernahme aller im Hub erfassten Rechnungsentwürfe, Stunden und Reisebelege zu ermöglichen, wird ein standardisierter Stapel-CSV-Export benötigt.

## Entscheidung
Wir implementieren einen dedizierten **Lexware Offline-CSV-Export (`/api/v1/export/lexware-csv`)**:

1. **Dateiaufbau & Spaltenstruktur:**
   * Semikolon-getrennt mit UTF-8 Kodierung und Komma als Dezimaltrenner:
   ```csv
   Belegart;Belegdatum;Belegnummer;Kunde_Lieferant;Kategorie_Konto;Nettobetrag;Steuersatz;Umsatzsteuer;Bruttobetrag;Zahlungsstatus;Beschreibung;GoBD_Hash
   ```
2. **Datensatzzuordnung:**
   * **Einnahmen:** Stundenzettel und abrechenbare Pauschalen als Einnahmebelege mit Kundennummer, Rechnungsnummer und Netto/Brutto-Werten (19 % bzw. 0 % Kleinunternehmer).
   * **Ausgaben:** Alle 22 Reisekosten- und Belegkategorien mit Originalbelegnummer, Lieferant/Partner, Nettobetrag, Vorsteuer und Bruttobetrag.
3. **Manueller Workflow im Lexware Portal:**
   * Der Anwender exportiert die Datei im Hub und lädt sie in Lexware über *Belege erfassen > Mehrere Belege importieren (CSV)* hoch.

## Konsequenzen
* **Positiv:** Vollständige Funktionalität auch für Anwender ohne monatliche API-Kosten.
* **Positiv:** Rechnungsentwürfe und Reisekostenbelege müssen in Lexware nicht mehr manuell Zeile für Zeile eingetippt werden.
