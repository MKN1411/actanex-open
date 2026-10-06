# Berechnungs- und Sperrregeln für den Lizenzentwurf

Entwurf vom 6. Oktober 2026. Dieses Dokument beschreibt vorgeschlagenes Verhalten; es implementiert keine Lizenzprüfung.

## 1. Verbindlich übernommene Entscheidungen

- Prüfung ausschließlich anhand des Datenbestands der eigenen Instanz.
- Lokale Selbstauskunft zur Nutzungsberechtigung; keine externe Beleg- oder Umsatzprüfung.
- 25.000 EUR Beleggrenze und 1.040 Stunden Arbeitszeitgrenze.
- Die erste erreichte Grenze sperrt beide Arten der Neuerfassung.
- Bestehende Vorgänge dürfen korrigiert und abgeschlossen werden.
- Pro-Berechtigung kann die gemeinsame Sperre aufheben.
- Lizenzparameter sind signiert; ein frei editierbarer Datenbankwert begründet keine zusätzlichen Rechte.

## 2. Konkretisierungen dieses Entwurfs

Die folgenden Einzelheiten sind Empfehlungen und keine bereits ausdrücklich bestätigten Nutzerentscheidungen:

1. Belegvolumen umfasst Einnahmen- und Ausgabenbelege, deren positive Nettobeträge addiert werden.
2. Die Werte gelten pro Kalenderjahr; mit dem neuen Kalenderjahr beginnt die Berechnung des neuen Jahres.
3. Belegdatum beziehungsweise Arbeitstag bestimmen die Periodenzuordnung.
4. Die letzte einzelne Erfassung darf die Grenze überschreiten; danach sind weitere neue Erfassungen gesperrt.
5. Rechtmäßige Korrekturen können die Sperre wieder aufheben.
6. Sicherungs-, Test- und Migrationskopien sind erlaubt; parallele Erfassung zum Umgehen einer Grenze ist ausgeschlossen.

Für einen tatsächlich installierbaren Lizenzwechsel müssen insbesondere die Belegarten und ihre Zuordnung im aktuellen Datenmodell feststehen.

## 3. Messgrößen

### Belegvolumen

Recheneinheit ist EUR-Cent. Grenze: **2.500.000 Cent**.

Ein wirtschaftlich eigenständiger Belegvorgang wird einmal gezählt. Die Summe berücksichtigt positive Nettobeträge sowohl von Einnahmen- als auch von Ausgabenbelegen. Eine Ausgabe mindert den Zähler nicht wie eine Betriebsausgabe bei der Gewinnermittlung.

Gültige Entwürfe mit erfasstem wirtschaftlichem Vorgang und Betrag dürfen nicht allein durch ihren Entwurfsstatus aus der Berechnung verschwinden. Rein technische Platzhalter, Dokumentanhänge und Darstellungen desselben Vorgangs werden nicht mehrfach gezählt. Die tatsächlichen Statuswerte und Belegklassen sind bei der Implementierung ausdrücklich zuzuordnen.

Bei einem echten, eindeutig verknüpften Storno oder einer Gutschrift wird der zugehörige Vorgang auf den tatsächlich verbleibenden Betrag korrigiert. Eine negative Position ohne Zusammenhang ist keine pauschale Erlaubnis zum Absenken des Zählers. Beträge ohne gesonderte Umsatzsteuer zählen vollständig.

Erzeugte Rechnungen zur Abrechnung bereits erfasster Leistungen sind erlaubte Abschlussarbeiten. Ihre relevanten Belegbeträge werden korrekt berücksichtigt; soweit bereits ein Beleg desselben wirtschaftlichen Vorgangs gezählt wurde, entsteht keine Doppelzählung.

Fremdwährungsbelege benötigen einen gespeicherten EUR-Gegenwert mit nachvollziehbarer Umrechnungsquelle und Datum. Eine externe Abfrage wird durch das Lizenzmodul nicht vorausgesetzt. Ein fehlender Betrag oder fehlender EUR-Gegenwert darf nicht als endgültiger Nullwert zur Umgehung der Grenze behandelt werden.

### Arbeitszeit

Recheneinheit ist Minute. Grenze: **62.400 Minuten**.

Gezählt wird die tatsächliche erfasste Arbeitszeit, einschließlich nicht abrechenbarer Arbeitszeit. Abrechnungsrundungen und Geldwerte sind keine Zeitquelle. Pausen zählen nicht. Die Darstellung derselben Arbeitsleistung in einem Stundennachweis zählt nicht erneut.

Vier Erfassungen mit je 15 Minuten verbrauchen insgesamt 60 Minuten.

