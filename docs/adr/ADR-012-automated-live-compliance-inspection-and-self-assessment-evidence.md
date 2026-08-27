# ADR-012: Automatisierte Live-Compliance-Inspektion & Technisches Eigenerklärungs-Framework

## Status
**Akzeptiert & Implementiert (v2.7.0)** – 22. August 2026

## Kontext & Problemstellung
Bei Cloud-basierten und serverlosen Abrechnungssystemen (Cloudflare Edge, D1, R2) weichen die Infrastruktur-Parameter grundlegend von klassischen IaaS-Umgebungen ab:
1. **Dynamische Instanz-Parameter:** Anstelle fester IP-Adressen und physischer Standorte existieren zustandslose Edge-Runtimes, dynamisch generierte D1-Datenbank-UUIDs und Anycast-Routings (~300 PoPs).
2. **Nachweispflicht gegenüber Prüfern (GoBD & DSGVO):** Für Betriebsprüfer, Steuerberater und Datenschutzbeauftragte reicht eine statische Muster-Dokumentation oft nicht aus; gefordert ist ein technischer Nachweis über die *tatsächlich bereitgestellte und aktive Instanz*.
3. **Rechtliche Abgrenzung (BMF GoBD Rn. 179–181):** Nach den Grundsätzen der Finanzverwaltung kann weder eine Software noch ein Softwareentwickler ein rechtlich bindendes „GoBD-Zertifikat“ oder eine Gewährleistung auf steuerliche Ordnungsmäßigkeit erteilen. Die Ordnungsmäßigkeit verbleibt stets in der Verantwortung des Steuerpflichtigen.

## Getroffene Entscheidung
Wir etablieren ein **automatisiertes Live-Inspektions- und technisches Eigenerklärungs-Framework**:

1. **Automatisierter Inspektions-Workflow (`verify-compliance-and-generate-evidence.yml`):**
   * Wird automatisch nach dem 1-Klick-Bootstrap oder manuell per `workflow_dispatch` gestartet.
   * Fragt die echten Live-Metadaten der Cloudflare-Infrastruktur ab:
     * Cloudflare Account-ID & Identität
     * Konkrete D1-Datenbank UUID (`database_id`) & Schema-Integrität (18 Tabellen)
     * R2 Objektspeicher-Status (`evidence-hub-storage`, AES-256)
     * Live REST-API Health (`/api/v1/health`) und Diagnose (`/api/v1/system/diagnostics`)
     * Zero-Cookie- und TLS 1.3-Prüfung

2. **Standardisiertes Eigenerklärungs-Dokument:**
   * Generiert dynamisch den Bericht `COMPLIANCE_EVIDENCE_REPORT_<DATUM>.md` und stellt ihn als Download-Artefakt in GitHub Actions bereit.
   * Dient dem Steuerpflichtigen als begleitender technischer Anhang für die eigene GoBD-Verfahrensdokumentation.

3. **Strikte juristische Abgrenzung & Haftungsausschluss:**
   * Alle generierten Berichte und Vorlagen werden explizit als **„Technisches Systemprüfprotokoll (Eigenerklärung)“** deklariert.
   * Jeder Prüfbericht enthält einen standardisierten rechtlichen BMF-Hinweis, der klarstellt, dass keine Rechts- oder Steuerberatung und keine Zertifizierung nach IDW PS 880 / BMF vorliegt, sondern eine technische Dokumentationshilfe.

## Konsequenzen & Vorteile
* **Nachvollziehbarkeit & Prüfungsunterstützung:** Maschinengenerierte, transparente Dokumentation der tatsächlichen Live-Infrastruktur-Parameter als strukturierte Anlage zur individuellen Verfahrensdokumentation.
* **Rechtliche Klarheit & BMF-Konformität:** Eindeutige Deklaration als technische Dokumentationshilfe und Vermeidung von Scheinsicherheiten oder unzulässigen Zertifizierungsversprechen gemäß BMF-GoBD-Grundsätzen (Rn. 179–181).
* **Wiederholbarkeit:** Bei Versions-Upgrades oder Umkonfigurationen kann jederzeit per Knopfdruck ein aktualisiertes Prüfprotokoll erzeugt werden.
