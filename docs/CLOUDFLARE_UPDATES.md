# Cloudflare-Updates

## Bestehende Instanz aktualisieren

Die Installationsseite bietet neben der Neuinstallation den Vorgang
**Bestehende Instanz aktualisieren**. Docker-Updates sind nicht enthalten.

1. Account-ID und API-Token eingeben. Das Token braucht Zugriff auf Workers
   Scripts, D1 und R2; bei separatem Frontend auch Pages. Alle Ressourcen muessen
   bereits vorhanden sein. Die Datenbank wird anhand des Worker-Bindings `DB`
   ermittelt und ihr Name mit der Eingabe verglichen; entsprechend gilt
   `STORAGE` fuer den R2-Bucket. Ein `JWT_SECRET` muss nicht eingegeben oder
   neu eingerichtet werden: Die Anmeldung nutzt die bestehenden Datensaetze
   in `user_sessions`. Vorhandene Secrets und Klartextvariablen bleiben erhalten.
2. Betriebsmodus waehlen: Worker mit integrierter Weboberflaeche oder Worker
   mit separatem Pages-Projekt. Repository und Zielversion angeben.
3. **Update pruefen** zeigt Ressourcen, installierte Version, Zielversion,
   festgelegten Git-Commit und ausstehende Schemaaenderungen. Alte Instanzen
   ohne Versionsbindung werden als unbekannte Version angezeigt.
4. Eigene Codeanpassungen sichern und Zielversion bestaetigen. Der optionale
   JSON-Download enthaelt nur Worker-Code und Konfiguration. Ab Version 3.2.0
   erstellt der Updater zusaetzlich eine Cloudflare-Sicherung mit SQL-Export,
   bevor er Schema oder Anwendungscode aendert. Ohne diese Sicherung kein Update.
5. Update ausfuehren. Benutzer und Passwoerter werden nicht neu angelegt;
   API-Schluessel und JWT bleiben erhalten. Der Erfolg wird erst nach
   Versionspruefung von API und Frontend sowie Abruf der Anmeldeseite gemeldet.
6. Anschliessend mit dem vorhandenen Benutzer anmelden. Eine echte Anmeldung
   wird vom Updater nicht automatisch ausgefuehrt, da er kein Passwort erfragt.

Der aktualisierte Installer muss zuerst bereitgestellt sein. Fuer den ersten
Uebergang kann der lokale Companion genutzt werden: Node.js 24, `npm ci`,
anschliessend `npm run setup`. Als Ziel muss ein Git-Commit mit den neuen
Release-Artefakten erreichbar sein. Private GitHub-Repositories werden vom
browserbasierten Updater derzeit nicht unterstuetzt.

## Schema und Wiederholbarkeit

### Konkreter Update-Test mit 3.1.1

Version 3.1.1 ergaenzt die nullable Spalte `app_settings.update_test_marker`.
Sie bleibt leer und wird von der Anwendung nicht fuer Geschaeftsdaten genutzt.
Es werden weder vorhandene Werte noch Schluessel fuer diesen Test geaendert.

Solange PR #1 nicht in `main` enthalten ist, als Quell-Repository
`MKN1411/actanex-open` und als Zielversion `codex/cloudflare-instance-update`
eintragen. Der Preflight loest den Branch in einen festen Commit auf.

Erwartetes Ergebnis fuer eine Instanz ohne diese Spalte:

1. Vor dem Update: Zielversion **3.2.0**, ausstehende Aenderung
   `column:app_settings.update_test_marker` (eventuell weitere Altstand-Differenzen).
2. Nach dem Update: API und Oberflaeche melden **3.2.0**; die Spalte existiert,
   ihre Werte sind `NULL`. Die Aenderung steht in `actanex_migrations`.
3. Erneut pruefen: Die Testspalte erscheint nicht mehr als ausstehend.

Die echte Zielinstanz muss vor dem Test separat geprueft werden. Der lokale
Regressionstest bildet diesen Ablauf mit einer befuellten SQLite-Datenbank ab.
Die Testspalte bleibt nach dem Test bestehen; ein spaeteres Entfernen braucht
eine ausdrueckliche Migration und geschieht nicht automatisch.

