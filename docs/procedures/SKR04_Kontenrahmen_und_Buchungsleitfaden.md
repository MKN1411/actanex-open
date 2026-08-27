# SKR04 & SKR03 Kontenrahmen- und Buchungsleitfaden
## Revisionssichere Kontierung für IT-Architekten, Freelancer & Steuerberater

**Version:** 2.6.0 LTS  
**Gültig ab:** 21. August 2026  
**Zielgruppe:** IT-Architekten, Entwickler, Freelancer, Buchhaltung & Steuerberatung  

Dieses Dokument beschreibt die amtliche Kontierung nach den DATEV-Kontenrahmen **SKR04** (Standard für IT- & Beratungsberufe) und **SKR03** (Klassischer Standard) im *Freelancer Evidence & Billing Hub* sowie die DATEV-EXTF- und Lexware-Schnittstellen.

---

## 1. Erlöskonten (Umsatzerlöse gem. § 18 EStG & § 19 UStG)

| Leistungsart / Besteuerungsart | SKR04 Konto | SKR03 Konto | USt-Satz | Verwendung im Freelancer Evidence Hub |
| :--- | :--- | :--- | :--- | :--- |
| **Regelbesteuerung (19 % USt)** | **`4400`** | **`8400`** | 19 % | Standardkonto für alle freiberuflichen IT-Architektur-, Cloud-, Security- und Entwicklungsleistungen im Inland (B2B). |
| **Weiterberechnete Reisekosten** | **`4401`** / **`4403`** | **`8401`** / **`8403`** | 19 % | Weiterberechnung von Reisekosten als umsatzsteuerpflichtige Nebenleistung (*„Nebenleistung teilt Schicksal der Hauptleistung“* gem. Abschn. 3.10 Abs. 5 UStAE). |
| **Kleinunternehmer (§ 19 UStG)** | **`4185`** | **`8195`** | 0 % | Für nicht umsatzsteuerpflichtige Kleinunternehmer gem. § 19 Abs. 1 UStG. |
| **EU B2B (Reverse Charge)** | **`4120`** | **`8336`** | 0 % (RC) | Bei B2B-Auftraggebern im EU-Ausland mit USt-IdNr. (z. B. Microsoft Irland, AWS Luxemburg). |
| **Drittland (Nicht steuerbar)** | **`4336`** | **`8338`** | 0 % | Bei B2B-Auftraggebern in Drittländern (Schweiz, USA, UK). |

---

## 2. Vollständiger Reisekosten- & Spesenkatalog (22 Kategorien)

Der Hub bietet 22 praxiserprobte Kategorien mit automatischem Vorsteuer- und Kontenmapping:

### A. Fahrtkosten & Mobilität (8 Kategorien)
| Nr. | Kategorie im Hub | SKR04 | SKR03 | Vorsteuer | Typische Belege / Verwendung |
| :---: | :--- | :--- | :--- | :--- | :--- |
| 1 | **PKW-Kilometerpauschale** | `6674` | `4674` | 0 % *(Pauschale)* | 0,30 €/km (bzw. 0,38 € ab km 21) mit eigenem PKW |
| 2 | **Mietwagen & Carsharing** | `6670` | `4670` | 19 % | Sixt, Miles, ShareNow, Europcar |
| 3 | **Kraftstoff & Ladestrom** | `6670` / `6530` | `4670` / `4530` | 19 % | Tankquittungen, Supercharger, EnBW / Ionity Ladekarte |
| 4 | **Taxi & Fahrdienste (Nah)** | `6670` | `4670` | 7 % | Stadt-Taxi, Uber, FreeNow (Strecke unter 50 km) |
| 5 | **Taxi & Fahrdienste (Fern)** | `6670` | `4670` | 19 % | Flughafen-Transfer, Überland (Strecke über 50 km) |
| 6 | **Bahn / Fernverkehr (ICE/IC)** | `6663` | `4663` | 7 % | Deutsche Bahn ICE/IC-Tickets, Sitzplatzreservierung |
| 7 | **ÖPNV & Nahverkehr** | `6663` | `4663` | 7 % | U-Bahn, Bus, Tram, Deutschlandticket |
| 8 | **Flugreisen** | `6660` | `4660` | 19 % / 0 % | Inland (19 %) oder Ausland (0 %) für Vor-Ort-Audits |

### B. Reisenebenkosten & Parken (4 Kategorien)
| Nr. | Kategorie im Hub | SKR04 | SKR03 | Vorsteuer | Typische Belege / Verwendung |
| :---: | :--- | :--- | :--- | :--- | :--- |
| 9 | **Parkgebühren & Parkhaus** | `6673` | `4673` | 19 % | Parkticket Flughafen, Bahnhof, Tiefgarage Kunde |
| 10 | **Maut, Vignette & Fähren** | `6673` | `4673` | 0 % *(Ausland)* | Autobahnmaut Österreich/Schweiz, Tunnel |
| 11 | **E-Scooter & Fahrradverleih** | `6670` | `4670` | 19 % | Tier, Bolt, Lime, Mietrad am Kundenstandort |
| 12 | **Gepäck & Equipment-Transport** | `6673` | `4673` | 19 % | Schließfach, Zusatzgepäck für Test-Hardware |

