# ADR-003: GoBD Revisionssicherheit via Append-Only Audit-Trail & Merkle-Root Monatssiegel

## Status
**Akzeptiert**

## Kontext
Die *Grundsätze zur ordnungsmäßigen Führung und Aufbewahrung von Büchern, Aufzeichnungen und Unterlagen in elektronischer Form (GoBD)* verlangen die Unveränderbarkeit, Nachvollziehbarkeit und lückenlose Protokollierung aller steuer- und abrechnungsrelevanten Geschäftsvorfälle.

## Entscheidung
Wir setzen ein zweistufiges GoBD-Sicherheitskonzept um:
1. **Append-Only Audit-Trail (`audit_events`):**
   * Jede Statusänderung, Zeiterfassung, Freigabe, Stornierung und Konfigurationsänderung erzeugt ein unveränderbares Protokoll-Event mit Zeitstempel, Akteur und JSON-Payload.
2. **Kryptografische Monatsabschlüsse (`monthly_archive_seals`):**
   * Nach Ablauf eines Abrechnungsmonats wird über alle aufgelaufenen Audit-Events und Leistungsnachweise des Monats ein mathematischer **SHA-256 Merkle-Root-Hash** berechnet.
   * Dieser Hash versiegelt den Monat unwiderruflich und sperrt alle zugehörigen Daten vor weiteren Änderungen.
   * Der Hash wird im Monatsnachweis und in der Verfahrensdokumentation ausgewiesen.

## Konsequenzen
* **Positiv:** Mathematischer Nachweis der Unverfälschtheit zur technischen Unterstützung steuerlicher Aufzeichnungspflichten und der individuellen GoBD-Verfahrensdokumentation.
* **Trade-off:** Nachträgliche Korrekturen abgeschlossener Perioden sind nur über explizite Storno-/Korrekturbuchungen in Folgemonaten möglich (ordnungsmäßiges Belegstornoprinzip).
