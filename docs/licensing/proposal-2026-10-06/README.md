# Lizenzvorschlag für ActaNex und Evidence

Deutscher Entwurf vom **6. Oktober 2026**.

Dieses Paket enthält eigenständig formulierte Lizenzvorschläge mit kurzen, nummerierten Abschnitten. Die Gliederung orientiert sich an der Lesbarkeit von PolyForm- und Elastic-Lizenzen. Es ist weder eine offizielle PolyForm- oder Elastic-Lizenz noch eine bestätigte juristische Prüfung.

**Der Entwurf ist nicht aktiviert. Die vorhandene MIT-Lizenz, das Programm und die Produktionsumgebung werden durch diese Dokumentationsdateien nicht geändert.**

## Dateien

| Datei | Zweck |
|---|---|
| [COMMUNITY_LICENSE_DRAFT_DE.md](COMMUNITY_LICENSE_DRAFT_DE.md) | Kostenlose Eigennutzung durch steuerlich freiberufliche natürliche Personen, Anpassungen, Herkunftsnennung und gemeinsame Nutzungsgrenzen |
| [PRO_LICENSE_DRAFT_DE.md](PRO_LICENSE_DRAFT_DE.md) | Kostenpflichtige eigene betriebliche Nutzung; enthält ein auszufüllendes Auftragsblatt |
| [INTEGRATION_LICENSE_DRAFT_DE.md](INTEGRATION_LICENSE_DRAFT_DE.md) | Gesonderter Rahmen für fremde Produkte, Vertrieb, Endkunden und Hosting; enthält ein auszufüllendes Auftragsblatt |
| [LIMIT_RULES_DRAFT_DE.md](LIMIT_RULES_DRAFT_DE.md) | Fachliche Berechnung, Sperrlogik, Ausnahmen und Prüffälle für eine spätere Implementierung |
| README.md | Entscheidungen, vorgeschlagene Konkretisierungen, Quellen und Einführungsschritte |

## Übernommene Anforderungen

- Freiberufliche natürliche Personen einschließlich entsprechend tätiger Einzelunternehmer dürfen eine eigene Community-Instanz betreiben.
- Nutzung basiert auf lokaler Selbstauskunft; es gibt keine externe Prüfung der Belegwerte oder Arbeitszeiten.
- Community-Nutzungsgrenzen sind **25.000 EUR Belegvolumen** und **1.040 tatsächlich erfasste Arbeitsstunden**.
- Die **erste erreichte Grenze sperrt neue Belege und neue Zeiten gemeinsam**.
- Bestehende Vorgänge bleiben korrigierbar und können abgeschlossen werden. Originale abgeschlossener Nachweise bleiben erhalten.
- Daten bleiben lesbar, sicherbar und exportierbar.
- Private Anpassungen sind erlaubt; Herkunft und eigene Änderungen müssen korrekt gekennzeichnet sein.
- Firmen dürfen die Community-Software nicht kostenlos in eigene angebotene Produkte übernehmen, auch wenn diese Produkte kostenlos angeboten werden.
- Eine Pro-Lizenz für Eigennutzung beinhaltet keine Integrations- oder Vertriebsrechte.
- Lizenzparameter sollen später durch digitale Signaturen abgesichert werden.

Die früher diskutierte Grenze des gesamten Jahresumsatzes von 20.000 beziehungsweise 50.000 EUR ist **nicht** Bestandteil dieses Pakets. Auch eine frühere 90-Tage-Übergangsfrist nach Grenzerreichung wurde durch die zuletzt gewünschte gemeinsame Sperre ersetzt.

## Vorgeschlagene Konkretisierungen

Folgende Punkte werden im Paket als konkrete Empfehlung verwendet, wurden jedoch noch nicht jeweils ausdrücklich bestätigt:

