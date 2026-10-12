/**
 * LEGAL PAGES TEMPLATES (Impressum, Datenschutz, Nutzungsbedingungen)
 * Domain: actanex.app
 * Rechtliche Angaben: Michael Kirst-Neshva, Ruthenberger Markt 11b, 24539 Neumünster
 * (c) 2026 ActaNex Open Contributors
 */

function baseLegalLayout(title: string, contentHtml: string): string {
  return `<!DOCTYPE html>
<html lang="de" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | ActaNex</title>
  <meta name="robots" content="noindex, follow">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>💼</text></svg>">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <style>
    :root {
      --bg-main: #090d16;
      --bg-surface: #0f172a;
      --bg-card: rgba(17, 24, 39, 0.75);
      --border-subtle: rgba(255, 255, 255, 0.08);
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
      --cyan: #38bdf8;
      --indigo: #6366f1;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: radial-gradient(circle at top center, #1e1b4b 0%, var(--bg-main) 60%);
      color: var(--text-main);
      font-family: 'Plus Jakarta Sans', sans-serif;
      line-height: 1.7;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header {
      padding: 18px 24px;
      border-bottom: 1px solid var(--border-subtle);
      background: rgba(15, 23, 42, 0.8);
      backdrop-filter: blur(12px);
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1100px;
      width: 100%;
      margin: 0 auto;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: #fff;
      font-weight: 800;
      font-size: 1.25rem;
    }
    .brand span { color: var(--cyan); }
    .nav-links a {
      color: var(--text-muted);
      text-decoration: none;
      font-size: 0.9rem;
      margin-left: 18px;
      transition: color 0.2s;
    }
    .nav-links a:hover { color: #fff; }
    main {
      flex: 1;
      max-width: 900px;
      width: 100%;
      margin: 40px auto;
      padding: 0 24px;
    }
    .legal-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 20px;
      padding: 44px;
      backdrop-filter: blur(16px);
      box-shadow: 0 20px 40px -15px rgba(0,0,0,0.5);
    }
    h1 {
      font-size: 2.2rem;
      font-weight: 800;
      margin-bottom: 24px;
      background: linear-gradient(135deg, #fff 30%, var(--cyan) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    h2 {
      font-size: 1.35rem;
      font-weight: 700;
      color: #fff;
      margin-top: 32px;
      margin-bottom: 12px;
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 8px;
    }
    p, ul {
      color: var(--text-muted);
      margin-bottom: 16px;
      font-size: 0.95rem;
    }
    ul { padding-left: 24px; }
    li { margin-bottom: 8px; }
    .disclaimer-box {
      background: rgba(234, 88, 12, 0.1);
      border: 1px solid rgba(234, 88, 12, 0.3);
      border-radius: 12px;
      padding: 16px 20px;
      margin: 24px 0;
      color: #fdba74;
      font-size: 0.9rem;
    }
    .disclaimer-box strong { color: #ffedd5; display: block; margin-bottom: 6px; }
    footer {
      border-top: 1px solid var(--border-subtle);
      padding: 28px 24px;
      text-align: center;
      color: var(--text-dim);
      font-size: 0.85rem;
    }
    footer a { color: var(--cyan); text-decoration: none; margin: 0 8px; }
    footer a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <header>
    <a href="https://actanex.app" class="brand">
      <i class="fa-solid fa-cube" style="color:var(--cyan);"></i>
      ActaNex <span>Open</span>
    </a>
    <div class="nav-links">
      <a href="https://actanex.app"><i class="fa-solid fa-house"></i> Startseite</a>
      <a href="https://actanex.app/installer"><i class="fa-solid fa-rocket"></i> Installer</a>
    </div>
  </header>
  <main>
    <div class="legal-card">
      ${contentHtml}
    </div>
  </main>
  <footer>
    &copy; 2026 Michael Kirst-Neshva &bull; ActaNex Open &bull; 
    <a href="https://actanex.app/impressum">Impressum</a> &bull;
    <a href="https://actanex.app/datenschutz">Datenschutz</a> &bull;
    <a href="https://actanex.app/nutzungsbedingungen">Nutzungsbedingungen</a>
  </footer>
</body>
</html>`;
}