### Release-Erzeugung

`npm run build:release` erzeugt `worker.bundle.js` und `update-release.json`.
Die Paketversion ist die Versionsquelle. Der Build enthaelt eine gemeinsame
Release-ID fuer API und Weboberflaeche; der Installer prueft zusaetzlich die
SHA-256-Pruefsumme des Worker-Artefakts. Alle Downloads verwenden denselben
vollstaendigen Git-Commit, auch wenn ein Branch oder Tag eingegeben wurde.

Fuer die bislang uneinheitlich migrierten Altinstanzen wird der reale
SQLite-Schemastand abgefragt. Die Zielstruktur wird beim Build mit dem
TypeScript-Parser aus den bestehenden CREATE-/ALTER-Anweisungen des
Bootstrap-Service gelesen und in einer leeren SQLite-Datenbank validiert.
Alte SQL-Dateien und das kombinierte Installationsschema werden nicht erneut
ausgefuehrt. Historische Migrationen werden nicht pauschal als erledigt markiert.

Unterstuetzt werden fehlende Tabellen und ergaenzende Spalten mit kompatiblen
Definitionen. Bestehende Spaltentypen und Primaerschluessel werden geprueft.
Fehlende Pflichtspalten ohne Default, Typaenderungen und Datenumbauten brauchen
eine gesonderte Migration und stoppen das Update. Eigene zusaetzliche Spalten
bleiben erhalten. Bestehende Defaults und Fremdschluessel werden nicht umgebaut.

`actanex_migrations` speichert ausgefuehrte Aenderungen mit SQL, Pruefsumme,
Zeitpunkt und Release-ID. `actanex_update_runs` enthaelt Laufstatus, Ziel-Commit
und D1-Bookmark. Die Sperre `actanex_update_lock` verhindert parallele Updates.
Aktualisierte Instanzen verwenden `ACTANEX_MANAGED_SCHEMA=1`, damit die alten
Bootstrap-Routinen beim normalen Zugriff keine DDL-, Seed- oder
Demo-Bereinigungsanweisungen mehr ausfuehren.

Nur additive Schemaaenderungen sind vorgesehen. Eine globale Schreibpause
wird nicht aktiviert; normale Nutzerzugriffe bleiben moeglich. Ein spaeteres
Daten- oder Tabellen-Rewrite muss einen eigenen Wartungsmodus erhalten.

## Fehler und Wiederherstellung

### Cloudflare-Sicherung ab 3.2.0

Eine separate private D1-Datenbank `<Workername, maximal 48 Zeichen>-backups`
speichert vollstaendige SQL-Exporte inklusive Tabellen und Geschaeftsdaten,
Worker-Code, Konfiguration, Pruefsummen und Wiederherstellungsmetadaten.
Sie ist nicht an den Anwendungs-Worker gebunden und bleibt bei einem
Zuruecksetzen der Anwendungsdatenbank erhalten. Das Account-Token braucht
**D1 Edit** inklusive Datenbankanlage sowie **Workers Scripts Edit** und,
bei Pages, **Cloudflare Pages Edit**. Accountweite D1-Berechtigung ist fuer
die Anlage und den Zugriff auf die separate Sicherungsdatenbank erforderlich.
Eine gesetzte D1-Jurisdiction der Anwendung (etwa `eu`) wird fuer die neue
Sicherungsdatenbank uebernommen; eine abweichende bestehende Datenresidenz
stoppt die Sicherung. Ohne gesetzte Jurisdiction gilt Cloudflares Standard.

Worker-Versionen und das erfolgreiche Pages-Produktionsdeployment werden
mit ihrer ID erfasst. Cloudflare haelt die zugehoerigen Bereitstellungen
inklusive integrierter Weboberflaeche beziehungsweise Pages-Dateien vor.
Der Updater prueft ihre Verfuegbarkeit erneut vor einem Rollback. Es wird
keine unabhaengige Kopie saemtlicher Pages-Dateien in die Sicherungsdatenbank
geschrieben: Geloeschte Pages-Deployments oder nicht mehr verfuegbare Worker-
Versionen verhindern den automatischen Code-Rollback. Worker-Code bleibt
zusaetzlich als Download fuer eine manuelle Wiederbereitstellung erhalten;
Secret-Werte lassen sich nicht exportieren.