1. **Belegumfang:** Positive Nettobeträge von Einnahmen- und Ausgabenbelegen werden addiert. Es handelt sich um verarbeitetes Belegvolumen, nicht um Umsatz oder Gewinn.
2. **Zeitraum:** Kalenderjahr, Zuordnung nach Belegdatum beziehungsweise Arbeitstag. Bei Jahreswechsel beginnt der Zähler für das neue Jahr.
3. **Letzter Vorgang:** Ein einzelner vor Grenzerreichung zulässiger Vorgang wird noch vollständig gespeichert, auch wenn er die Grenze überschreitet. Ein Sammelimport zählt nicht als ein einzelner Vorgang.
4. **Korrekturen:** Echte Berichtigungen und verknüpfte Stornos können zur erneuten Unterschreitung führen. Weitere Geschäftsvorgänge in alte Datensätze einzubauen bleibt unzulässig.
5. **Instanzen:** Eine produktive Instanz; Sicherungs-, Test- und Migrationskopien erlaubt. Keine parallele Erfassung zum Umgehen von Grenzen.
6. **Weitergabe:** Unveränderte kostenlose Kopien und Patches erlaubt. Das Angebot einer eigenen vollständigen abgeleiteten Anwendung benötigt eine Integrationsvereinbarung.
7. **Freiberufler:** Bezug auf § 18 Absatz 1 Nummer 1 EStG. Gewerbliche Einzelunternehmer und eigenständige Gesellschaften sind im Community-Modell ausgeschlossen. Kein zusätzliches Verbot von Mitarbeitern.

Für ausländische Selbstständige wäre eine gesonderte Gleichwertigkeitsregel nötig, wenn diese Zielgruppe einbezogen werden soll.

## Zusammenspiel der Lizenzen

| Situation | Geeigneter Weg |
|---|---|
| Berechtigter Freiberufler, eigene Instanz innerhalb der Grenzen | Community |
| Derselbe Freiberufler nach Grenzerreichung | Pro für weitere Neuerfassung |
| GmbH oder gewerbliches Einzelunternehmen mit eigener interner Nutzung | Pro |
| Kunde bestätigt einen Nachweis des Freiberuflers | Erlaubter begrenzter Community-/Pro-Zugriff |
| Dienstleister installiert im Auftrag eines berechtigten Nutzers | Keine Produktintegration allein durch die Installationsleistung |
| Softwarebestandteile werden in einem fremden Angebot vertrieben | Integrationsvereinbarung |
| Fremde Betriebe nutzen einen vom Anbieter betriebenen Anwendungsdienst | Integrationsvereinbarung |

Die kostenpflichtigen Entwürfe brauchen jeweils ein ausgefülltes und bestätigtes Auftragsblatt. Preise, Laufzeiten, Funktionspakete und Endkundenrechte sind nicht erfunden oder bereits zugesagt.

## Technische Einordnung

Signierung schützt die Herkunft und Unverändertheit der Berechtigungen. Verschlüsselung allein verhindert keine unberechtigte Erhöhung eines Grenzwerts.

Die produktive Instanz erhält nur den öffentlichen Prüfschlüssel. Ein privater Signaturschlüssel gehört weder in den ausgelieferten Quellcode noch in die Datenbank des Nutzers. Selbst gespeicherte Statusfelder ersetzen keine Signaturprüfung.

Wer Quellcode und Instanz kontrolliert, kann grundsätzlich Prüfcode verändern oder falsche Daten erfassen. Dieses Modell vertraut auf die Selbstauskunft und verbindet die reguläre technische Prüfung mit klaren Nutzungsbedingungen. Es verspricht keine vollständige Manipulationssicherheit.

Ein dauerhaft erreichbarer Lizenzserver oder eine externe Geschäftsdatenerfassung ist nicht vorgesehen. Eine spätere Online-Aktivierung wäre eine neue Produktentscheidung.

## Bestehender MIT-Stand

Das geprüfte ActaNex-Repository enthält auf dem Ausgangsstand weiterhin MIT. Auch Evidence wurde zuvor mit MIT veröffentlicht.