export function renderImpressum(): string {
  const content = `
    <h1>Impressum</h1>
    
    <h2>Angaben gemäß § 5 TMG</h2>
    <p>
      <strong>Michael Kirst-Neshva</strong><br>
      Ruthenberger Markt 11b<br>
      24539 Neumünster<br>
      Deutschland
    </p>

    <h2>Kontakt</h2>
    <p>
      E-Mail: <a href="mailto:support@actanex.app" style="color:var(--cyan); text-decoration:none;">support@actanex.app</a><br>
      Website: <a href="https://actanex.app" style="color:var(--cyan); text-decoration:none;">https://actanex.app</a>
    </p>

    <h2>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
    <p>
      Michael Kirst-Neshva<br>
      Ruthenberger Markt 11b<br>
      24539 Neumünster
    </p>

    <div class="disclaimer-box">
      <strong><i class="fa-solid fa-triangle-exclamation"></i> Wichtiger rechtlicher & steuerlicher Hinweis:</strong>
      ActaNex ist ein rein technisches Hilfsmittel zur Organisation von Tätigkeitsnachweisen, Reisekosten und Zeiterfassung. 
      ActaNex erbringt keinerlei Steuerberatung im Sinne des StBerG oder Rechtsberatung im Sinne des RDG. 
      Die Verantwortung für die sachliche, buchhalterische und steuerliche Richtigkeit der erfassten Zeiten, Belege und Kontierungen 
      sowie für die Einhaltung gesetzlicher Vorschriften (inkl. GoBD) verbleibt stets uneingeschränkt beim jeweiligen Anwender.
    </div>

    <h2>Haftung für Inhalte</h2>
    <p>
      Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
    </p>

    <h2>Haftung für Links</h2>
    <p>
      Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
    </p>

    <h2>Urheberrecht</h2>
    <p>
      Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
    </p>
  `;
  return baseLegalLayout("Impressum", content);
}

export function renderDatenschutz(): string {
  const content = `
    <h1>Datenschutzerklärung</h1>

    <h2>1. Datenschutz auf einen Blick</h2>
    <p>
      Der Schutz Ihrer persönlichen Daten ist uns ein wichtiges Anliegen. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend den gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.
    </p>

    <h2>2. Verantwortliche Stelle</h2>
    <p>
      <strong>Michael Kirst-Neshva</strong><br>
      Ruthenberger Markt 11b<br>
      24539 Neumünster<br>
      E-Mail: <a href="mailto:support@actanex.app" style="color:var(--cyan); text-decoration:none;">support@actanex.app</a>
    </p>

    <h2>3. Datenerfassung auf dieser Website</h2>
    <p>
      <strong>Server-Log-Dateien:</strong><br>
      Beim Aufruf unserer Website erfasst unser Hosting-Provider (Cloudflare, Inc.) automatisiert technische Informationen in Server-Log-Dateien, die Ihr Browser automatisch übermittelt (IP-Adresse, Browser-Typ, Betriebssystem, Referrer URL, Uhrzeit des Seitenaufrufs). Die Erfassung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO zur Gewährleistung der Betriebssicherheit und DDoS-Abwehr.
    </p>
    <p>
      <strong>Cloudflare Serverless & Edge Netzwerk:</strong><br>
      Wir nutzen Cloudflare zur Absicherung und Auslieferung der Webseiten mit Server-Standorten in der Europäischen Union (Region Western Europe). Cloudflare fungiert als Auftragsverarbeiter gemäß Art. 28 DSGVO.
    </p>

    <h2>4. Subdomain-Verfügbarkeitsprüfung</h2>
    <p>
      Wenn Sie auf der Startseite oder der Reservierungsmaske die Verfügbarkeit eines Subdomain-Namens prüfen, wird der eingegebene Subdomain-Präfix an unsere API übermittelt, um Kollisionen zu prüfen. Diese Abfrage speichert keine personenbezogenen Daten, sofern kein Kauf- oder Reservierungsabschluss erfolgt.
    </p>

    <h2>5. Datenverarbeitung bei Mandanteninstanzen</h2>
    <p>
      Im Open-Source- und Self-Service-Modell (BYOL) betreiben Sie Ihre Instanz auf eigener Cloudflare-Infrastruktur. ActaNex hat in diesem Modell keinen Zugriff auf Ihre Kundendaten, Zeiteinträge oder Belege. Im Managed-Modell werden Daten verschlüsselt in isolierten SQLite/D1-Datenbanken in der EU gespeichert.
    </p>

    <h2>6. Ihre Rechte (DSGVO)</h2>
    <p>
      Sie haben jederzeit das Recht auf unentgeltliche Auskunft über Ihre gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger und den Zweck der Datenverarbeitung sowie ein Recht auf Berichtigung, Sperrung oder Löschung dieser Daten (Art. 15–20 DSGVO). Wenden Sie sich hierzu an die oben genannte Adresse.
    </p>
  `;
  return baseLegalLayout("Datenschutzerklärung", content);
}

