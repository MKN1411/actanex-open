# ADR-013: Cloudflare Workers AI Vision Scanner für Belege & Bewirtungsquittungen

## Status
**Akzeptiert (Accepted)** — 2026-08-24 (Release v2.8.0)

## Kontext & Problemstellung
IT-Freelancer und Berater erfassen im Alltag Belege wie Restaurant-Bewirtungsquittungen, Taxiquittungen, Kassenbons von Arbeitsmitteln (GWG) oder Tankquittungen. Das manuelle Abtippen von Ausstellername, Adresse, Datum, Steuersatz (19 %, 7 %, 0 %), Brutto-/Nettobetrag und Trinkgeld ist fehleranfällig und zeitraubend.

Klassische Cloud-OCR-Dienste (wie Google Cloud Document AI, AWS Textract, Azure AI Vision) verursachen zusätzliche laufende Drittkosten, erfordern komplexe IAM-Konfigurationen und werfen bei der Übertragung von Geschäfts- und Personenbelegen an externe US-Clouds Datenschutz- und Auftragsverarbeitungsfragen auf.

## Entscheidung
Wir binden das multimodale Vision-Modell **`@cf/meta/llama-3.2-11b-vision-instruct`** direkt über das native Cloudflare Workers AI Binding (`env.AI`) an den Backend-Worker an.

### Technische Architektur & Endpoint
1. **Worker-Binding:**
   ```jsonc
   "ai": { "binding": "AI" }
   ```
2. **Endpoint:** `POST /api/v1/vouchers/scan-ai`
   - Eingabe: Base64-codiertes Belegbild (JPG, PNG) oder Bild-Array.
   - Modell: `@cf/meta/llama-3.2-11b-vision-instruct`.
   - Prompt-Design: Streng strukturiertes JSON-Schema mit Few-Shot-Regeln für deutsche Belege (TSE-Kassenbons, Bewirtungsbelege, Kreditkarten-Terminalbelege).
   - Extraktionsfelder:
     - `supplierName`: Name des Lokals / Restaurants / Händlers
     - `locationAddress`: Anschrift & Ort
     - `voucherDate`: Belegdatum im Format `YYYY-MM-DD`
     - `amountGross`: Gesamtrechnungsbetrag (Brutto)
     - `taxRate`: Steuersatz in Prozent (`19`, `7`, `0`)
     - `amountNet`: Errechneter oder ausgewiesener Nettobetrag
     - `taxAmount`: Enthaltene Umsatzsteuer
     - `tipAmount`: Separat ausgewiesenes oder aus Kartenslip ermitteltes Trinkgeld
     - `detectedType`: Vorgeschlagene Belegkategorie (`Hospitality`, `LocalTransit`, `GWG_Asset`, `GeneralExpense`)
     - `paymentMethod`: Ermittelte Zahlungsart (`Card_NFC`, `Cash`, `BankTransfer`)
     - `summary`: Sachlicher Vorschlag für den Verwendungszweck

## Konsequenzen & Vorteile
- **Zero Additional Cost:** Im Rahmen des Cloudflare Workers AI Kontingents (Neuronen) kostenfrei nutzbar.
- **Datenschutz & DSGVO:** Belegdaten verlassen nicht die Cloudflare-Infrastruktur; kein externer Drittanbieter-Account erforderlich.
- **Hohe Genauigkeit:** Zuverlässiges Erkennen von TSE-Kassencodes, Datumsangaben und getrennten Steuersätzen.
- **Fail-Safe & Manuelle Übersteuerbarkeit:** Sollte das Bild unscharf sein, greift eine saubere Fehlerbehandlung, und alle Formularfelder können vom Benutzer im Webinterface jederzeit korrigiert oder manuell ergänzt werden.