Bereits wirksam eingeräumte MIT-Rechte werden durch einen neuen Text oder ein Lizenzmodul nicht rückwirkend aufgehoben. Eine alte MIT-Fassung bleibt für entsprechende Nutzung und Weiterentwicklung verfügbar. Neu veröffentlichte, rechtlich vom Lizenzgeber kontrollierte Ergänzungen können anderen Bedingungen zugeordnet werden.

Fremde Bibliotheken und sonstige Drittbestandteile behalten ihre eigenen Lizenzen. KI-Unterstützung ist keine Garantie, dass jeder Bestandteil urheberrechtlich geschützt ist oder keine fremden Bestandteile enthält.

## Einführungsschritte nach Prüfung des Entwurfs

1. Belegarten, Periodenbezug, Jahresneustart und Grenzübertritt fachlich festlegen.
2. Lizenztexte insbesondere zu AGB, Haftung, Pflichtrechten, Freiberuflerdefinition und kommerziellen Vertragsangaben juristisch prüfen lassen.
3. Bei zukünftigen fremden Beiträgen passende Beitragsbedingungen vereinbaren, wenn kommerzielle Lizenzierung durch den Lizenzgeber ermöglicht werden soll.
4. Eine konkrete neue Veröffentlichung den neuen Bedingungen zuordnen. Bestehende Lizenzdateien vor Änderung archivieren und ältere Rechte respektieren.
5. README, Paketmetadaten, Quellcodehinweise und Produktoberfläche konsistent aktualisieren. Eigene Lizenzkennungen verwenden; das Modell als Source Available bezeichnen.
6. Datenmodell und fachliche Berechnung abgleichen. Lizenzmodul auf einem separaten Entwicklungsbranch umsetzen.
7. Fachliche Prüffälle einschließlich APIs, Offline-Erfassung, Sammelimport, Korrekturversionen und parallelen Vorgängen ausführen.
8. Erst danach veröffentlichen. Die geschützte Produktionsumgebung ist kein Ziel dieser Arbeit.

## Quellen und Orientierung

Die Texte sind eigene Entwürfe auf Grundlage der besprochenen Anforderungen. Die folgenden Primärquellen wurden für Struktur und rechtliche Grenzen herangezogen:

- [PolyForm Small Business 1.0.0](https://polyformproject.org/licenses/small-business/1.0.0): klare Abschnitte und Beispiel eines begrenzten Nutzungszwecks.
- [Elastic License 2.0](https://www.elastic.co/licensing/elastic-license): Herkunft, Änderungen und Schutz von Lizenzfunktionen.
- [§ 18 EStG](https://www.gesetze-im-internet.de/estg/__18.html): freiberufliche Tätigkeit.
- [§ 307 BGB](https://www.gesetze-im-internet.de/bgb/__307.html): Klarheit und Inhaltskontrolle von AGB.
- [§ 69g UrhG](https://www.gesetze-im-internet.de/urhg/__69g.html): Grenzen vertraglicher Einschränkungen gesetzlicher Software-Nutzerrechte.
- [§ 69a UrhG](https://www.gesetze-im-internet.de/urhg/__69a.html): Schutzgegenstand und persönliche geistige Schöpfung.
- [Open Source Definition](https://opensource.org/osd): Abgrenzung zu Source Available.
- [GitHub: The Legal Side of Open Source](https://opensource.guide/legal/): Lizenzwechsel, Rechteinhaber und fremde Bestandteile.

Stand der Quellenprüfung: 6. Oktober 2026.

## Prüfung dieses Pakets

Die Dateien wurden als zusammengehöriger Entwurf auf Namen, Grenzwerte, gemeinsame Sperre, Datenzugriff, Herkunftshinweise und Trennung von Eigen- und Produktnutzung geprüft. Die fachlichen Prüffälle sind Spezifikationen für die spätere Softwareentwicklung; sie wurden nicht als automatisierte Tests ausgeführt.

Die Ablage auf einem separaten Dokumentationsbranch enthält ausschließlich neue Dateien. Sie ersetzt keine aktive LICENSE, ändert kein Programm und veröffentlicht kein Lizenzmodul.
