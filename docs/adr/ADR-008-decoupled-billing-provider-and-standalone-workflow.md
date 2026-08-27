# ADR-008: Entkoppelter Stand-Alone-Modus & Billing-Provider-Abstraktion

## Status
Akzeptiert (Freigegeben für Release v2.6.0)

## Kontext
Bisher war der *Freelancer Evidence & Billing Hub* fest an die REST-API von **Lexware Office XL** gekoppelt.  
Nach einer digitalen Kundenfreigabe (`Approved`) wurde automatisiert ein Rechnungsentwurf in Lexware angelegt.  

Viele Freiberufler, Berater und Software-Entwickler nutzen jedoch:
1. Andere Buchhaltungssysteme (z. B. SevDesk, FastBill, WISO MeinBüro, DATEV Unternehmen Online).
2. Kleinere Lexware-Tarife (z. B. Lexware Office S / M oder Lexware Buchhalter Desktop) ohne REST-API-Zugang.
3. Reine Steuerberater-Zusammenarbeit über monatliche Beleg- und Buchungsstapel (DATEV EXTF).

## Entscheidung
Wir entkoppeln die Kernlogik des Hubs vollständig von externen API-Zwängen:

1. **Konfigurations-Parameter `billing_provider` in `app_settings`:**
   * `"lexware"`: *(Default)* Live-Synchronisation mit Lexware Office REST-API aktiv.
   * `"none"` / `"standalone"`: Stand-Alone-Betrieb ohne API-Calls.
2. **Fachlicher Workflow im Stand-Alone-Modus:**
   * Nach Kundenfreigabe (`status = 'Approved'`) erscheint in der Detailansicht die Aktion **`[Als extern abgerechnet markieren]`**.
   * Der Anwender kann eine externe Rechnungsnummer (z. B. `RE-2026-089`) und das Rechnungsdatum eingeben.
   * Der Status wechselt auf `status = 'Invoiced'`, und der Vorgang wird unveränderbar mit SHA-256 Hash im `gobd_audit_log` versiegelt.
3. **100 % Abwärtskompatibilität:**
   * Für bestehende Setups mit Lexware API ändert sich nichts; der Standard bleibt `"lexware"`.

## Konsequenzen
* **Positiv:** Die Plattform kann von jedem Freiberufler autark genutzt werden – ohne laufende Kosten für Buchhaltungs-APIs.
* **Positiv:** Technische Nachvollziehbarkeit und Statusfestschreibung der Leistungsnachweise bleiben auch bei externer Rechnungsstellung konsistent unterstützt.
* **Neutral:** Im Stand-Alone-Modus obliegt die manuelle Vergabe der Rechnungsnummer dem Anwender.
