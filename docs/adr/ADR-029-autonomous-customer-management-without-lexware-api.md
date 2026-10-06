# ADR-029: Autonome Kundenverwaltung & Entkopplung von Lexware Office XL

## Status
**Akzeptiert & Produktiv umgesetzt** (6. Oktober 2026)

## Kontext & Problemstellung
Bislang setzte ActaNex Open für das Einpflegen von Kunden- und Auftraggeberkontakten eine bestehende Anbindung an die Lexware Office API (XXL-Plan) voraus. Beim Initialisieren oder Synchronisieren rief das System Kontakte aus Lexware ab und persistierte sie in der Tabelle `customers`.

Dies stellte für Anwender ohne Lexware-Konto oder ohne den kostenpflichtigen XXL-Tarif (der API-Schlüssel erfordert) ein Hindernis dar:
1. Ohne API-Schlüssel konnten keine Kunden angelegt werden, wodurch auch keine Projekte, Leistungsnachweise oder Zeiterfassungen möglich waren.
2. Beim automatischen Hintergrundabgleich von Lexware (`syncLexwareContactsInternal`) wurden lokale Kontakte, die nicht in der Lexware-Antwortliste enthalten waren, automatisch archiviert oder als gelöscht markiert.
3. In der Benutzeroberfläche existierte kein Dialog zum manuellen Erstellen oder Bearbeiten von Kundenstammdaten.

## Architekturentscheidung

### 1. Autonome Kunden-CRUD-Endpunkte in der REST-API
* Erweiterung von [`src/Worker/src/routes/projects_customers.routes.ts`](file:///c:/Users/Micha/OneDrive/Dokumente/AI-Projects/ActaNex-Open/src/Worker/src/routes/projects_customers.routes.ts):
  * `POST /api/v1/customers`: Erstellt einen Kunden direkt in SQLite/D1. Vergibt eine UUID mit Präfix `cust_manual_<hash>`.
  * `PUT /api/v1/customers/:id`: Erlaubt die vollständige Aktualisierung von Name, Kundennummer, Kontaktperson, E-Mail, Anschrift, USt-IdNr. und optionaler Lexware-Kontakt-ID.
  * `DELETE /api/v1/customers/:id`: Führt eine intelligente Löschprüfung durch. Haben Kunden bereits verknüpfte Projekte, Zeiterfassungen oder Rechnungen, wird der Kunde revisionssicher archiviert (`is_archived = 1`). Liegen keine Verknüpfungen vor, wird der Datensatz vollständig aus D1 gelöscht.
  * `POST /api/v1/customers/:id/archive`: Ermöglicht das gezielte Archivieren und Reaktivieren von Kunden.

### 2. Schema-Integrität & Lexware-Präfix-Konvention
* Das D1-Datenbankschema erfordert `lexware_contact_id TEXT NOT NULL UNIQUE`.
* Für manuell angelegte Kunden generiert das Backend automatisch eine synthetische Pseudo-ID nach dem Muster:
  `MANUAL_<id_suffix>` (z. B. `MANUAL_0a4444e2`).
* Dies garantiert volle Datenbankintegrität ohne Schema-Bruch oder Nullable-Umbau.

### 3. Schutz manueller Kunden im Lexware-Hintergrundabgleich
* In [`src/Worker/src/services/lexware.service.ts`](file:///c:/Users/Micha/OneDrive/Dokumente/AI-Projects/ActaNex-Open/src/Worker/src/services/lexware.service.ts) (`syncLexwareContactsInternal`) wurde eine Schutzweiche implementiert:
  ```typescript
  if (!localCust.lexware_contact_id || 
      localCust.lexware_contact_id.startsWith("MANUAL_") || 
      localCust.id.startsWith("cust_manual_")) {
    continue; // Manuell erstellte Kunden niemals überschreiben oder archivieren
  }
  ```
* Dadurch bleiben manuell angelegte Kunden bei jedem Lexware-Sync dauerhaft geschützt und aktiv.

### 4. Optionale Aufwärts-Synchronisation (`sync-to-lexware`)
* Endbenutzer, die erst später einen Lexware-API-Schlüssel konfigurieren oder ausgewählte manuelle Kontakte nach Lexware übertragen möchten, können den Endpoint `POST /api/v1/customers/:id/sync-to-lexware` nutzen.
* Das Backend erstellt den Kontakt via Lexware Contacts API (`POST /v1/contacts`) und aktualisiert die lokale `lexware_contact_id` auf die echte Lexware-ID.

### 5. Frontend-Integration & Benutzerführung
* **Kunden-Cockpit Header:** Prominenter Button `+ Neuer Kunde`.
* **Empty-State:** Wenn noch keine Kunden existieren, leitet ein zentraler Aktionsbutton direkt zur Schnellanlage.
* **Modal `#customer-form-modal`:** Vollständiges Formular für Firmenname, Kundennummer, Ansprechpartner, E-Mail, Straße, PLZ, Ort, Land und USt-IdNr.
* **Kunden-Detailcockpit:** Aktionsleiste mit `Kunde bearbeiten`, `Löschen / Archivieren` und `Zu Lexware übertragen` (nur bei manuellen Kunden).
* **Badge-Kennzeichnung:** Manuell erstellte Kunden werden mit einem blauen `Manuell`-Badge transparent ausgewiesen.

## Konsequenzen & GoBD-Bewertung
* **Vollständige Autonomie:** ActaNex Open ist ab sofort zu 100 % unabhängig von externen Drittanbieter-APIs betreibbar.
* **Auditierbarkeit:** Jede manuelle Erstellung, Mutation und Löschung wird mit Zeitstempel und Benutzerbezug im GoBD-Audit-Log protokolliert.
