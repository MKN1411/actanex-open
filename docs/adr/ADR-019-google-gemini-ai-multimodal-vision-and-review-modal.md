# ADR-019: Google Gemini Multimodal Vision Integration mit Cloudflare Workers AI Fallback & Interaktiver Prüfwarteschlange

## Status
Akzeptiert (Accepted)

## Datum
8. September 2026

## Kontext & Problemstellung
Bei der Belegerfassung von Reisekosten (Tickets, Hotel, Taxi) und allgemeinen Betriebsausgaben (Bewirtung, GWG, Tankbelege) existierten bisher zwei wesentliche Herausforderungen:
1. **Erkennungsqualität & Modellgrenzen bei Cloudflare Workers AI:**
   Kompakte On-Edge-Modelle wie @cf/meta/llama-3.2-11b-vision-instruct stoßen bei komplexen Belegen (z. B. handschriftliche Bewirtungsbelege, mehrseitige PDF-Rechnungen, verknüpfte Kartenzahlungsslips) an Genauigkeitsgrenzen oder erfordern spezifische Lizenzfreigaben.
2. **Fehlende Benutzerinteraktion & manuelle Kontrollmöglichkeit vor Übernahme:**
   Bisherige KI-Scans trugen erkannte Werte direkt in Tabellenzeilen ein. Fehlerhafte OCR-Zuordnungen erforderten mühsames manuelles Suchen und Nachkorrigieren in der Tabelle.
3. **Multi-Beleg-Szenarien:**
   Beim gleichzeitigen Hochladen mehrerer Dateien (z. B. Bewirtungsbeleg + Kreditkartenslip + Trinkgeld) wurden Scans unkoordiniert verarbeitet, ohne dass der Anwender jeden Beleg vor der Übernahme einzeln auditieren und freigeben konnte.

---

## Getroffene Entscheidungen

### 1. Duale KI-Inferenz-Architektur (Google Gemini + Cloudflare Fallback)
* **Primärer KI-Provider:** Direkte Anbindung an die Google Gemini API (https://generativelanguage.googleapis.com/v1beta/models/...:generateContent) mit Multimodal-Support (Image JPEG/PNG sowie PDF via Inline-Data oder Base64).
* **Modellpalette & Standard:**
  * Standard: **Google Gemini 3.7 Flash** (gemini-3.7-flash) für maximale Präzision bei Multi-Steuersätzen und unleserlichen Belegen.
  * Schnelle Alternative: **Gemini 3.1 Flash-Lite** (gemini-3.1-flash-lite-preview).
  * Produktions- & Preview-Optionen: gemini-flash-lite-latest, gemini-2.5-flash, gemini-flash-latest, gemini-3.8-flash, gemini-3.6-flash.
* **Ausfallsicherer Fallback:** Ist kein Gemini API-Key hinterlegt oder die Google API vorübergehend nicht erreichbar, greift das System automatisch und transparent auf Cloudflare Workers AI (@cf/meta/llama-3.2-11b-vision-instruct, moondream3.1, llava-1.5) zurück.
* **Datenschutz & Mandantensicherheit:** Der Gemini API-Key wird wahlweise serverseitig als Environment-Variable (GEMINI_API_KEY) oder clientseitig verschlüsselt im Browser-LocalStorage hinterlegt und per Request übergeben.

### 2. Interaktives KI-Prüfmodal (Review-Modal)
* Vor dem Eintragen extrahierter Daten in die Reisekosten- oder Belegmaske öffnet sich zwingend ein interaktives Modal:
  * **Belegvorschau:** Visuelle Anzeige des hochgeladenen Bildes oder PDFs.
  * **Editierbare Formularfelder:** Bruttobetrag, Vorsteuer (19 % / 7 %), Belegdatum, Aussteller/Lokal, Trinkgeld, Dokumentenrolle.
  * **Modellnachweis:** Transparente Anzeige des verwendeten KI-Modells (z. B. Google Gemini 3.7 Flash).
* Der Anwender bestätigt die Daten aktiv mit [ Übernehmen ] oder bricht ab.

### 3. Sequenzielle Multi-Beleg-Prüfwarteschlange (Sequential Review Queue)
* Werden mehrere Belege gleichzeitig hochgeladen, werden diese in eine FIFO-Warteschlange eingereiht.
* Nach Bestätigung von Beleg $i öffnet sich automatisch das Review-Modal für Beleg $i+1, bis alle Belege strukturiert geprüft und zugewiesen sind.

### 4. Einheitliches Modell-Dropdown in allen Modulen
* Das KI-Modell-Dropdown in *Belege & Betriebsausgaben* (#voucher-ai-model-select) wurde mit dem Reisekosten- und Einstellungs-Dropdown synchronisiert.
* Standard-Auswahl über das gesamte System hinweg: **Google Gemini 3.7 Flash**.

---

## Rechtliche & steuerliche Hinweise (Disclaimer)
* **Keine Rechts- oder Steuerberatung:** Diese Software und die integrierten KI-Funktionen stellen ein technisches Hilfsmittel zur optischen Zeichenerkennung und Datenstrukturierung dar. Sie ersetzen keine steuerliche oder buchhalterische Beratung.
* **Keine Garantie oder Zusicherung:** Es wird keinerlei Garantie, Gewährleistung oder rechtliche Zusicherung für die inhaltliche, rechnerische oder steuerliche Richtigkeit der durch KI-Modelle erkannten Werte (z. B. Vorsteuer, Bruttobeträge, Steuersätze) übernommen. Die Verantwortung für die Prüfung, Richtigkeit und GoBD-konforme Erfassung obliegt ausschließlich dem steuerpflichtigen Anwender.

---

## Konsequenzen
* **Positiv:**
  * Signifikant höhere Erkennungsgenauigkeit auch bei schwierigen oder geknickten Belegen.
  * 100 % Kontrolle durch den Anwender vor Datenbank-Schreibvorgängen dank Review-Modal.
  * Volle Funktionalität sowohl in der Cloud (Cloudflare) als auch im lokalen Betrieb mit Docker.
* **Aufwand:**
  * Google Gemini API-Key ist optional für erweiterte Erkennung erforderlich.