**Jetzt sichern** erstellt auch ohne Update einen Stand. **Sicherungen laden**
zeigt die letzten 100 vollstaendigen Sicherungen. **SQL und Worker herunterladen**
prueft zuerst die gespeicherten SHA-256-Pruefsummen und liefert zwei Dateien.
Cloudflare-API-Token und kurzlebige Export-URLs werden nicht gespeichert.
SQL-Dumps enthalten jedoch vertrauliche Anwendungsdaten, einschliesslich
Passworthashes und Sessions. Downloads entsprechend schuetzen.

Die gespeicherten Teile werden nach dem Schreiben erneut gelesen und geprueft.
Unvollstaendige Sicherungen erhalten nicht den Status `complete` und werden
nicht fuer Wiederherstellungen angeboten. Sicherungen werden nicht automatisch
geloescht; D1-Speicherverbrauch und Account-Limits muessen beachtet werden.
Der jetzige Ablauf nimmt maximal 16 MiB SQL und 16 MiB Worker-Code pro Stand
an. Groessere Exporte stoppen vor dem Update und benoetigen einen gesonderten
Backup-Ablauf. Exporte koennen die D1-Datenbank voruebergehend blockieren.
Fuer diesen mehrstufigen Ablauf den lokalen Companion verwenden: Ein auf
Cloudflare Workers Free gehosteter Installer kann an Request-/CPU-Limits
stossen. Das Backup selbst liegt trotzdem im Cloudflare-Konto, nicht lokal.

### Wiederherstellung

1. Die urspruenglichen Ressourcen eingeben, Sicherungen laden und Stand waehlen.
2. **Datenbank ebenfalls zuruecksetzen** aktiviert lassen fuer einen kompletten
   Stand; deaktivieren fuer reinen Code-Rollback. Beim reinen Code-Rollback
   muss der alte Code mit dem aktuellen Schema kompatibel sein.
3. **Wiederherstellung pruefen** validiert Ressourcen, Pruefsummen, native
   Worker-Versionen und Pages-Deployment. Aenderungen an Ressourcen oder
   Auswahl verwerfen die Bestaetigung. Ein geaenderter aktueller Stand
   verwirft den Wiederherstellungsplan auch serverseitig.
4. App-Nutzung und andere schreibende Prozesse anhalten, Warnung bestaetigen
   und **Stand wiederherstellen** ausfuehren. Es gibt keinen automatischen
   Wartungsmodus fuer normale App-Zugriffe. Die Sperren verhindern parallele
   Update-/Wiederherstellungslaeufe dieses Updaters, nicht externe Deployments.
5. Zuerst entsteht eine neue Sicherung des aktuellen Standes. Erst danach
   werden optional D1 sowie Worker und Pages zurueckgesetzt. Die native
   Worker-Version stellt auch ihre damaligen Bindings und Secrets wieder her.
   Spaetere Secret-Aenderungen vorher separat pruefen. Anmeldung und Daten
   anschliessend selbst kontrollieren.

Der direkte Datenbank-Rollback verwendet den Bookmark des SQL-Exports und
ist vorsorglich auf sieben Tage begrenzt, passend zum Free-Plan. Cloudflare
bietet auf Paid laengere Time-Travel-Aufbewahrung; diese wird hier nicht
automatisch erkannt. Aeltere SQL-Sicherungen bleiben unabhaengig davon in
der Sicherungsdatenbank und koennen heruntergeladen und manuell importiert
werden. Ein automatischer SQL-Import ausserhalb des Zeitfensters ist nicht
implementiert. Ein kompletter D1-Rollback ersetzt auch Daten und Sessions,
die nach dem Sicherungszeitpunkt entstanden sind. R2-Objekte bleiben
unveraendert; nachtraeglich geloeschte Dokumentdateien werden nicht restauriert.

