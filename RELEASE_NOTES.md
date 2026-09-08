# 🚀 Release Notes - Version 2.10.0 (LTS)

**Veröffentlichungsdatum:** 8. September 2026  
**Status:** Long-Term Support (LTS)  
**Kompatibilität:** 100 % abwärtskompatibel mit bestehenden Cloudflare D1- & R2-Umgebungen sowie lokalem Docker-Betrieb

---

## 🌟 Executive Summary

Mit dem Release **v2.10.0** wird der Freelancer Evidence & Billing Hub um eine **duale KI-Inferenz-Architektur** erweitert. Neben Cloudflare Workers AI steht ab sofort die **Google Gemini Multimodal API** (primär **Google Gemini 3.7 Flash** und **Gemini 3.1 Flash-Lite**) für die hochpräzise Belegerkennung von Reisekosten, mehrseitigen PDFs und komplexen Bewirtungsbelegen zur Verfügung.

Ergänzend führt v2.10.0 ein **interaktives KI-Prüfmodal (Review-Modal)** mit sequenzieller Warteschlange ein, das dem Anwender vor jeder Datenübernahme eine transparente Sichtkontrolle inklusive Belegvorschau ermöglicht. Die lokale Docker-Desktop-Laufzeitumgebung wurde auf den neuesten Schemastand synchronisiert und mit einer automatischen Erkennung lokaler KI-Services (z. B. Ollama) ausgestattet.

---

## 🔑 Die wichtigsten Neuerungen im Detail

### 1. Google Gemini Multimodal Vision & Einheitliche Modellauswahl
* **Präzisionssteigerung bei Belegen:** Durch die Integration von Gemini 3.7 Flash werden unleserliche Quittungen, handschriftliche Vermerke auf Bewirtungsbelegen und verknüpfte Kartenzahlungsslips mit marktführender Genauigkeit erfasst.
* **Einheitliches Dropdown:** Sowohl bei *Reisekosten* als auch bei *Belege & Betriebsausgaben* steht die identische Modellauswahl zur Verfügung. Standardmäßig ist Google Gemini 3.7 Flash vorausgewählt.
* **Transparenter Fallback:** Steht kein Gemini API-Key zur Verfügung oder tritt ein Timeout auf, schaltet das System verzögerungsfrei auf Cloudflare Workers AI (@cf/meta/llama-3.2-11b-vision-instruct, moondream3.1, llava-1.5) um.
* **Flexible Schlüsselverwaltung:** Der API-Schlüssel kann wahlweise als Server-Secret (GEMINI_API_KEY) oder clientseitig im Browser hinterlegt werden.

### 2. Interaktives KI-Prüfmodal & Sequenzielle Multi-Beleg-Warteschlange
* **Keine Blind-Übernahme:** Extrahierte Daten fließen nicht mehr unbesehen in Tabellenzeilen ein. Das Prüffenster zeigt:
  * Hochauflösendes Originalbild / PDF-Vorschau
  * Extrahierte Werte zur direkten Korrektur (Brutto, Netto, 7 % / 19 % Vorsteuer, Trinkgeld, Aussteller, Datum)
  * Verwendetes KI-Modell zur Nachvollziehbarkeit
* **Multi-Beleg-Queue:** Beim gleichzeitigen Upload von ..n$ Belegen werden diese geordnet nacheinander im Modal aufgerufen.

### 3. Gehärteter lokaler Docker-Betrieb & KI-Infrastruktur-Check
* **Schema-Parität:** Die lokale SQLite-Datenbank (init_clean_database.sql) enthält nun lückenlos alle Tabellen (	rip_legs, operational_vouchers, monthly_archive_seals) und Spalten (xpense_date in 	rip_expenses), wodurch alle Archiv- und Buchungsabfragen lokal fehlerfrei laufen.
* **Intelligenter Port-Wechsel:** Belegte Host-Ports (8080) werden in start-local-docker.ps1 automatisch erkannt und auf Port 8085 umgeleitet.
* **Lokale KI-Erkennung:** Das Startskript prüft automatisch auf einen aktiven Ollama-Server (http://localhost:11434) und meldet installierte Modelle im Terminal.

---

## 📚 Neue Architecture Decision Records (ADRs)

* **[ADR-019](docs/adr/ADR-019-google-gemini-ai-multimodal-vision-and-review-modal.md):** Google Gemini Multimodal Vision Integration mit Cloudflare Workers AI Fallback & Interaktiver Prüfwarteschlange
* **[ADR-020](docs/adr/ADR-020-local-docker-fallback-and-ai-detection.md):** Lokale Docker-Desktop Fallback-Infrastruktur & Lokale KI-Erkennung

---

## ⚖️ Rechtlicher Hinweis & Haftungsausschluss (Disclaimer)

* **Keine Rechts- oder Steuerberatung:** Diese Software, die beiliegenden Dokumentationen und die KI-gestützten Funktionen stellen rein technische Organisations- und Dokumentationshilfen dar. Sie ersetzen zu keinem Zeitpunkt eine fachliche Beratung durch einen Steuerberater, Wirtschaftsprüfer oder Rechtsanwalt.
* **Keine Garantie, Zusicherung von Eigenschaften oder Normen:** Es wird ausdrücklich **keine Garantie, Gewährleistung oder rechtliche Zusicherung** für die Richtigkeit, Vollständigkeit oder steuerliche Anerkennung (insbesondere hinsichtlich GoBD, EStG, UStG) der verarbeiteten Daten, berechneten Pauschalen oder durch KI-Modelle extrahierten Werte übernommen. Die Verantwortung für die ordnungsgemäße Buchführung und die Einhaltung gesetzlicher Vorschriften verbleibt vollumfänglich beim steuerpflichtigen Anwender.