export function renderNutzungsbedingungen(): string {
  const content = `
    <h1>Nutzungsbedingungen (AGB)</h1>

    <h2>1. Geltungsbereich & Vertragsgegenstand</h2>
    <p>
      Diese Bedingungen regeln die Nutzung der Plattform ActaNex Open sowie der angebotenen Dienstleistungen und Software-Pakete von Michael Kirst-Neshva, Ruthenberger Markt 11b, 24539 Neumünster (nachfolgend „Anbieter“).
    </p>

    <h2>2. Leistungsumfang & Pakete</h2>
    <ul>
      <li><strong>ActaNex Free (Community Version):</strong> Kostenfreie Bereitstellung des Open-Source-Codes. Nutzung lokaler bzw. browserbasierter SQL-Blob-Speicherung mit ausdrücklichem Speicherplatzlimit. Keine Verfügbarkeitsgarantie.</li>
      <li><strong>ActaNex Pro (Self Service BYOL):</strong> 2,50 € / Monat zzgl. USt. Bereitstellung von Update-Skripten und Bereitstellungs-Assistenten für den Betrieb auf der Cloudflare-Infrastruktur des Nutzers (Bring Your Own License/Account).</li>
      <li><strong>Managed Pakete (Demnächst verfügbar):</strong> Vollständig verwaltetes Hosting auf dedizierter Infrastruktur.</li>
    </ul>

    <div class="disclaimer-box">
      <strong><i class="fa-solid fa-triangle-exclamation"></i> Ausschluss von Garantien & Steuerberatung:</strong>
      ActaNex ist eine technische Organisations- und Softwarelösung. Der Anbieter garantiert weder die uneingeschränkte steuerliche Anerkennung erstellter Nachweise durch Finanzbehörden noch das Bestehen behördlicher Prüfungen. Es wird keine Garantie für die GoBD-Konformität oder Vollständigkeit der Vorkontierung (SKR04/SKR03) übernommen. Der Nutzer ist verpflichtet, alle exportierten Daten vor Einreichung beim Steuerberater oder Finanzamt eigenverantwortlich zu prüfen.
    </div>

    <h2>3. Pflichten des Nutzers</h2>
    <p>
      Der Nutzer ist verpflichtet, seine Zugangsdaten geheim zu halten und vor unbefugtem Zugriff Dritter zu schützen. Bei Nutzung eigener Cloudflare API-Schlüssel (BYOL) trägt der Nutzer die alleinige Verantwortung für die sichere Konfiguration seiner Berechtigungen.
    </p>

    <h2>4. Haftungsbeschränkung</h2>
    <p>
      Der Anbieter haftet unbeschränkt bei Vorsatz oder grober Fahrlässigkeit. Bei einfacher Fahrlässigkeit haftet der Anbieter nur für Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit sowie für Schäden aus der Verletzung wesentlicher Vertragspflichten (Kardinalpflichten). Die Haftung für mittelbare Schäden, entgangenen Gewinn oder Datenverlust ist im gesetzlich zulässigen Rahmen ausgeschlossen.
    </p>

    <h2>5. Schlussbestimmungen</h2>
    <p>
      Es gilt das Recht der Bundesrepublik Deutschland. Gerichtsstand ist, soweit gesetzlich zulässig, Neumünster.
    </p>
  `;
  return baseLegalLayout("Nutzungsbedingungen", content);
}