### Zeitraum

Kalenderjahr nach sachlichem Belegdatum beziehungsweise Arbeitstag. Bei zeitgestempelten Vorgängen ist eine einheitliche, dokumentierte Zeitzone der Instanz zu verwenden. Zeiträume dürfen nicht durch UTC- und Lokalzeit-Mischung auseinanderfallen.

Historische Vorgänge bleiben ihrem tatsächlichen Zeitraum zugeordnet. Ein laufender gesperrter Zeitraum darf nicht durch Rückdatieren neuer Vorgänge umgangen werden.

## 4. Gemeinsame Sperre

Für Community-Neuerfassungen gilt:

`gesperrt = belegvolumen_cent >= 2500000 ODER arbeitszeit_minuten >= 62400`

Die Pro-Freischaltung ergibt sich aus einer gültigen, für die Instanz passenden Berechtigung. Ein Feld wie `is_pro = true` genügt nicht.

Die abschließende Prüfung und das Speichern müssen gegen konkurrierende Schreibvorgänge abgesichert sein. Eine Prüfung nur im Browser oder eine längere Trennung von Zählerprüfung und Speicherung genügt nicht.

Für einen noch erlaubten einzelnen Vorgang wird das Speichern abgeschlossen und anschließend neu gezählt. Ein Sammelimport wird pro wirtschaftlichem Vorgang bearbeitet; er darf nicht als ein einziger letzter Vorgang unbegrenzt die Grenze überschreiten.

## 5. Erlaubte Bearbeitung bei Sperre

- Lesen, Sichern und Exportieren.
- Wahrheitsgemäße Änderungen bestehender Vorgänge.
- Nachvollziehbare Berichtigungen und Stornos mit Erhalt abgeschlossener Originale.
- Rechnungsstellung und Freigabe bereits erfasster Leistungen.
- Erforderliche Zahlungs- und Korrekturzuordnungen zu bestehenden Vorgängen.
- Lizenzwechsel und notwendige Verwaltungsaktionen.

Eine Korrektur kann technisch zusätzliche Zeilen, Dateien oder Versionen erzeugen. Deshalb darf die Umsetzung nicht pauschal sämtliche INSERT-Operationen blockieren.

Weitere Arbeitstage oder neue Belegvorgänge in einen alten Eintrag einzubauen bleibt Neuerfassung. Pauschale Grenzen für die Zahl der Datensätze sind nicht Teil des Entwurfs.

## 6. Prüfbeispiele für eine spätere Implementierung

| Fall | Erwartetes Ergebnis |
|---|---|
| 24.999 EUR und 1.039 Stunden | Neue Erfassung erlaubt |
| Genau 25.000 EUR und 500 Stunden | Neue Belege und neue Zeiten gesperrt |
| 10.000 EUR und genau 1.040 Stunden | Neue Belege und neue Zeiten gesperrt |
| 24.900 EUR plus ein echter Beleg über 200 EUR | Einzelnen Vorgang speichern; danach beide Bereiche sperren |
| Einnahmebeleg 10.000 EUR und Ausgabe 5.000 EUR | Belegvolumen 15.000 EUR |
| Zweiter Anhang zu demselben Beleg | Keine Erhöhung |
| Echte verknüpfte Erstattung von 1.000 EUR zu einem gezählten Vorgang | Verbleibenden Betrag korrigieren; Sperre neu berechnen |
| Beschreibung eines bestehenden Eintrags ändern | Auch bei Sperre erlaubt |
| Weiteren Arbeitstag durch Änderung eines alten Eintrags erfassen | Als Neuerfassung behandeln; bei Sperre ablehnen |
| Korrektur eines abgeschlossenen Nachweises | Original erhalten, verknüpfte Korrektur zulassen |
| Gültige Pro-Lizenz | Im vereinbarten Umfang entsperren |
| Signatur manipuliert, erhöhtes Limit in der DB | Keine zusätzlichen Rechte erteilen |
| Parallele Schreibvorgänge oder Sammelimport | Gemeinsame Grenze konsistent prüfen |
| Server prüft gesperrten Offline-Import | Nicht gespeicherte lokale Daten erhalten und klare Meldung ausgeben |
| Jahreswechsel mit neuem Jahreszähler unter beiden Grenzen | Neuerfassung wieder erlaubt |
| Wiederherstellung oder Migration | Ursprüngliche Vorgänge und Zähler rekonstruieren; keine künstliche Freigabe |

Dies sind fachliche Prüffälle, keine bereits ausgeführten Softwaretests.