`recovery_runs` in der Sicherungsdatenbank protokolliert Wiederherstellungen
und die ID der Sicherheitskopie. Bei Teilfehlern wird die Phase gemeldet;
es gibt keine globale Transaktion und kein automatisches Rueckrollen des
Rueckrollens. Die Sicherheitskopie bleibt fuer einen erneuten Versuch erhalten.
Nach einem abgebrochenen Prozess gegebenenfalls `recovery_lock` sowie die
zugehoerige `actanex_update_lock` erst nach Pruefung des Laufstatus freigeben.

Vor der ersten Aenderung wird ein D1-Time-Travel-Bookmark erfasst. Ist dies
nicht moeglich, stoppt der Ablauf. Dieser Bookmark sichert weder R2-Dateien
noch Secret-Werte. Der Updater veraendert keine R2-Objekte und keine Secrets.

Worker- und Pages-Deployment bilden keine gemeinsame Transaktion. Bei Fehlern
werden Phase, Lauf-ID und Bookmark angezeigt. Bereits ausgefuehrte Aenderungen
bleiben bestehen; es gibt kein automatisches Zuruecksetzen. Ein erneuter
Preflight prueft den tatsaechlichen Zustand und erstellt einen neuen Plan.

Bei einem abgebrochenen Prozess kann die Updatesperre bestehen bleiben. Erst
pruefen, dass kein Lauf mehr aktiv ist; dann den betroffenen Eintrag aus
`actanex_update_lock` anhand der Lauf-ID entfernen. Keine automatische
Zeitablauf-Freigabe: Sie koennte einen noch aktiven Lauf ueberholen.

Fuer manuelle Wiederherstellung stehen weiterhin Cloudflare Versions/Rollback,
Pages-Rollback und SQL-Import zur Verfuegung. Die reine Worker-JSON-Datei ersetzt
keine vollstaendige Cloudflare-Sicherung.

## GitHub und lokale Pruefung

Der Deployment-Workflow nutzt denselben Update-Kern einschliesslich Sicherung.
Nur die separate Sicherungsdatenbank wird bei Bedarf angelegt; fehlende
Anwendungsressourcen werden nicht automatisch erzeugt, SQL-Fehler nicht ignoriert. Fuer eine neue
Instanz bleibt der separate Installations-/Bootstrap-Ablauf erforderlich.

Repository-Secrets: `CLOUDFLARE_API_TOKEN` und `CLOUDFLARE_ACCOUNT_ID`
(alternativ die bisherigen `CF_*`-Namen). Optionale Repository-Variablen:
`ACTANEX_MODE` (`pages` oder `standalone`), `ACTANEX_WORKER`,
`ACTANEX_DATABASE`, `ACTANEX_BUCKET`, `ACTANEX_PAGES`.

Die CLI schreibt eine lokale Worker-Sicherung unter `output/update-recovery`.
GitHub archiviert nur das Ergebnisprotokoll; Konfigurationswerte oder eigener
Worker-Code werden nicht als oeffentliches Workflow-Artefakt hochgeladen.

Pruefungen:

```text
npm ci
npm ci --prefix src/Worker
npm test
npm run typecheck --prefix src/Worker
npm run test:ui
npm run build:release
```

Die Ablaufpruefungen verwenden echtes SQLite und simulierte Cloudflare-/GitHub-
Antworten. Sie ersetzen keinen Test mit einer Cloudflare-Testinstanz. Die
Browserpruefungen laufen lokal mit Edge auf Desktop- und Smartphone-Abmessungen.

## API-Referenzen

- [Worker Upload-Metadaten](https://developers.cloudflare.com/workers/configuration/multipart-upload-metadata/)
- [D1 Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/)
- [D1 SQL-Export](https://developers.cloudflare.com/api/resources/d1/subresources/database/methods/export/)
- [Worker-Versionsdeployment](https://developers.cloudflare.com/api/resources/workers/subresources/scripts/subresources/deployments/methods/create/)
- [Pages-Rollback](https://developers.cloudflare.com/api/resources/pages/subresources/projects/subresources/deployments/methods/rollback/)
- [Pages Direct Upload](https://developers.cloudflare.com/api/resources/pages/subresources/projects/subresources/deployments/methods/create/)
