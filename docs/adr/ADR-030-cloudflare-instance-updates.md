# ADR-030: Getrennter Update-Ablauf fuer Cloudflare-Instanzen

Status: Implementiert; Live-Abnahme mit Cloudflare-Testinstanz ausstehend.
Datum: 2026-10-06

## Problem

Der bisherige Installer behandelt vorhandene Ressourcen wie eine
Neuinstallation. Er kann Administratorpasswoerter und JWT-Secrets ersetzen.
Die bisherigen SQL-Dateien enthalten ueberlappende Aenderungen; der
Deployment-Workflow ignoriert Ausfuehrungsfehler. Altinstanzen besitzen
keinen verlaesslichen gemeinsamen Migrationsstand.

## Entscheidung

Ein gemeinsamer Update-Kern bedient Worker-Endpunkte, lokalen Companion und
GitHub-Deployment. Ein Preflight bindet den Plan an Quell-Commit, Worker-Code,
Konfiguration, Ressourcen und reales Schema. Der Plan wird vor Ausfuehrung
und nach Erwerb einer Datenbanksperre erneut geprueft.

Versionierte Release-Artefakte enthalten Worker, Frontend und eine beim Build
mit SQLite validierte Zielstruktur. Nur additive DDL wird erzeugt und mit
Pruefsumme protokolliert. Kein Neuinitialisieren, kein Wiederholen historischer
SQL-Dateien, keine Benutzer-/Secret-Aenderungen. Unbekannte inkompatible
Strukturen stoppen den Ablauf.

Standalone-Instanzen erhalten das Frontend im Worker; separate Pages-Projekte
erhalten dieselbe Version mit der verifizierten Worker-API-Adresse. Ein
Ergebnis gilt erst nach Pruefung der bereitgestellten Versionskennungen
und Anmeldeseite als erfolgreich. Eine Passwortanmeldung bleibt manuell.

## Folgen

Vor dem Update stehen Worker-Sicherung und D1-Bookmark bereit. Teilfehler
werden sichtbar; es gibt weder eine globale Deployment-Transaktion noch ein
automatisches Rollback. Datenumbauten sind bewusst nicht Teil dieses
additiven Verfahrens. Docker wird getrennt und spaeter behandelt.

Betrieb, Wiederherstellung und Grenzen: [Cloudflare-Updates](../CLOUDFLARE_UPDATES.md).
