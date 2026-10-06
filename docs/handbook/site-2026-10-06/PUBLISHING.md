# Veröffentlichung und Windows-Ausführung

Stand: 6. Oktober 2026, 13:55 Uhr Europe/Berlin.

## Ergebnis

Das neue ActaNex-Open-Handbuch wurde über Sites öffentlich veröffentlicht:

https://actanex-open-handbuch.michael-kirst.chatgpt.site

- Sites-Projekt: `appgprj_6ac4b2fe2f6c8191a96fdc73d9c5411e`
- Veröffentlichte Version: 1
- Deployment: `appgdep_6ac4e19c3a248191bbb1470240f72e82`
- Sites-Quellcommit: `f41f2002fbcc402bd877b72c0986fc46afc039d8`
- Ergebnis der nativen Sites-Veröffentlichung: `succeeded`
- Zugriff mit `get_site` anschließend als `public` bestätigt.
- Das frühere Evidence-Handbuch wurde nicht verändert.

## Ursachen und behobene Ausführungsprobleme

1. Die Windows-Sandbox konnte ursprünglich keine Prozesse starten. Nach ihrer lokalen Reparatur liefen PowerShell, Node.js und Git wieder.
2. Direkter HTTPS-Zugriff ohne Proxy scheiterte innerhalb der Agent-Sandbox. Der Vergleich in der normalen Windows-PowerShell erreichte den Server. Für die verwaltete Agent-Ausführung wurde nach Zustimmung des Nutzers der vorgesehene lokale HTTP-Proxy verwendet.
3. Windows-curl erreichte über den Proxy den CONNECT-Endpunkt, scheiterte anschließend am Schannel-Fehler SEC_E_NO_CREDENTIALS. Git wurde für den Vorgang mit OpenSSL als TLS-Backend ausgeführt. Die Zertifikatsprüfung wurde nicht deaktiviert.
4. Der Sites-Packager fand zunächst Windows-/WSL-bash. Git-for-Windows-bash wurde über den Prozess-PATH priorisiert.
5. GNU tar interpretierte den Doppelpunkt im Windows-Archivpfad als Remote-Angabe. TAR_OPTIONS=--force-local behebt dies.
6. Der ursprüngliche Dokumente-Ordner war als Arbeitsverzeichnis für den Sandbox-Benutzer nicht zugänglich. Die unveränderten Site-Dateien wurden nach C:\workspace\actanex-open-handbuch kopiert und dort verarbeitet.

## Konfiguration für weitere Agent-Veröffentlichungen

Diese Einstellungen gelten für den Veröffentlichungsprozess, nicht als globale Windows-Konfiguration. Die von der Agent-Laufzeit bereitgestellten Proxyvariablen verwenden; sie nicht wieder leeren. In der geprüften Sitzung war der HTTP-Proxy 127.0.0.1:3128 erreichbar. Ports können in späteren Sitzungen abweichen.

```powershell
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath 'C:\workspace\actanex-open-handbuch'
$env:PATH = 'C:\Program Files\Git\bin;C:\Program Files\Git\usr\bin;' + $env:PATH
$env:GIT_CONFIG_COUNT = '1'
$env:GIT_CONFIG_KEY_0 = 'http.sslBackend'
$env:GIT_CONFIG_VALUE_0 = 'openssl'
$env:TAR_OPTIONS = '--force-local'
& node 'C:\Users\Micha\.codex\plugins\cache\openai-curated-remote\sites\0.1.75\scripts\site-workflow.mjs' --project-id appgprj_6ac4b2fe2f6c8191a96fdc73d9c5411e
```

Der genannte Pluginpfad wurde in dieser Sitzung geprüft; bei einer Plugin-Aktualisierung den aktuellen installierten Pfad verwenden. Vorhandene GIT_CONFIG-Umgebungseinträge in anderen Sitzungen berücksichtigen; der Code beschreibt den geprüften Prozess mit einem Eintrag.

Der Sites-Agent beschafft ein frisches, kurzlebiges Source-Repository-Credential über das native Sites-Tool. Erst nach der Meldung „Ready for Site workflow JSON on stdin“ übermittelt er das Credential zusammen mit commands und archivePath über das verdeckte stdin. Zugangsdaten weder in Shellargumente noch in Dateien oder Dokumentation schreiben.

Danach mit dem zurückgegebenen Commit und Archiv eine Version speichern, diese öffentlich deployen und den terminalen Status prüfen. Das registrierte Projekt wiederverwenden. Ein Status succeeded mit tatsächlicher URL ist der Veröffentlichungserfolg.

## Inhaltliche Prüfung

Die zuvor dokumentierten Inhalts- und Navigationsprüfungen wurden wiederverwendet, da der HTML-Inhalt für diese Veröffentlichung unverändert blieb. Ein vollständiger angemeldeter Demo-Test und eine neue visuelle Browserprüfung wurden nicht durchgeführt. Die Veröffentlichung enthält keine rechtlichen Garantien.
