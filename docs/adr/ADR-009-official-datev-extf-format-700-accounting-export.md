# ADR-009: Offizieller DATEV-EXTF-Export (Format 700 & SKR04/SKR03 Mapping)

## Status
Akzeptiert (Freigegeben für Release v2.6.0)

## Kontext
Steuerkanzleien und Kanzleiprogramme (DATEV Kanzlei-Rechnungswesen, DATEV Unternehmen Online) benötigen für den automatisierten Monats- und Jahresimport strukturierte Buchungsstapel nach dem amtlichen **DATEV EXTF-Standard**.  
Bisher bot der Hub ein generisches Controlling-Journal (CSV). Dieses erforderte jedoch bei Kanzleien manuelle Spaltenzuordnungen und Nachkontierungen.

## Entscheidung
Wir implementieren einen nativen, amtlich konformen **DATEV EXTF-Export (Format-Version 700, Kategorie 21: Buchungsstapel)**:

1. **Header-Spezifikation (Zeile 1 & 2):**
   * Kopfsatz mit Kennsatz `"EXTF"`, Versionsnummer `700`, Datenkategorie `21`.
   * Beraternummer & Mandantennummer (in `app_settings` konfigurierbar).
   * Wirtschaftsjahresbeginn, Abrechnungszeitraum, Währungskennzeichen `"EUR"`.
   * Zeile 2 mit den 116 offiziellen DATEV-Feldbezeichnungen.
2. **Automatisches Kontenmapping nach SKR04 (Standard) und SKR03:**
   * **Umsatzerlöse (Regelbesteuerung 19 %):** Konto `4400` (SKR04) bzw. `8400` (SKR03), Gegenkonto `1400` (Forderungen), Soll/Haben = `H`.
   * **Umsatzerlöse (Kleinunternehmer § 19 UStG):** Konto `4185` (SKR04) bzw. `8195` (SKR03), Steuersatz 0 %.
   * **Reisekosten (22 differenzierte Aufwandskonten):**
     * Übernachtung 7 %: `6668` / `4668`
     * Bahn / ÖPNV 7 %: `6663` / `4663`
     * PKW / Fahrtkosten / Parken 19 % / 0 %: `6670`, `6673`, `6674` / `4670`, `4673`, `4674`
     * Verpflegungsmehraufwand (VMA 0 %): `6664` / `4664`
     * Kundenbewirtung 70/30 (19 %): `6640` / `4640`
     * Mobiles Internet & Roaming (19 %): `6805` / `4920`
     * Coworking & Tagesbüro (19 %): `6310` / `4210`
     * Messen / Kongresse / Fortbildung (19 %): `6600`, `6822` / `4600`, `4945`
3. **Formatierung & Zeichensatz:**
   * Dezimaltrenner Komma (`"1850,50"`), keine Tausendertrennzeichen.
   * Formatierung Datum: `TTMM` oder `TTMMJJJJ` gem. DATEV-Regelwerk.
   * Kodierung: Windows-1252 / ANSI mit UTF-8-BOM Fallback.

## Konsequenzen
* **Positiv:** 1-Klick-Importfähigkeit in alle deutschen Steuerberater-Kanzleiprogramme.
* **Positiv:** Keine manuelle Vorkontierung von Reise- und Stundendaten durch Kanzleimitarbeiter mehr notwendig.
