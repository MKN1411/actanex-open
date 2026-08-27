# ADR-001: Cloudflare D1 (SQLite3) als relationale Datenbank

## Status
**Akzeptiert**

## Kontext
Für die Abrechnung, Stundensätze, Zeiterfassungen und GoBD-Audit-Protokolle wird ein transaktionales, relationales Datenbanksystem benötigt. Proprietäre NoSQL-Datenbanken (wie DynamoDB oder MongoDB) erschweren relationale JOINs zwischen Kunden, Projekten, Zeiteinträgen und Rechnungen und erzeugen starken Vendor Lock-in. Gleichzeitig verursachen gemanagte Cloud-SQL-Instanzen (z. B. Azure SQL oder AWS RDS) kontinuierliche monatliche Grundkosten von 30–80 € selbst bei minimaler Nutzung.

## Entscheidung
Wir setzen auf **Cloudflare D1**, das auf standardisiertem **SQLite 3** basiert:
1. **0,00 € Kosten:** Bis zu 5 Millionen Lese- und 100.000 Schreibzugriffe pro Tag im Free-Tier kostenlos.
2. **Volle relationale Integrität:** Fremdschlüssel (`FOREIGN KEY`), kaskadierende Integrität, relationale Indizes und ACID-Transaktionen.
3. **Kein Lock-in:** Die Datenbank kann jederzeit mit einem einzigen Befehl (`wrangler d1 export`) als normale SQLite `.sql`-Datei exportiert und auf jedem beliebigen Linux-Server, Mac oder Windows-PC betrieben werden.

## Konsequenzen
* **Positiv:** Dauerhaft 0 € Betriebskosten, extrem geringe Latenz an der Cloudflare Edge, einfache lokale Entwicklung und Tests.
* **Trade-off:** D1 unterstützt derzeit noch keine benutzerdefinierten C-Erweiterungen für SQLite (für unsere Zwecke nicht erforderlich).
