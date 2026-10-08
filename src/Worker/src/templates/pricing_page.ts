/**
 * ==============================================================================
 * ACTANEX OPEN - DEDICATED PRICING & METERED BILLING PAGE TEMPLATE
 * ==============================================================================
 * Route: /preise /pricing & https://actanex.app/#preise
 * Enthält:
 * - Schema.org / JSON-LD (SoftwareApplication & OfferCatalog)
 * - 4 Basis-Pakete (Free, Pro BYOA, Pro Managed, Pro+ Managed)
 * - 1:1 Cloudflare Pay-As-You-Go Mehrverbrauch (ohne Aufschlag)
 * - Storage-Freibetragsregeln (Standard 2,5 GB frei, Pro+ 5 GB frei)
 * - Freelancer KI-Vision & Revisions-Querverweise
 * - 3 monatliche Backup- & GoBD-Add-Ons mit Stripe Payment Links
 * ==============================================================================
 */

export function renderPricingPage(origin = 'https://actanex.app'): string {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": `${origin}/#software`,
        "name": "ActaNex",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Cloudflare Workers, Web Browser",
        "offers": {
          "@type": "AggregateOffer",
          "priceCurrency": "EUR",
          "lowPrice": "0.00",
          "highPrice": "8.50",
          "offerCount": "7"
        },
        "description": "GoBD-konforme Zeiterfassung, Reisekosten & DATEV EXTF 700 Abrechnung für IT-Freelancer auf Cloudflare Edge."
      },
      {
        "@type": "OfferCatalog",
        "@id": `${origin}/preise#catalog`,
        "name": "ActaNex Tarife, Infrastruktur & Revisions-Add-Ons",
        "itemListElement": [
          {
            "@type": "Offer",
            "name": "ActaNex Free (Community)",
            "price": "0.00",
            "priceCurrency": "EUR",
            "description": "Kostenfreie Open-Source Edition für Freelancer. Lokaler SQLite / D1 SQL-Speicher, manuelle Belegerfassung."
          },
          {
            "@type": "Offer",
            "name": "ActaNex Pro (Self Service - BYOA)",
            "price": "2.50",
            "priceCurrency": "EUR",
            "priceSpecification": {
              "@type": "UnitPriceSpecification",
              "price": "2.50",
              "priceCurrency": "EUR",
              "unitText": "MONTH"
            },
            "description": "Bring Your Own Account: Automatisierter 1-Klick Web-Installer für den eigenen Cloudflare Account. Inkl. R2 Beleg-Storage."
          },
          {
            "@type": "Offer",
            "name": "ActaNex Pro (Managed)",
            "price": "5.00",
            "priceCurrency": "EUR",
            "priceSpecification": {
              "@type": "UnitPriceSpecification",
              "price": "5.00",
              "priceCurrency": "EUR",
              "unitText": "MONTH"
            },
            "description": "Vollständig gemanagtes Cloudflare Hosting. 2,5 GB R2 Beleg-Storage inklusive, tägliche Backups, Subdomain *.open.actanex.app."
          },
          {
            "@type": "Offer",
            "name": "ActaNex Pro+ (Managed High-Performance)",
            "price": "8.50",
            "priceCurrency": "EUR",
            "priceSpecification": {
              "@type": "UnitPriceSpecification",
              "price": "8.50",
              "priceCurrency": "EUR",
              "unitText": "MONTH"
            },
            "description": "Enterprise-Tier mit 5 GB R2 Beleg-Storage inklusive, Gemini 3.7 Pro KI-Vision, erweiterte WAF & Snapshots."
          },
          {
            "@type": "Offer",
            "name": "ActaNex Cloudflare D1 SQL Mehrverbrauch",
            "price": "0.75",
            "priceCurrency": "EUR",
            "description": "Zusätzlicher D1 SQL-Speicherplatz (1:1 Cloudflare Kosten: 0,75 € pro GB / Monat bzw. 0,00075 € / MB)."
          },
          {
            "@type": "Offer",
            "name": "ActaNex Cloudflare R2 Object Storage Mehrverbrauch",
            "price": "0.015",
            "priceCurrency": "EUR",
            "description": "Zusätzlicher R2 Dokumentenspeicher (1:1 Cloudflare Kosten: 0,015 € pro GB / Monat). Erste 2,5 GB (Standard) bzw. 5 GB (Pro+) kostenfrei."
          },
          {
            "@type": "Offer",
            "name": "ActaNex Cloudflare Workers Compute",
            "price": "0.30",
            "priceCurrency": "EUR",
            "description": "Worker-Requests über 100.000 Requests/Tag hinaus (1:1 Cloudflare Kosten: 0,30 € pro 1 Mio. Requests)."
          },
          {
            "@type": "Offer",
            "name": "ActaNex Edge AI Vision Engine",
            "price": "0.02",
            "priceCurrency": "EUR",
            "description": "KI-Belegextraktion via Gemini Vision & Cloudflare LLaMA Vision. 50 Scans/Tag gratis inklusive, Mehrverbrauch 0,02 € / Scan."
          },
          {
            "@type": "Offer",
            "name": "ActaNex 10-Jahre GoBD WORM-Revisionsarchiv",
            "price": "2.50",
            "priceCurrency": "EUR",
            "url": "https://buy.stripe.com/14A3cvdUK6srbsw2wg5J604",
            "description": "Unveränderbares, GoBD-zertifiziertes Langzeitarchiv (§ 147 AO) mit kryptografischen Merkle-Root-Monatsiegeln und WORM-Objektsperre."
          },
          {
            "@type": "Offer",
            "name": "ActaNex 360-Tage Extended Audit Trail & Revisions-Logs",
            "price": "1.50",
            "priceCurrency": "EUR",
            "url": "https://buy.stripe.com/4gMbJ103U8AzcwA7QA5J605",
            "description": "Erweiterte Revisionsprotokollierung und lückenlose Aufbewahrung aller System- und Änderungs-Logs für 360 Tage."
          },
          {
            "@type": "Offer",
            "name": "ActaNex 365-Tage Multi-Region Disaster Recovery Backup",
            "price": "3.00",
            "priceCurrency": "EUR",
            "url": "https://buy.stripe.com/5kQ00jeYOcQP4047QA5J606",
            "description": "Automatisiertes tägliches D1-Datenbankbackup mit geografisch redundanter Speicherung in separaten EU-Regionen."
          }
        ]
      }
    ]
  };

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preise & Tarife – ActaNex | Transparente 1:1 Cloudflare Kosten & GoBD Add-Ons</title>
  <meta name="description" content="Transparente Preisübersicht für ActaNex: Von 0 € Open Source bis Managed Cloud. 1:1 Weitergabe der Cloudflare-Infrastrukturkosten ohne Aufschlag, Freikontingente und GoBD-WORM-Langzeitarchiv.">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><circle cx='16' cy='16' r='14' fill='%230f172a'/><polygon points='16,4 28,11 28,21 16,28 4,21 4,11' fill='none' stroke='%2338bdf8' stroke-width='2.5'/><circle cx='16' cy='16' r='4' fill='%2306b6d4'/></svg>" type="image/svg+xml">

  <!-- Schema.org / JSON-LD Structured Data -->
  <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
  </script>

  <style>
    :root {
      --bg-main: #090d16;
      --bg-surface: #0f172a;
      --bg-card: rgba(17, 24, 39, 0.72);
      --bg-card-hover: rgba(30, 41, 59, 0.85);
      --border-subtle: rgba(255, 255, 255, 0.08);
      --border-focus: rgba(56, 189, 248, 0.5);
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
      --cyan-bright: #38bdf8;
      --cyan-glow: #06b6d4;
      --blue-accent: #3b82f6;
      --indigo-accent: #6366f1;
      --emerald-accent: #10b981;
      --amber-accent: #f59e0b;
      --rose-accent: #f43f5e;
      --radius-sm: 8px;
      --radius-md: 14px;
      --radius-lg: 20px;
      --radius-full: 9999px;
      --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, Helvetica, Arial, sans-serif;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; scroll-behavior: smooth; }
    body {
      font-family: var(--font-family);
      background-color: var(--bg-main);
      color: var(--text-main);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      overflow-x: hidden;
    }

    .container {
      width: 100%;
      max-width: 1240px;
      margin: 0 auto;
      padding: 0 24px;
    }

    /* Ambient Glow */
    .ambient-glow {
      position: absolute;
      border-radius: 50%;
      filter: blur(120px);
      pointer-events: none;
      z-index: 0;
      opacity: 0.15;
    }
    .glow-cyan {
      width: 500px; height: 500px;
      background: radial-gradient(circle, var(--cyan-bright) 0%, transparent 70%);
      top: -100px; left: 50%; transform: translateX(-50%);
    }

    /* Header */
    header.site-header {
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(9, 13, 22, 0.85);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border-subtle);
      padding: 16px 0;
    }
    .header-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .brand-logo {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: #ffffff;
      font-weight: 800;
      font-size: 20px;
    }
    .brand-tagline {
      font-size: 11px;
      font-weight: 600;
      color: var(--cyan-bright);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: block;
    }
    .main-nav {
      display: flex;
      align-items: center;
      gap: 28px;
    }
    .main-nav a {
      color: var(--text-muted);
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      transition: color 0.2s ease;
    }
    .main-nav a:hover, .main-nav a.active {
      color: var(--cyan-bright);
    }
    .btn-primary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: linear-gradient(135deg, #0284c7, #2563eb);
      color: #ffffff;
      padding: 10px 22px;
      border-radius: var(--radius-sm);
      font-weight: 700;
      font-size: 14px;
      text-decoration: none;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35);
      transition: all 0.25s ease;
    }
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(2, 132, 199, 0.5);
    }
    .btn-secondary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: rgba(30, 41, 59, 0.7);
      color: #f1f5f9;
      border: 1px solid var(--border-subtle);
      padding: 10px 20px;
      border-radius: var(--radius-sm);
      font-weight: 600;
      font-size: 14px;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-secondary:hover {
      background: rgba(51, 65, 85, 0.9);
      border-color: rgba(255, 255, 255, 0.2);
    }

    /* Page Hero */
    .pricing-hero {
      padding: 70px 0 40px;
      text-align: center;
      position: relative;
      z-index: 1;
    }
    .section-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(56, 189, 248, 0.1);
      border: 1px solid rgba(56, 189, 248, 0.25);
      color: var(--cyan-bright);
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 4px 14px;
      border-radius: var(--radius-full);
      margin-bottom: 16px;
    }
    .pricing-hero h1 {
      font-size: 42px;
      font-weight: 800;
      letter-spacing: -0.02em;
      line-height: 1.2;
      margin-bottom: 16px;
      background: linear-gradient(135deg, #ffffff 40%, #94a3b8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .pricing-hero p {
      font-size: 17px;
      color: var(--text-muted);
      max-width: 760px;
      margin: 0 auto 30px;
    }

    /* Pricing Section */
    section.pricing-content {
      padding: 30px 0 90px;
      position: relative;
      z-index: 1;
    }

    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      align-items: stretch;
      margin-bottom: 60px;
    }
    .pricing-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 32px 24px;
      backdrop-filter: blur(16px);
      display: flex;
      flex-direction: column;
      position: relative;
      transition: all 0.3s ease;
    }
    .pricing-card:hover {
      transform: translateY(-4px);
      border-color: rgba(56, 189, 248, 0.35);
    }
    .pricing-card.highlight {
      background: rgba(22, 33, 56, 0.85);
      border: 2px solid var(--cyan-bright);
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 35px rgba(6, 182, 212, 0.2);
      transform: scale(1.02);
    }
    .pricing-card.highlight:hover {
      transform: scale(1.03) translateY(-4px);
    }
    .pricing-badge {
      position: absolute;
      top: -13px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #0284c7, #2563eb);
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 4px 14px;
      border-radius: var(--radius-full);
      box-shadow: 0 4px 12px rgba(2, 132, 199, 0.4);
      white-space: nowrap;
    }
    .pricing-header {
      margin-bottom: 20px;
    }
    .pricing-plan-name {
      font-size: 19px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 6px;
    }
    .pricing-plan-desc {
      font-size: 12px;
      color: var(--text-muted);
      min-height: 34px;
    }
    .pricing-price {
      margin: 16px 0;
      display: flex;
      align-items: baseline;
      gap: 4px;
    }
    .pricing-amount {
      font-size: 38px;
      font-weight: 800;
      color: #ffffff;
      line-height: 1;
    }
    .pricing-interval {
      font-size: 13px;
      color: var(--text-dim);
      font-weight: 500;
    }
    .limits-box {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: var(--radius-sm);
      padding: 10px 12px;
      margin-bottom: 20px;
      font-size: 11px;
      color: #cbd5e1;
    }
    .limits-box strong {
      color: #ffffff;
      display: block;
      margin-bottom: 3px;
    }
    .pricing-features-list {
      list-style: none;
      margin-bottom: 26px;
      flex-grow: 1;
    }
    .pricing-features-list li {
      font-size: 13px;
      color: #cbd5e1;
      margin-bottom: 12px;
      display: flex;
      align-items: flex-start;
      gap: 10px;
      line-height: 1.4;
    }
    .pricing-features-list li svg {
      flex-shrink: 0;
      margin-top: 2px;
      color: var(--emerald-accent);
    }
    .pricing-features-list li.muted {
      color: var(--text-dim);
    }
    .pricing-features-list li.muted svg {
      color: var(--text-dim);
    }
    .pricing-cta {
      margin-top: auto;
    }
    .pricing-cta .btn-primary, .pricing-cta .btn-secondary {
      width: 100%;
    }

    /* Section Subheaders */
    .sub-section-header {
      text-align: center;
      margin: 60px 0 36px;
    }
    .sub-section-header h2 {
      font-size: 30px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 10px;
    }
    .sub-section-header p {
      font-size: 15px;
      color: var(--text-muted);
      max-width: 680px;
      margin: 0 auto;
    }

    /* Pay-As-You-Go 1:1 Pass-Through Section */
    .passthrough-banner {
      background: rgba(56, 189, 248, 0.08);
      border: 1px solid rgba(56, 189, 248, 0.25);
      border-radius: var(--radius-md);
      padding: 16px 20px;
      margin-bottom: 30px;
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .passthrough-banner .icon {
      font-size: 24px;
      flex-shrink: 0;
    }
    .passthrough-banner-text {
      font-size: 13px;
      color: #e0f2fe;
      line-height: 1.5;
    }
    .passthrough-banner-text strong {
      color: #ffffff;
    }

    .metered-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }
    .metered-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 24px 20px;
      display: flex;
      flex-direction: column;
      position: relative;
      transition: all 0.2s ease;
    }
    .metered-card:hover {
      border-color: rgba(56, 189, 248, 0.4);
      background: var(--bg-card-hover);
    }
    .metered-badge {
      display: inline-block;
      align-self: flex-start;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 3px 10px;
      border-radius: var(--radius-full);
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
      margin-bottom: 12px;
    }
    .metered-title {
      font-size: 16px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 6px;
    }
    .metered-price {
      font-size: 26px;
      font-weight: 800;
      color: var(--cyan-bright);
      margin-bottom: 4px;
    }
    .metered-unit {
      font-size: 12px;
      color: var(--text-dim);
      margin-bottom: 14px;
    }
    .metered-desc {
      font-size: 12px;
      color: var(--text-muted);
      line-height: 1.5;
      margin-bottom: 16px;
      flex-grow: 1;
    }
    .metered-quota-tag {
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 6px;
      padding: 8px 10px;
      font-size: 11px;
      color: #cbd5e1;
    }
    .metered-quota-tag strong {
      color: #38bdf8;
    }

    /* Smart Recommendation Box */
    .smart-tip-box {
      background: rgba(99, 102, 241, 0.08);
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: var(--radius-md);
      padding: 18px 22px;
      display: flex;
      align-items: center;
      gap: 16px;
      margin: 28px 0 60px;
    }
    .tip-icon {
      font-size: 28px;
      flex-shrink: 0;
    }
    .tip-content {
      font-size: 13px;
      color: #e0e7ff;
      line-height: 1.5;
    }
    .tip-content strong {
      color: #ffffff;
    }

    /* Add-Ons Section */
    .addons-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 22px;
      margin-bottom: 60px;
    }
    .addon-card {
      background: var(--bg-card);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: var(--radius-lg);
      padding: 28px 24px;
      display: flex;
      flex-direction: column;
      position: relative;
      transition: all 0.3s ease;
    }
    .addon-card:hover {
      transform: translateY(-3px);
      border-color: rgba(56, 189, 248, 0.4);
      box-shadow: 0 16px 36px -10px rgba(0, 0, 0, 0.5);
    }
    .addon-badge {
      display: inline-block;
      align-self: flex-start;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 4px 12px;
      border-radius: var(--radius-full);
      margin-bottom: 14px;
    }
    .addon-badge.gobd {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .addon-badge.audit {
      background: rgba(56, 189, 248, 0.15);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.3);
    }
    .addon-badge.backup {
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }
    .addon-title {
      font-size: 18px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 8px;
    }
    .addon-price {
      font-size: 32px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 14px;
    }
    .addon-price span {
      font-size: 13px;
      color: var(--text-dim);
      font-weight: 500;
    }
    .addon-desc {
      font-size: 13px;
      color: var(--text-muted);
      line-height: 1.55;
      margin-bottom: 24px;
      flex-grow: 1;
    }
    .addon-cta {
      margin-top: auto;
    }
    .addon-cta .btn-primary {
      width: 100%;
    }

    /* Comparison Table */
    .comparison-wrapper {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 24px;
      backdrop-filter: blur(16px);
      overflow-x: auto;
      margin-bottom: 60px;
    }
    table.comparison-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      min-width: 800px;
    }
    table.comparison-table th, table.comparison-table td {
      padding: 14px 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      font-size: 13px;
    }
    table.comparison-table th {
      background: rgba(15, 23, 42, 0.8);
      color: #ffffff;
      font-weight: 700;
    }
    table.comparison-table tr.category-row td {
      background: rgba(30, 41, 59, 0.6);
      color: var(--cyan-bright);
      font-weight: 800;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .check-yes { color: var(--emerald-accent); font-weight: 700; }
    .check-no { color: var(--text-dim); }

    /* FAQ */
    .faq-section {
      max-width: 840px;
      margin: 0 auto 60px;
    }
    .faq-item {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      margin-bottom: 12px;
      overflow: hidden;
    }
    .faq-q {
      padding: 18px 22px;
      font-weight: 700;
      font-size: 15px;
      color: #ffffff;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .faq-a {
      padding: 0 22px 18px;
      font-size: 13px;
      color: var(--text-muted);
      line-height: 1.6;
    }

    /* Footer */
    footer.site-footer {
      border-top: 1px solid var(--border-subtle);
      padding: 40px 0;
      background: #050810;
      text-align: center;
      font-size: 13px;
      color: var(--text-dim);
    }
    footer.site-footer a {
      color: var(--text-muted);
      text-decoration: none;
      margin: 0 10px;
    }
    footer.site-footer a:hover {
      color: var(--cyan-bright);
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .pricing-grid, .metered-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .addons-grid {
        grid-template-columns: 1fr;
      }
    }
    @media (max-width: 640px) {
      .pricing-grid, .metered-grid {
        grid-template-columns: 1fr;
      }
      .pricing-hero h1 {
        font-size: 30px;
      }
    }
  </style>
</head>
<body>
  <div class="ambient-glow glow-cyan"></div>

  <!-- Header -->
  <header class="site-header">
    <div class="container header-inner">
      <a href="/" class="brand-logo">
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="14" fill="#0f172a" stroke="#38bdf8" stroke-width="2"/>
          <polygon points="16,6 26,12 26,20 16,26 6,20 6,12" stroke="#06b6d4" stroke-width="2"/>
          <circle cx="16" cy="16" r="4" fill="#38bdf8"/>
        </svg>
        <div>
          <span>ActaNex</span>
          <span class="brand-tagline">Evidence &amp; Billing Hub</span>
        </div>
      </a>
      <nav class="main-nav">
        <a href="/#funktionen">Funktionen</a>
        <a href="/preise" class="active">Preise &amp; Tarife</a>
        <a href="/#vergleich">Vergleich</a>
        <a href="/#gobd-datev">GoBD &amp; DATEV</a>
        <a href="/installer">Installer</a>
      </nav>
      <div class="header-actions">
        <a href="#tarife" class="btn-primary">Tarif wählen</a>
      </div>
    </div>
  </header>

  <!-- Hero Section -->
  <div class="pricing-hero container" id="preise">
    <span class="section-tag">Transparente Preismodelle</span>
    <h1>Faire Tarife &amp; 1:1 Cloudflare Kostenweitergabe</h1>
    <p>
      Vom dauerhaft kostenfreien Open-Source Self-Hosting bis zur voll gemanagten High-Performance Cloud. 
      Zusätzliche Cloudflare-Infrastrukturkosten geben wir 100% ohne jeden Aufschlag an Sie weiter.
    </p>
  </div>

  <section class="pricing-content container">
    <!-- 1. BASE PLANS (4 TIERS) -->
    <div class="pricing-grid" id="tarife">
      <!-- Paket 1: Free -->
      <div class="pricing-card highlight">
        <div class="pricing-badge" style="background: linear-gradient(135deg, #059669, #0284c7);">Standard • 0 € Community</div>
        <div class="pricing-header">
          <div class="pricing-plan-name">ActaNex Free</div>
          <div class="pricing-plan-desc">Community Version für Einsteiger &amp; Self-Host</div>
          <div class="pricing-price">
            <span class="pricing-amount">0,00 €</span>
            <span class="pricing-interval">/ dauerhaft frei</span>
          </div>
        </div>
        <div class="limits-box" style="border-color: rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.1); color: #34d399;">
          <strong>Keine Kreditkarte erforderlich:</strong>
          Lokales SQLite / Self-Hosted Deployment.
        </div>
        <ul class="pricing-features-list">
          <li>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <span>Vollständige Kernfunktionen (Zeiterfassung &amp; Kunden)</span>
          </li>
          <li>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <span>Manuelle Belegerfassung &amp; Standard-Reports</span>
          </li>
          <li>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <span>Community Support via GitHub</span>
          </li>
          <li class="muted">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            <span>Kein R2 Cloud Objektspeicher</span>
          </li>
        </ul>
        <div class="pricing-cta">
          <a href="https://buy.stripe.com/fZucN5aIyaIHfIMc6Q5J602" class="btn-primary" target="_blank">Kostenlos starten (0 €)</a>
        </div>
      </div>

      <!-- Paket 2: Pro BYOA -->
      <div class="pricing-card">
        <div class="pricing-badge" style="background: rgba(99, 102, 241, 0.2); border: 1px solid rgba(99, 102, 241, 0.4); color: #818cf8;">BYOA</div>
        <div class="pricing-header">
          <div class="pricing-plan-name">ActaNex Pro</div>
          <div class="pricing-plan-desc">Self Service (Bring Your Own Account)</div>
          <div class="pricing-price">
            <span class="pricing-amount">2,50 €</span>
            <span class="pricing-interval">/ Monat</span>
          </div>
        </div>
        <div class="limits-box">
          <strong>BYOL Cloudflare Workers Free Limits:</strong>
          100.000 Requests/Tag • 5 GB D1 SQL DB • Eigener Cloudflare Account.
        </div>
        <ul class="pricing-features-list">
          <li>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <span>Vollständige Automation &amp; 1-Klick Web-Installer</span>
          </li>
          <li>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <span>R2 Cloud Beleg-Storage (im eigenen CF Account)</span>
          </li>
          <li>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <span>1-Klick Updates via Web-Wizard</span>
          </li>
          <li>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <span>DATEV EXTF Format 700 &amp; Lexware XL Sync</span>
          </li>
        </ul>
        <div class="pricing-cta">
          <a href="https://buy.stripe.com/4gMdR96si2cbfIM1sc5J603" class="btn-secondary" target="_blank">BYOA buchen (2,50 €)</a>
        </div>
      </div>

      <!-- Paket 3: Pro Managed -->
      <div class="pricing-card" style="opacity: 0.95;">
        <div class="pricing-badge" style="background: rgba(148, 163, 184, 0.2); border: 1px solid rgba(148, 163, 184, 0.3); color: #cbd5e1;">Managed Cloud</div>
        <div class="pricing-header">
          <div class="pricing-plan-name">ActaNex Pro (Managed)</div>
          <div class="pricing-plan-desc">Vollständig verwaltetes Cloudflare-Hosting</div>
          <div class="pricing-price">
            <span class="pricing-amount">5,00 €</span>
            <span class="pricing-interval">/ Monat</span>
          </div>
        </div>
        <div class="limits-box">
          <strong>Managed Workers Limits:</strong>
          100.000 Requests/Tag • <strong>Erste 2,5 GB R2 Belegspeicher frei</strong> • Subdomain inklusive.
        </div>
        <ul class="pricing-features-list">
          <li>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <span><strong>Zero-Touch-Einrichtung:</strong> Sofort betriebsbereit</span>
          </li>
          <li>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <span>Eigene Subdomain (<code>*.open.actanex.app</code>)</span>
          </li>
          <li>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <span>Tägliche automatische Cloud-Backups</span>
          </li>
          <li>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <span>Änderungsprotokoll &amp; Revisionssicherheit</span>
          </li>
        </ul>
        <div class="pricing-cta">
          <button type="button" class="btn-secondary" style="width: 100%; opacity: 0.7; cursor: not-allowed;" disabled>Demnächst verfügbar</button>
        </div>
      </div>

      <!-- Paket 4: Pro+ Managed -->
      <div class="pricing-card" style="opacity: 0.95;">
        <div class="pricing-badge" style="background: linear-gradient(135deg, #6366f1, #9333ea);">High-Performance</div>
        <div class="pricing-header">
          <div class="pricing-plan-name">ActaNex Pro+</div>
          <div class="pricing-plan-desc">Managed High-Performance Enterprise Tier</div>
          <div class="pricing-price">
            <span class="pricing-amount">8,50 €</span>
            <span class="pricing-interval">/ Monat</span>
          </div>
        </div>
        <div class="limits-box">
          <strong>High-Performance Limits:</strong>
          <strong>Erste 5,0 GB R2 Belegspeicher frei</strong> • Gemini 3.7 Vision • Priority WAF.
        </div>
        <ul class="pricing-features-list">
          <li>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <span>Alle Features aus <strong>Pro Managed</strong> enthalten</span>
          </li>
          <li>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <span><strong>5 GB R2 Beleg-Storage inklusive</strong></span>
          </li>
          <li>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <span>Priorisierter Gemini 3.7 KI-Vision Durchsatz</span>
          </li>
          <li>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <span>Erweiterte Enterprise DDoS &amp; WAF Schutzschichten</span>
          </li>
        </ul>
        <div class="pricing-cta">
          <button type="button" class="btn-secondary" style="width: 100%; opacity: 0.7; cursor: not-allowed;" disabled>Demnächst verfügbar</button>
        </div>
      </div>
    </div>

    <!-- 2. PAY-AS-YOU-GO 1:1 PASS-THROUGH SECTION -->
    <div class="sub-section-header">
      <span class="section-tag" style="background: rgba(16, 185, 129, 0.1); color: #34d399; border-color: rgba(16, 185, 129, 0.3);">1:1 Weitergabe • Null Aufschlag</span>
      <h2>Pay-as-you-Go Mehrverbrauch zu Cloudflare-Originalkosten</h2>
      <p>
        Keine künstlichen Tarifsprünge, keine teuren Extrapakete: Zusätzliche Serverressourcen rechnen wir minutengenau und 1:1 zu den offiziellen Cloudflare-Preisen ab.
      </p>
    </div>

    <div class="passthrough-banner">
      <div class="icon">⚡</div>
      <div class="passthrough-banner-text">
        <strong>100% Transparenz-Versprechen:</strong> ActaNex schlägt keinen Cent auf die Cloudflare-Infrastruktur auf. Die verbrauchten Megabytes und Requests werden automatisiert über Stripe Metered Billing exakt zu den Cloudflare-Selbstkosten abgerechnet.
      </div>
    </div>

    <div class="metered-grid">
      <!-- D1 SQL -->
      <div class="metered-card">
        <span class="metered-badge">SQL Datenbank</span>
        <div class="metered-title">Cloudflare D1 SQL Mehrverbrauch</div>
        <div class="metered-price">0,75 € <span style="font-size: 14px; color: var(--text-muted); font-weight: 500;">/ GB</span></div>
        <div class="metered-unit">bzw. exakt 0,00075 € / MB pro Monat</div>
        <div class="metered-desc">
          Zusätzlicher transaktionssicherer D1 SQL-Speicher über das gebuchte Basiskontingent hinaus. Perfekt für Zehntausende Zeiteinträge &amp; Buchungsdaten.
        </div>
        <div class="metered-quota-tag">
          Basis: <strong>Im Paket enthalten</strong> • Abrechnung pro MB
        </div>
      </div>

      <!-- R2 Storage -->
      <div class="metered-card">
        <span class="metered-badge" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border-color: rgba(56, 189, 248, 0.3);">Dokumente &amp; Belege</span>
        <div class="metered-title">Cloudflare R2 Object Storage</div>
        <div class="metered-price">0,015 € <span style="font-size: 14px; color: var(--text-muted); font-weight: 500;">/ GB</span></div>
        <div class="metered-unit">pro GB / Monat (0 € Egress Gebühren)</div>
        <div class="metered-desc">
          S3-kompatibler Speicherplatz für PDF-Rechnungen, Reisekostenquittungen und Bewirtungsbelege mit globalem Edge Caching.
        </div>
        <div class="metered-quota-tag">
          Freibetrag: <strong>Standard 2,5 GB frei</strong> • <strong>Pro+ 5,0 GB frei</strong>
        </div>
      </div>

      <!-- Workers Compute -->
      <div class="metered-card">
        <span class="metered-badge" style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; border-color: rgba(245, 158, 11, 0.3);">Edge Compute</span>
        <div class="metered-title">Workers Compute (Requests)</div>
        <div class="metered-price">0,30 € <span style="font-size: 14px; color: var(--text-muted); font-weight: 500;">/ 1 Mio.</span></div>
        <div class="metered-unit">Requests über Freikontingent hinaus</div>
        <div class="metered-desc">
          Serverless Edge Execution mit &lt; 15ms Latenz an über 300 Standorten weltweit. 100.000 Inklusiv-Requests pro Tag reichen für die allermeisten Nutzer völlig aus.
        </div>
        <div class="metered-quota-tag">
          Inklusive: <strong>100.000 Requests/Tag gratis</strong>
        </div>
      </div>

      <!-- AI Vision -->
      <div class="metered-card">
        <span class="metered-badge" style="background: rgba(147, 51, 234, 0.15); color: #c084fc; border-color: rgba(147, 51, 234, 0.3);">KI Extraktion</span>
        <div class="metered-title">Edge AI Vision Engine</div>
        <div class="metered-price">0,02 € <span style="font-size: 14px; color: var(--text-muted); font-weight: 500;">/ Scan</span></div>
        <div class="metered-unit">nach 50 kostenfreien Tages-Scans</div>
        <div class="metered-desc">
          Automatische Erkennung von Betrag, Datum, USt-Satz und Belegkategorie via Google Gemini Vision &amp; Cloudflare LLaMA Vision.
        </div>
        <div class="metered-quota-tag">
          Inklusive: <strong>50 Scans/Tag gratis im Basispaket</strong>
        </div>
      </div>
    </div>

    <!-- Smart Recommendation / Cross-Reference -->
    <div class="smart-tip-box">
      <div class="tip-icon">💡</div>
      <div class="tip-content">
        <strong>Freelancer Smart-Tipp:</strong> Wer den R2 Beleg-Storage nutzt, profitiert optimal von der integrierten KI-Vision Belegerkennung – <strong>50 Scans/Tag sind im Basispaket bereits gratis inklusive!</strong> Erst darüber hinausgehende Belege kosten lediglich 0,02 € pro Scan.
      </div>
    </div>

    <!-- 3. REVISION & BACKUP ADD-ONS -->
    <div class="sub-section-header">
      <span class="section-tag" style="background: rgba(99, 102, 241, 0.1); color: #818cf8; border-color: rgba(99, 102, 241, 0.3);">Enterprise Add-Ons</span>
      <h2>GoBD-Revisionsarchiv &amp; Backup-Optionen</h2>
      <p>
        Monatlich flexibel zubuchbare Sicherheits- und Compliance-Erweiterungen für höchste steuerliche Nachweissicherheit bei Betriebsprüfungen.
      </p>
    </div>

    <div class="addons-grid">
      <!-- Add-On 1: 10y GoBD WORM -->
      <div class="addon-card">
        <span class="addon-badge gobd">GoBD &amp; § 147 AO Konform</span>
        <div class="addon-title">ActaNex 10-Jahre GoBD WORM-Revisionsarchiv</div>
        <div class="addon-price">2,50 € <span>/ Monat</span></div>
        <div class="addon-desc">
          Unveränderbares, GoBD-zertifiziertes Langzeitarchiv gemäß § 147 AO. Jeder Monatsabschluss wird mit kryptografischen Merkle-Root-Siegeln versiegelt und mit WORM-Objektsperre (Write Once, Read Many) vor Manipulation geschützt.
        </div>
        <div class="addon-cta">
          <a href="https://buy.stripe.com/14A3cvdUK6srbsw2wg5J604" class="btn-primary" target="_blank">
            <span>Archiv buchen (2,50 €)</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
        </div>
      </div>

      <!-- Add-On 2: 360d Audit Logs -->
      <div class="addon-card">
        <span class="addon-badge audit">Compliance &amp; Security</span>
        <div class="addon-title">ActaNex 360-Tage Extended Audit Trail</div>
        <div class="addon-price">1,50 € <span>/ Monat</span></div>
        <div class="addon-desc">
          Erweiterte Revisionsprotokollierung und lückenlose Aufbewahrung aller System-, Anmelde- und Datensatz-Änderungs-Logs für volle 360 Tage. Inklusive strukturiertem CSV- &amp; JSON-Audit-Export für Steuerberater.
        </div>
        <div class="addon-cta">
          <a href="https://buy.stripe.com/4gMbJ103U8AzcwA7QA5J605" class="btn-primary" target="_blank">
            <span>Audit-Trail buchen (1,50 €)</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
        </div>
      </div>

      <!-- Add-On 3: 365d DR Backup -->
      <div class="addon-card">
        <span class="addon-badge backup">Disaster Recovery</span>
        <div class="addon-title">365-Tage Multi-Region Disaster Recovery</div>
        <div class="addon-price">3,00 € <span>/ Monat</span></div>
        <div class="addon-desc">
          Automatisiertes tägliches D1-Datenbankbackup mit geografisch redundanter Speicherung in separaten europäischen Cloudflare-Regionen. 365 Tage Historie mit 1-Klick Point-in-Time-Wiederherstellung.
        </div>
        <div class="addon-cta">
          <a href="https://buy.stripe.com/5kQ00jeYOcQP4047QA5J606" class="btn-primary" target="_blank">
            <span>Backup buchen (3,00 €)</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
        </div>
      </div>
    </div>

    <!-- GoBD Cross-Reference Tip -->
    <div class="smart-tip-box" style="border-color: rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.08);">
      <div class="tip-icon">🛡️</div>
      <div class="tip-content">
        <strong>Steuerliche Nachweissicherheit für Freiberufler &amp; IT-Berater (§ 18 EStG):</strong> Mit dem 10-Jahre WORM-Revisionsarchiv erfüllen Sie die steuerliche Aufbewahrungsfrist (§ 147 AO) manipulationssicher und ohne eigenen Serverbetrieb. Bei einer Betriebsprüfung durch das Finanzamt legen Sie die kryptografische Prüfkette mit einem Klick vor.
      </div>
    </div>

    <!-- 4. COMPARISON TABLE -->
    <div class="sub-section-header">
      <span class="section-tag">Detaillierter Überblick</span>
      <h2>Pakete &amp; Leistungsmerkmale im Detail</h2>
    </div>

    <div class="comparison-wrapper">
      <table class="comparison-table">
        <thead>
          <tr>
            <th>Funktion / Leistungsmerkmal</th>
            <th>Free (Community)</th>
            <th>Pro (BYOA)</th>
            <th>Pro (Managed)</th>
            <th>Pro+ (Managed)</th>
          </tr>
        </thead>
        <tbody>
          <tr class="category-row">
            <td colspan="5">Kosten &amp; Abrechnung</td>
          </tr>
          <tr>
            <td><strong>Monatlicher Grundpreis</strong></td>
            <td>0,00 €</td>
            <td>2,50 €</td>
            <td>5,00 € <em>(Bald)</em></td>
            <td>8,50 € <em>(Bald)</em></td>
          </tr>
          <tr>
            <td><strong>Kündbarkeit</strong></td>
            <td>Jederzeit</td>
            <td>Monatlich kündbar</td>
            <td>Monatlich kündbar</td>
            <td>Monatlich kündbar</td>
          </tr>
          <tr class="category-row">
            <td colspan="5">Speicher &amp; Cloudflare Freibeträge</td>
          </tr>
          <tr>
            <td><strong>Datenbank (SQL)</strong></td>
            <td>Lokal / D1 Blob</td>
            <td>5 GB D1 (im eigenen CF)</td>
            <td>5 GB D1 Managed</td>
            <td>10 GB D1 Managed</td>
          </tr>
          <tr>
            <td><strong>R2 Beleg-Storage (Inklusive)</strong></td>
            <td><span class="check-no">✕ Nicht enthalten</span></td>
            <td>Eigenes R2 Kontingent</td>
            <td><span class="check-yes">✓ Erste 2,5 GB frei</span></td>
            <td><span class="check-yes">✓ Erste 5,0 GB frei</span></td>
          </tr>
          <tr>
            <td><strong>R2 Mehrverbrauch (1:1 Kosten)</strong></td>
            <td>—</td>
            <td>1:1 Cloudflare Kosten</td>
            <td>0,015 € / GB / Monat</td>
            <td>0,015 € / GB / Monat</td>
          </tr>
          <tr class="category-row">
            <td colspan="5">Automation, KI &amp; Schnittstellen</td>
          </tr>
          <tr>
            <td><strong>KI-Vision Belegerkennung</strong></td>
            <td>Manuell</td>
            <td>50 Scans/Tag gratis</td>
            <td>50 Scans/Tag gratis</td>
            <td>100 Scans/Tag + Gemini 3.7</td>
          </tr>
          <tr>
            <td><strong>DATEV EXTF Format 700</strong></td>
            <td><span class="check-yes">✓ Enthalten</span></td>
            <td><span class="check-yes">✓ Enthalten</span></td>
            <td><span class="check-yes">✓ Enthalten</span></td>
            <td><span class="check-yes">✓ Enthalten</span></td>
          </tr>
          <tr>
            <td><strong>Lexware Office XL API Sync</strong></td>
            <td><span class="check-yes">✓ Enthalten</span></td>
            <td><span class="check-yes">✓ Enthalten</span></td>
            <td><span class="check-yes">✓ Enthalten</span></td>
            <td><span class="check-yes">✓ Enthalten</span></td>
          </tr>
          <tr class="category-row">
            <td colspan="5">Revisionssicherheit &amp; Add-Ons</td>
          </tr>
          <tr>
            <td><strong>10-Jahre GoBD WORM-Archiv</strong></td>
            <td>Optional zubuchbar</td>
            <td>Optional zubuchbar</td>
            <td>Zubuchbar (2,50 €/Mt.)</td>
            <td>Zubuchbar (2,50 €/Mt.)</td>
          </tr>
          <tr>
            <td><strong>360-Tage Audit Trail</strong></td>
            <td>Optional zubuchbar</td>
            <td>Optional zubuchbar</td>
            <td>Zubuchbar (1,50 €/Mt.)</td>
            <td>Zubuchbar (1,50 €/Mt.)</td>
          </tr>
          <tr>
            <td><strong>365-Tage Multi-Region Backup</strong></td>
            <td>Optional zubuchbar</td>
            <td>Optional zubuchbar</td>
            <td>Zubuchbar (3,00 €/Mt.)</td>
            <td>Zubuchbar (3,00 €/Mt.)</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 5. FAQ -->
    <div class="sub-section-header">
      <span class="section-tag">Häufige Fragen</span>
      <h2>Fragen zur Abrechnung &amp; Infrastruktur</h2>
    </div>

    <div class="faq-section">
      <div class="faq-item">
        <div class="faq-q">Wie funktioniert die 1:1 Weitergabe der Cloudflare-Kosten? <span>▼</span></div>
        <div class="faq-a">
          ActaNex misst Ihren Ressourcenverbrauch (D1 SQL Megabytes, R2 Storage Gigabytes, Worker-Requests und KI-Scans) automatisch. Verbrauchen Sie mehr als Ihr Freikontingent (z. B. mehr als 2,5 GB R2 im Standardpaket), wird genau der Cloudflare-Originalpreis (z. B. 0,015 €/GB) ohne jeglichen Gewinnaufschlag über Stripe berechnet.
        </div>
      </div>
      <div class="faq-item">
        <div class="faq-q">Gibt es eine Mindestvertragslaufzeit? <span>▼</span></div>
        <div class="faq-a">
          Nein. Alle bezahlten Pläne und zubuchbaren Add-Ons sind monatlich kündbar. Es gibt keine Einrichtungsgebühren und keine versteckten Kosten.
        </div>
      </div>
      <div class="faq-item">
        <div class="faq-q">Sind die Belege bei Betriebsprüfungen GoBD-konform geschützt? <span>▼</span></div>
        <div class="faq-a">
          Ja. Mit dem 10-Jahre GoBD WORM-Revisionsarchiv werden Ihre Belege mit kryptografischen Merkle-Root-Siegeln und WORM-Objektsperren (Write Once, Read Many) gespeichert. Damit ist eine nachträgliche Manipulation mathematisch und technisch ausgeschlossen.
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="site-footer">
    <div class="container">
      <p style="margin-bottom: 12px;">&copy; 2026 ActaNex Open Contributors. GoBD-konforme Zeiterfassung &amp; Abrechnung auf Cloudflare Edge.</p>
      <div>
        <a href="/impressum">Impressum</a>
        <a href="/datenschutz">Datenschutz</a>
        <a href="/nutzungsbedingungen">Nutzungsbedingungen</a>
        <a href="/preise">Preise</a>
        <a href="https://github.com/micha-k/ActaNex-Open" target="_blank" rel="noopener">GitHub</a>
      </div>
    </div>
  </footer>
</body>
</html>`;
}
