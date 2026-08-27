# ADR-020: ActaChron – Mobile Zeiterfassung mit projektbezogenen Rundungsregeln

## Status
Akzeptiert (Version 3.0)

## Kontext
Freelancer arbeiten oft für unterschiedliche Kooperationspartner und Mandanten, mit denen abweichende Abrechnungsintervalle vereinbart sind (z. B. Minutengenau, angefangene 15 Minuten, 30 Minuten oder volle Stunden). Unterwegs wird eine extrem schlanke, offline-fähige Erfassung benötigt, die unabhängig von der Desktop-Anwendung sofort einsatzbereit ist.

## Entscheidung
1. **PWA-Modul ActaChron (`/pwa/time-tracker.html`):** Autarke, minimalistische Web-App (<25 KB) mit 1-Klick Live-Stempeluhr, manuellem Schnelleintrag und Wochenübersicht.
2. **Projektbezogene Rundungslogik:** Hinterlegung der Rundungsregel (`exact`, `round_up_15`, `round_up_30`, `round_up_60`) direkt am Projekt in der Datenbank (`projects.billing_rounding_rule`).
3. **GoBD-Transparenz:** Bei jeder Stempelung werden sowohl die ungerundete Rohzeit als auch die berechnete Abrechnungsdauer transparent gespeichert und ausgewiesen.
4. **Offline-Sync:** Automatische PWA-Offline-Warteschlange im LocalStorage/IndexedDB mit automatischem Hintergrund-Sync bei Wiederverbindung.

## Konsequenzen
- **Vorteile:** Hohe Benutzerfreundlichkeit unterwegs, Vermeidung von Abrechnungsfehlern bei Kooperationspartnern, vollständige Revisionssicherheit.

> [!IMPORTANT]
> **Haftungs- & Steuerrechts-Disclaimer:**
> Die Rundungsfunktionen und Zeitberechnungen stellen rein rechnerische Hilfsmittel dar. Es wird keine Gewähr für die steuerliche oder vertragliche Richtigkeit gegenüber Dritten übernommen.
