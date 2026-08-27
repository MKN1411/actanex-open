# ADR-004: Bidirektionale Lexware Office XL REST-Integration & Webhooks

## Status
**Akzeptiert**

## Kontext
Lexware Office dient als führendes System für Buchhaltung, Kundenstammdaten und finale Ausgangsrechnungen. Wenn in Lexware Rechnungen storniert, Kunden geändert oder Zahlungen verbucht werden, muss der Evidence Hub diese Zustände unverzüglich und fehlerfrei reflektieren, um Doppelabrechnungen oder Dateninkonsistenzen zu verhindern.

## Entscheidung
Wir implementieren eine robuste 2-Wege-Synchronisation:
1. **Idempotente Rechnungserstellung:**
   * Beim Freigeben eines Leistungsnachweises wird ein Rechnungsentwurf (`POST /v1/invoices`) mit `idempotency_key` an Lexware übermittelt, um bei Netzwerkfehlern doppelte Rechnungen auszuschließen.
2. **Push-Webhooks (`/api/v1/webhooks/lexware`):**
   * Lexware sendet Webhook-Events bei `invoice.status-changed`, `invoice.deleted` und `contact.changed`.
   * Stornierungen (`voucherStatus: 'voided'`) setzen den Status des zugehörigen Stundenzettels automatisch auf `InvoiceCanceled`, geben die Zeiteinträge wieder zur Bearbeitung frei und loggen das Ereignis im GoBD-Audit-Trail.
3. **Manueller Polling-Abgleich (Fallback):**
   * Der Endpunkt `/api/v1/sync/full-lexware-status` erlaubt jederzeit einen manuellen Vollabgleich aller offenen und stornierten Belege.

## Konsequenzen
* **Positiv:** Vollständige Konsistenz zwischen Zeiterfassung und Buchhaltung; automatische Entsperrung von Zeiteinträgen bei Stornierungen in Lexware.
* **Trade-off:** Push-Webhooks erfordern bei Lexware ein SSL-Zertifikat mit Grade A (über Cloudflare Custom Domain oder Cloudflare Worker URL).
