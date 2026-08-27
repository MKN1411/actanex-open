# ADR-021: ActaVault – Mobile Beleg-Inbox & Adaptives Händler-Lernen

## Status
Akzeptiert (Version 3.0)

## Kontext
Belege fallen unterwegs oft spontan an (z. B. Bahnticket, Taxi, Bewirtung). Eine finale steuerliche Kontierung und Zuweisung auf einem kleinen Smartphone-Bildschirm birgt Fehlerpotenzial. Zudem soll das System aus wiederkehrenden Benutzerkorrekturen lernen, um wiederkehrende Händler automatisch richtig zu erfassen.

## Entscheidung
1. **PWA-Modul ActaVault (`/pwa/receipt-inbox.html`):** Schnelle Belegerfassung von unterwegs per Kamera oder PDF-Upload in einen zentralen Zwischenspeicher (Status: `Draft / Unassigned`).
2. **Sicherheitsprinzip (Keine automatische Direktbuchung):** Belege werden mobil lediglich erfasst und durch Cloudflare Workers AI / OCR voranalysiert. Die finale Freigabe und Zuordnung erfolgt am Desktop-Bildschirm.
3. **Confidence-Ampel:** Extrahierte Felder erhalten einen Konfidenzscore (ab 0.90 grün/vorausgefüllt, darunter gelber Prüfhinweis).
4. **Adaptives Händler-Lernen (`merchant_rules`):** Manuelle Korrekturen am Desktop (z. B. SKR04-Konto, USt-Satz) werden in einer lokalen Regeltabelle gespeichert und künftig automatisch angewendet.

## Konsequenzen
- **Vorteile:** Schneller mobiler Belegabwurf ohne Kontierungsdruck, kontinuierlich steigende Erkennungsgenauigkeit, GoBD-Sicherheit durch finale Desktop-Prüfung.

> [!IMPORTANT]
> **Haftungs- & Steuerrechts-Disclaimer:**
> Die KI-basierte Texterkennung und Händler-Zuordnung dient ausschließlich als unverbindlicher Ausfüllvorschlag. Sie ersetzt keine manuelle Belegprüfung und keine Buchhaltungsberatung.
