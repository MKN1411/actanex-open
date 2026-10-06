# Prüfung des ActaNex-Open-Handbuchs

Stand: 6. Oktober 2026.

## Ausgeführte Prüfungen

- Alle 16 Kapitel sind im Inhaltsdatensatz und in der Navigation enthalten.
- Interne Kapitel- und Abschnittsverweise wurden gegen die Inhaltsdaten geprüft.
- Das eingebettete JavaScript wurde auf Syntax geprüft.
- Kapitelwechsel, Titelwechsel, aktive Navigation, Einstellungsanker, Mobilmenü, Escape-Schließen und Skip-Link wurden mit einer DOM-Simulation geprüft.
- Ein fehlerhaft codiertes URL-Fragment fällt ohne Ausnahme auf die Startseite zurück.
- Externe Links zeigen auf die ermittelten Demo-Adressen oder die genannten GitHub-Quellen.
- Fremde Zugangsdaten und persönliche API-Schlüssel sind nicht Teil der Website.
- Neue Einstellungen und deaktivierte Auswahloptionen wurden mit der Einstellungsansicht verglichen.
- Die Inhalte erläutern die Differenz zwischen Datenbankexport und Belegarchiv.
- Die Texte übernehmen keine Garantieaussagen zu GoBD, steuerlicher Anerkennung oder rechtlicher Signaturwirkung.

## Nicht ausgeführte Prüfungen

- Kein vollständiger angemeldeter Funktionsdurchlauf der Demo.
- Kein Browser-Screenshot- oder visueller Test des Handbuchs.
- Kein ausgeführter lokaler HTTP-Server.
- Kein erfolgreich abgeschlossenes Sites-Publishing.

## Ausführungsblocker

Der lokale Prozessstart wird von der Windows-Ausführungsumgebung zurückgewiesen:

`failed to prepare windows sandbox wrapper: managed networking requires the elevated Windows sandbox backend`

Dies ist kein fehlendes Demo-Passwort und kein Fehler in den Handbuchinhalten. Die GitHub- und Sites-Verbindungen waren erreichbar. Lokale Dateierstellung über den vorgesehenen Dateieditor war möglich.

## Grenzen der fachlichen Prüfung

Eine vorhandene Schaltfläche belegt nicht, dass ein externer Dienst in jeder Instanz funktioniert. Angaben zu Modellen, Providerkontingenten, E-Mail-Versand, Exportannahme und künftigen Pro-Funktionen sind deshalb entsprechend eingeordnet.

Die zugrunde liegenden Ansichten wurden quellenbasiert ausgewertet. Es wurden keine echten E-Mails versendet, Belege gebucht, Webhooks registriert oder Demo-Daten gelöscht.