### C. Unterkunft & Hotel (3 Kategorien)
| Nr. | Kategorie im Hub | SKR04 | SKR03 | Vorsteuer | Typische Belege / Verwendung |
| :---: | :--- | :--- | :--- | :--- | :--- |
| 13 | **Hotelübernachtung (Reine Logis)** | `6668` | `4668` | 7 % | Hotelrechnung Logis-Anteil (Motel One, Hilton) |
| 14 | **Hotel-Frühstück / Business Package** | `6668` | `4668` | 19 % | Frühstück im Hotel (gesondert ausgewiesen) |
| 15 | **City-Tax / Kulturförderabgabe** | `6668` | `4668` | 0 % *(steuerfrei)* | Bettensteuer / Tourismusabgabe der Städte |

### D. Verpflegung & Bewirtung (2 Kategorien)
| Nr. | Kategorie im Hub | SKR04 | SKR03 | Vorsteuer | Typische Belege / Verwendung |
| :---: | :--- | :--- | :--- | :--- | :--- |
| 16 | **Verpflegungsmehraufwand (VMA)** | `6664` | `4664` | 0 % *(Pauschale)* | Gesetzliche Pauschale: 14 € (>8h) bzw. 28 € (24h) |
| 17 | **Geschäftliche Kundenbewirtung** | `6640` | `4640` | 19 % *(100 % Vorst.)* | Arbeitsessen mit Kunde/Projektleiter vor Ort (70/30) |

### E. IT- & Arbeitsplatz-Sonderkosten auf Reisen (5 Kategorien)
| Nr. | Kategorie im Hub | SKR04 | SKR03 | Vorsteuer | Typische Belege / Verwendung |
| :---: | :--- | :--- | :--- | :--- | :--- |
| 18 | **Mobiles Internet & Roaming** | `6805` | `4920` | 19 % | Hotel-WLAN, ICE-WLAN, Ausland-eSIM (Airalo) |
| 19 | **Day-Pass Co-Working Space** | `6310` | `4210` | 19 % | WeWork, Design Offices Tagespass vor Ort |
| 20 | **Eil-Hardware / Adapter vor Ort** | `6880` | `4985` | 19 % | Ersatz-USB-C-Netzteil, HDMI-Kabel für Beamer |
| 21 | **Messe- & Ausstellungstickets** | `6600` | `4600` | 19 % | Eintrittskarte Fachmesse (it-sa, CloudExpo) |
| 22 | **Fachkonferenzen & Seminare** | `6822` | `4945` | 19 % | Konferenzticket (AWS Summit, Microsoft Ignite) |

---

## 3. Exportformate des Evidence Hubs

Im Menü **`💾 Backup, Exporte & DATEV`** stehen 4 spezialisierte Schnittstellen bereit:

1. **🏛️ DATEV EXTF Buchungsstapel (Format 700):**  
   Amtliches Kanzleiformat (CSV) für den 1-Klick-Import in **DATEV Kanzlei-Rechnungswesen** oder **DATEV Unternehmen Online**.
2. **📄 Lexware Offline-CSV:**  
   Standard-Import-Format für **Lexware Office (S / M)** und **Lexware Buchhalter Desktop** ohne API-Lizenz.
3. **📊 Controlling- & Buchungsjournal (Excel / CSV):**  
   Betriebswirtschaftliche Übersicht zur internen Kalkulation und Projektbudget-Kontrolle.
4. **📦 Revisionssicheres Belege-Sammelarchiv (ZIP):**  
   Alle Originalquittungen und unterschriebenen Nachweise, geordnet nach Monat und SKR-Kontonummer.

---

## 4. Roadmap & Ausblick auf Version 3.0 (Individuelle Kontenpläne & Custom Accounts)

> [!NOTE]
> **Aktueller Status in Release v2.6.0:**  
> In der Version 2.6.0 sind die DATEV-Standards für **SKR04** und **SKR03** vorkonfiguriert. Die Vorkontierung der 22 Reisekostenkategorien und der Erlöskonten erfolgt vollautomatisch anhand des gewählten Kontenrahmens und des Besteuerungsstatus (Regelbesteuerung vs. Kleinunternehmer gem. § 19 UStG).

### Geplante Erweiterungen für Version 3.0:
1. **Benutzerdefinierter Kontenplan-Editor (Custom Ledger Accounts):**
   * Möglichkeit, über die UI individuelle Sachkontonummern für jedes Buchungskonto frei zu konfigurieren oder zu überschreiben (z. B. kanzleispezifische Unterkonten wie `4401`, `4402`, `6670-01`).
   * Hinzufügen von eigenen, unternehmensspezifischen Reisekosten- und Nebenkostenkategorien.
2. **Dynamische Erfassungszeilen:**
   * Die Dropdown-Auswahl im Reisekosten-Erfassungsformular passt sich dynamisch den im Custom-Kontenplan hinterlegten Kategorien und Steuersätzen an.
3. **Erweiterte Kanzlei-Stammdaten-Validierung:**
   * Validierung und Prüfziffernberechnung für Berater- und Mandantennummern sowie direkte Vorbereitung für DATEVconnect Online REST-Schnittstellen.


