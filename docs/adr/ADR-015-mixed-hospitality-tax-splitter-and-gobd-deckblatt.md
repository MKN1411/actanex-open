# ADR-015: Gemischte Bewirtungsaufteilung nach Kopfanteilen (§ 4 Abs. 5 / § 12 EStG) & GoBD-Belegdeckblatt

## Status
**Akzeptiert (Accepted)** — 2026-08-24 (Release v2.8.0)

## Kontext & Problemstellung
Bei geschäftlichen Besprechungen und Gründungsgesprächen nehmen in der Freelancer- und Start-up-Praxis häufig gemischte Personenkreise teil (z. B. angehende Gesellschafter, IT-Partner und zugleich Familienangehörige oder private Begleitpersonen, für die keine Betreuung verfügbar war).

Das deutsche Steuerrecht stellt an die steuerliche Anerkennung von Bewirtungsaufwendungen strenge formelle und materielle Anforderungen:
1. **§ 4 Abs. 5 Nr. 2 EStG:** Bewirtungsaufwendungen sind nur zu 70 % als Betriebsausgabe abzugsfähig. Die Vorsteuer ist zu 100 % abziehbar.
2. **§ 12 Nr. 1 EStG:** Aufwendungen für die private Lebensführung dürfen den Gewinn nicht mindern.
3. **R 4.10 EStR / BFH-Rechtsprechung:** Nehmen private Personen an einem Geschäftsessen teil, ist eine Aufteilung nach **Kopfanteilen** vorzunehmen. Eine lückenlose Dokumentation unterstützt den Nachweispflichtigen bei der Darlegung der betrieblichen Veranlassung.
4. **Trinkgeld & Kartenslips:** Trinkgelder sind steuerfrei (0 % USt), müssen aber buchhalterisch dem betrieblichen Aufwand zugeordnet werden. Häufig liegt neben der Restaurant-Rechnung nur ein Gesamtslip des Kartenterminals vor.

## Entscheidung
Wir implementieren eine automatisierte **Tax-Splitter-Engine** und einen **GoBD-Belegdeckblatt-Generator** als strukturierte Dokumentationshilfe:

### 1. Mathematische Aufteilungslogik
Für einen Beleg mit Gesamtbruttobetrag $B$, Steuersatz $s$ (z. B. 19 %), Trinkgeld $T$, $N_{\text{biz}}$ geschäftlichen Teilnehmern und $N_{\text{priv}}$ privaten Begleitpersonen ($N_{\text{total}} = N_{\text{biz}} + N_{\text{priv}}$):

$$\text{Geschäftsanteil} = \frac{N_{\text{biz}}}{N_{\text{total}}}$$

$$\text{Geschäftlich Brutto} = B \cdot \text{Geschäftsanteil}$$

$$\text{Geschäftlich Netto} = \frac{\text{Geschäftlich Brutto}}{1 + \frac{s}{100}}$$

$$\text{Abzugsfähige Betriebsausgabe (70 \%)} = (\text{Geschäftlich Netto} \cdot 0{,}70) + (T \cdot \text{Geschäftsanteil})$$

$$\text{Nicht abzugsfähiger Aufwand (30 \%)} = \text{Geschäftlich Netto} \cdot 0{,}30$$

$$\text{Abziehbare Vorsteuer (100 \%)} = \text{Geschäftlich Netto} \cdot \frac{s}{100}$$

$$\text{Privater Anteil (steuerneutral)} = B - \text{Geschäftlich Brutto}$$

### 2. Standard-Kontierung (SKR04 & SKR03)
- **SKR04 `4650` (SKR03 `4650`):** Bewirtungsaufwendungen 70 % abzugsfähig (inkl. geschäftlichem Trinkgeld).
- **SKR04 `4654` (SKR03 `4654`):** Nicht abzugsfähige Bewirtungsaufwendungen 30 %.
- **SKR04 `1406` (SKR03 `1576`):** Abziehbare Vorsteuer 19 %.
- **Gegenkonto `1200` (SKR03 `1200`):** Bank / Kartenzahlung.

### 3. GoBD-Belegdeckblatt & Beweisvorsorge
- **PDF/Druck-Deckblatt im DIN A4-Format:** Beinhaltet Teilnehmerliste mit geschäftlicher/privater Kennzeichnung, konkretem Anlass, Ort, steuerlicher Betragsaufstellung und Buchungsstempel.
- **Kryptografischer Integritätsstempel:** Aus den strukturierten Belegfeldern wird ein deterministischer **SHA-256 Hash** berechnet und als Footer auf dem Belegdeckblatt ausgegeben.
- **Sekundärdokumente:** Optionale Speicherung von Businessplan-Auszügen, Agenden oder Besprechungsprotokollen als verknüpfte R2-Anhänge.

## Konsequenzen & Vorteile
- **Strukturierte Dokumentationshilfe:** Klare, rechnerisch nachvollziehbare Aufschlüsselung der Kopfanteile zur Unterstützung bei der steuerlichen Nachweisführung nach § 4 Abs. 5 EStG.
- **Direkte DATEV- & Lexware-Kompatibilität:** Übertragung der exakten Teilbuchungen an Lexware Office und DATEV EXTF 700.
