# ADR-002: Zero-Trust E-Mail OTP Kundenfreigabeverfahren

## Status
**Akzeptiert**

## Kontext
Kunden und Auftraggeber müssen monatliche Leistungsnachweise und Spesenabrechnungen rechtssicher und unkompliziert freigeben können. Ein klassischer Passwort-Login für externe Kunden führt zu Supportaufwand (Passwort vergessen), Reibungsverlusten und Datenschutzproblemen. Reine unsignierte PDF-E-Mails genügen modernen Revisions- und Nachweisanforderungen nicht.

## Entscheidung
Wir implementieren ein **Zero-Trust E-Mail One-Time-Password (OTP) Freigabeverfahren**:
1. Der Kunde erhält einen kryptografisch signierten, zeitlich begrenzten Deeplink (`?ts=ID&token=SECURE_TOKEN`).
2. Das Freigabeportal öffnet sich ohne Login im Nur-Lese-Modus mit vollständiger Arbeitszeitaufstellung, Tätigkeitsnachweisen und PDF-Vorschau.
3. Zur verbindlichen Freigabe fordert der Kunde einen **6-stelligen OTP-Code** an.
4. Dieser wird via **Resend API** direkt an die vertraglich hinterlegte Ansprechpartner-E-Mail gesendet (TTL: 15 Minuten).
5. Bei Eingabe des korrekten Codes wird die Freigabe mitsamt SHA-256 Hash, IP-Adresse, Timestamp und User-Agent revisionssicher in der Tabelle `approvals` versiegelt und der Rechnungsentwurf in Lexware erzeugt.

## Konsequenzen
* **Positiv:** Maximale Benutzerfreundlichkeit für Kunden (kein Passwort merken), extrem hohe Rechtssicherheit, vollständige Nachvollziehbarkeit bei Audits.
* **Trade-off:** Der Kunde muss Zugriff auf sein E-Mail-Postfach haben, um die Freigabe zu bestätigen.
