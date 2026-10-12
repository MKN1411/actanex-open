# ADR-032: B2B Stripe Netto-Katalog, Identity KYC & Rechnungsanker

* **Status:** Akzeptiert & Implementiert
* **Datum:** 2026-10-10
* **Kontext:** ActaNex Platform Hub (`hub.actanex.app`)

## Kontext & Problemstellung
ActaNex richtet sich an gewerbliche Kunden (B2B, Freelancer, IT-Berater). Die bisherigen Stripe-Preise waren teilweise brutto (inklusive Steuer) oder undefiniert. Zudem muss gewährleistet sein:
1. Eine Verifikation des Vertragspartners über Stripe Identity KYC vor Bereitstellung.
2. Zuordnung einer Subdomain zu einer Stripe-Rechnung.
3. Preistransparenz: Strikte Netto-Preise zzgl. 19% MwSt., Add-Ons zu 1:1 Cloudflare Originalpreisen ohne Aufschlag.

## Entscheidung
1. **Steuerberechnung:**  
   Alle Preise in Stripe werden mit `tax_behavior: "exclusive"` konfiguriert. Automatische Steuerberechnung bei Stripe wird deaktiviert.
2. **0,- € Subdomain-Rechnungsanker:**  
   Das Produkt `ActaNex Free SubDomain` (`prod_VPgNyutM4SwcFS` / `price_1UOr0wDrY81Stueygu7xS5EE`) wird jedem Checkout als Pflichtposition mitgegeben (`metadata: { app: 'ActaNex', type: 'subdomain_anchor' }`).
3. **Stripe Identity Integration:**  
   Der Verification-Flow `vf_1UOn2zDrY81StueyATqCNUBS` wird in einem separaten Tab / Popup geöffnet, um den Zustand des Onboarding-Formulars zu erhalten.
4. **Rechtliche Leistungszusagen:**  
   - Aussage: *„Gehostet in der EU (Cloudflare European Union Jurisdiction)“* (keine unzulässige Einschränkung auf nur „Frankfurt“).
   - Aussage: *„Langzeit-Belegarchivierung (nach § 147 AO Fristen) mit softwareseitigen Aufbewahrungsregeln“* (Verzicht auf den missverständlichen Begriff WORM für R2 Object Storage).

## Konsequenzen
* Rechtssichere B2B-Fakturierung mit getrenntem Ausweis der Umsatzsteuer.
* Revisionssicherer Nachweis der Identität des Inhabers im KV-Auditlog.
