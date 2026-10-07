# Dateispeicher

Ab Version 3.3.0 waehlt eine Neuinstallation zwischen D1 und R2. D1 benoetigt
keine R2-Aktivierung. R2 benoetigt eine aktive R2-Subscription mit hinterlegter
Zahlungsmethode, auch innerhalb der kostenlosen Freimengen.

## Zentraler Zugriff

Alle Beleg- und Dokumentzugriffe gehen ueber documentStorage in
src/Worker/src/services/document_storage.service.ts. Die Worker-Bindung
FILE_STORAGE_MODE bestimmt den Schreibadapter. Ohne diese Bindung bleibt das
bisherige R2-Verhalten erhalten. Bestehende Installationen werden nicht umgeschaltet.

D1-Dateien erhalten d1/UUID-Referenzen. Vorhandene R2-Referenzen bleiben lesbar,
sofern das bisherige R2-Binding erhalten bleibt. Das Feld r2Key und bestehende
Datenbank-Spaltennamen bleiben aus Kompatibilitaetsgruenden bestehen, enthalten
aber die Referenz des jeweils verwendeten Speichers.

## Grenzen und Integritaet

D1 speichert Binaerdaten in 32-KiB-Teilen, Metadaten und SHA-256-Pruefsummen.
Datei und Teile werden gemeinsam transaktional geschrieben. Fehlende Teile,
falsche Laengen oder Pruefsummen verhindern einen erfolgreichen Abruf.
Einzeldateien sind auf 8 MiB begrenzt. Cloudflares D1-Datenbankgrenzen gelten
zusaetzlich; im Free-Tarif maximal 500 MB pro Datenbank.

Automatische SQL-Sicherungen sind auf 64 MiB Exportgroesse begrenzt. Binaerdaten
werden im SQL-Export groesser als in der Datenbank. Fuer groessere Dateibestaende
R2 waehlen. Bei ueberschrittener Grenze, fehlendem Speicherplatz oder unvollstaendiger
Sicherung wird das Update gestoppt. Ein SQL-Export allein garantiert keine GoBD-Konformitaet.

## Sicherung und Wiederherstellung

D1-Dateien sind Bestandteil des SQL-Exports und des D1-Time-Travel-Standes.
Die Sicherung wird stueckweise gespeichert und geprueft; grosse SQL-Downloads
werden gestreamt. Automatische Datenbank-Wiederherstellung nutzt weiterhin
Time Travel innerhalb des sicheren 7-Tage-Fensters; aeltere Exporte bleiben
fuer manuelle Wiederherstellung verfuegbar. R2-Dateiinhalte werden nicht kopiert.

Ein Speichermoduswechsel bestehender Installationen ist keine Einstellungsaenderung:
er braucht eine gesondert gepruefte Dateimigration. Der Installer bietet keinen
solchen Wechsel an und stellt beim Update den vorhandenen Modus nicht um.

## Installation

Oeffentlicher Installer, lokaler Companion und generierte Skripte verwenden
installer/cloudflare-install.ts. Vor Ressourcenanlage werden Kollisionen,
R2-Verfuegbarkeit und das unveraenderliche GitHub-Release mit Paketpruefsumme
geprueft. Erfolg wird erst nach Deployment und Versionspruefung gemeldet.
Generierte Skripte erfordern den Repository-Checkout mit installierten npm-
Abhaengigkeiten und enthalten Zugangsdaten: nach Verwendung sicher entfernen.
