# ActaNex Open · Anwenderhandbuch

Stand: 6. Oktober 2026.

Diese eigenständige statische Website erklärt ActaNex Open für Anwender. Sie enthält eine Startseite mit Funktionsübersicht und 16 Kapitel. Schwerpunkt sind die erweiterten Einstellungen.

## Inhalt

1. Funktionsübersicht
2. Schnellstart
3. Dashboard und Budgets
4. Kunden und Projekte
5. Zeiterfassung
6. Reisekosten und Etappen
7. Belege und Inbox
8. Freigaben und Abrechnung
9. Berichte und Auswertungen
10. Einstellungen im Detail
11. Kfz-Kostenplaner
12. Backup und Export
13. Audit und Nachvollziehbarkeit
14. Mobile Erfassung
15. Neuerungen und Verfügbarkeit
16. Hilfe und Quellen

## Dateien

| Datei | Zweck |
|---|---|
| `dist/index.html` | Vollständige Website mit eingebettetem CSS, JavaScript, Inhaltsdaten, Favicon und Textfallback ohne JavaScript |
| `.openai/hosting.json` | Zuordnung zur registrierten Sites-Website und statisches Ausgabeverzeichnis |
| `VERIFICATION.md` | Quellenstand, ausgeführte Prüfungen und Grenzen der Verifikation |
| `README.md` | Aufbau, Nutzung und Veröffentlichungsstand |
| Lokales Verzeichnis `archive/` | Frühere Arbeitsstände vor Änderungen; gehört nicht zum Veröffentlichungsinhalt |

Die Website hat keine externen CSS-, Schrift-, JavaScript- oder Bildabhängigkeiten. Ihre Navigation verwendet URL-Fragmente wie `#zeiten` und `#einstellungen/ki`. JavaScript tauscht ausschließlich vorverfasste Kapitel aus. Es werden keine Geschäftsdaten erfasst, keine API-Schlüssel gespeichert und keine Verbindungen zu Buchhaltungsdiensten hergestellt.

Der responsive Aufbau umfasst eine Desktop-Kapitelnavigation und ein auf Mobilgeräten aufklappbares Menü. Tastaturfokus, Escape-Schließen, Skip-Link, Drucklayout und reduzierte Bewegung sind berücksichtigt.

## Quellenstand

- Repository: [MKN1411/actanex-open](https://github.com/MKN1411/actanex-open)
- Geprüfter Quellstand: `d9d568f582feb92a8b4f9d7343b735f5c1fe19e6`
- Öffentliche Demo: [actanex-demo-web.pages.dev](https://actanex-demo-web.pages.dev/)
- README, RELEASE_NOTES.md, CHANGELOG.md, Router, Bedienansichten und Kfz-Modul wurden gelesen.
- Die Demo-Oberfläche nennt 3.0.0. Die geprüften Release-Dateien führen zuletzt 2.15.0 vom 5. Oktober 2026. Diese Abweichung wird auf der Website erklärt.
- Der angemeldete Demo-Abgleich ist nicht abgeschlossen. Das verfügbare TinyFish-Browserprofil war nicht als angemeldet bestätigt.

## Redaktionelle Regeln

Die Texte beschreiben die Bedienung und übernehmen keine Rechts- oder Konformitätsgarantien aus Quelltexten. Bezeichnungen wie „GoBD“, „amtlich“ oder „Signatur“ werden bei Bedarf als Wortlaut der Anwendung eingeordnet.

Insbesondere werden keine rechtliche oder steuerliche Anerkennung, Datenschutzkonformität, bestimmte Signaturklasse, vollständige Wiederherstellbarkeit oder dauerhaft kostenfreier Betrieb zugesichert.

Deaktivierte SKR03- und PDF-Speicheroptionen sowie angekündigte Pro-Erweiterungen sind als solche gekennzeichnet. Die im Auslandsteil angegebene Referenz 2024 wird nicht als automatisch aktueller Satzstand dargestellt. Konfigurierte E-Mail-Vorlagen werden nicht mit einem nachgewiesenen automatischen Versandzeitplan gleichgesetzt.

Zugangsdaten der Demo und persönliche Schlüssel werden nicht öffentlich abgedruckt. Frühere Lizenzentwürfe und Nutzungsgrenzen werden nicht als bereits aktive Produktfunktionen dargestellt.

## Lokal öffnen

`dist/index.html` kann direkt im Browser geöffnet werden. Wegen der eingebetteten Inhalte und Ressourcen benötigt die Anleitung keinen lokalen Node.js-Server und keine Installation.

Für eine HTTP-Vorschau oder die Sites-Veröffentlichung ist eine funktionierende lokale Ausführungsumgebung erforderlich. Das Handbuch selbst braucht keine Paketinstallation und keinen Build.

## Sites-Veröffentlichung

Das neue Handbuch ist seit dem 6. Oktober 2026 öffentlich verfügbar:

[ActaNex Open · Handbuch](https://actanex-open-handbuch.michael-kirst.chatgpt.site)

Sites-Version 1 wurde erfolgreich veröffentlicht und der Zugriff anschließend als öffentlich bestätigt. Die funktionierende Windows-Ausführung, die behobenen Probleme und die Konfiguration für spätere Veröffentlichungen sind in [PUBLISHING.md](PUBLISHING.md) dokumentiert.

Die zuvor blockierte README-Fassung bleibt unter [archive/README_before_publication_2026-10-06.md](archive/README_before_publication_2026-10-06.md) erhalten. Zugangsdaten werden nicht in den Dateien abgelegt.

## Änderungen und Pflege

Bei Änderungen bestehende Dateien zuerst archivieren. Quellhinweise und Versionsangaben aktualisieren, Navigationsziele und JavaScript prüfen und anschließend erneut veröffentlichen.

Die ActaNex-Anwendung, ihre aktive Lizenz und die geschützte Produktionsumgebung werden durch dieses Handbuch nicht verändert.
