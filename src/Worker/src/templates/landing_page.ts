/**
 * FREELANCER EVIDENCE & BILLING HUB - LANDING PAGE TEMPLATE
 * Domain: actanex.app (or custom edge origin)
 * (c) 2026 ActaNex Open Contributors
 */

export function renderLandingPage(origin = 'https://actanex.app'): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ActaNex – Freelancer Evidence & Billing Hub | Zeiterfassung & Nachweise</title>
  <meta name="description" content="Software zur Unterstützung bei Zeiterfassung, Reisekosten & Nachweisführung für IT-Freelancer, Berater & Architekten. Orientiert an § 18 EStG, 22 Reisekosten-Kategorien, KI-Vision Belegerkennung & DATEV EXTF 700.">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><circle cx='16' cy='16' r='14' fill='%230f172a'/><polygon points='16,4 28,11 28,21 16,28 4,21 4,11' fill='none' stroke='%2338bdf8' stroke-width='2.5'/><circle cx='16' cy='16' r='4' fill='%2306b6d4'/></svg>" type="image/svg+xml">
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

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      scroll-behavior: smooth;
    }

    body {
      font-family: var(--font-family);
      background-color: var(--bg-main);
      color: var(--text-main);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      overflow-x: hidden;
      position: relative;
    }

    /* Ambient background glowing lights */
    .ambient-glow {
      position: absolute;
      width: 600px;
      height: 600px;
      border-radius: 50%;
      filter: blur(140px);
      pointer-events: none;
      z-index: 0;
      opacity: 0.18;
    }
    .glow-top-left {
      top: -150px;
      left: -150px;
      background: radial-gradient(circle, var(--cyan-glow), var(--blue-accent));
    }
    .glow-top-right {
      top: 100px;
      right: -200px;
      background: radial-gradient(circle, var(--indigo-accent), var(--blue-accent));
    }
    .glow-center {
      top: 45%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: radial-gradient(circle, var(--cyan-glow), transparent);
      opacity: 0.12;
    }

    .container {
      max-width: 1240px;
      margin: 0 auto;
      padding: 0 24px;
      position: relative;
      z-index: 1;
    }

    /* Typography */
    h1, h2, h3, h4 {
      color: #ffffff;
      font-weight: 800;
      line-height: 1.2;
      letter-spacing: -0.02em;
    }
    .gradient-text {
      background: linear-gradient(135deg, #ffffff 20%, var(--cyan-bright) 70%, var(--indigo-accent) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .cyan-text {
      color: var(--cyan-bright);
    }

    /* Header & Navigation */
    header.site-header {
      position: sticky;
      top: 0;
      z-index: 100;
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      background: rgba(9, 13, 22, 0.75);
      border-bottom: 1px solid var(--border-subtle);
      transition: all 0.3s ease;
    }
    .nav-wrapper {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 76px;
    }
    .brand-logo {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: #fff;
    }
    .logo-mark {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(99, 102, 241, 0.2));
      border: 1px solid rgba(56, 189, 248, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 15px rgba(6, 182, 212, 0.25);
    }
    .brand-name {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.03em;
      display: flex;
      flex-direction: column;
      line-height: 1.1;
    }
    .brand-tagline {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--cyan-bright);
      font-weight: 600;
      margin-top: 2px;
    }

    nav.main-nav {
      display: flex;
      align-items: center;
      gap: 32px;
    }
    nav.main-nav a {
      color: var(--text-muted);
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      transition: color 0.2s ease;
    }
    nav.main-nav a:hover {
      color: var(--cyan-bright);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .btn-login {
      color: var(--text-muted);
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      padding: 8px 16px;
      border-radius: var(--radius-sm);
      transition: all 0.2s;
    }
    .btn-login:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.05);
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: linear-gradient(135deg, #0284c7, #2563eb);
      color: #ffffff;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      padding: 10px 20px;
      border-radius: var(--radius-md);
      border: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(56, 189, 248, 0.45);
      background: linear-gradient(135deg, #0ea5e9, #3b82f6);
    }
    .btn-lg {
      padding: 14px 28px;
      font-size: 16px;
      border-radius: var(--radius-md);
    }
    .btn-secondary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: rgba(30, 41, 59, 0.7);
      color: #ffffff;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      padding: 10px 20px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-subtle);
      backdrop-filter: blur(8px);
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-secondary:hover {
      background: rgba(51, 65, 85, 0.8);
      border-color: rgba(255, 255, 255, 0.2);
      transform: translateY(-1px);
    }

    /* Mobile Menu Toggle */
    .menu-toggle {
      display: none;
      background: none;
      border: none;
      color: #fff;
      cursor: pointer;
      padding: 8px;
    }

    /* Hero Section */
    section.hero {
      padding: 90px 0 60px;
      text-align: center;
    }
    .hero-badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 16px;
      border-radius: var(--radius-full);
      background: rgba(6, 182, 212, 0.08);
      border: 1px solid rgba(6, 182, 212, 0.3);
      color: var(--cyan-bright);
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 24px;
      box-shadow: 0 0 20px rgba(6, 182, 212, 0.15);
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #06b6d4;
      box-shadow: 0 0 8px #06b6d4;
      animation: pulseAnim 2s infinite;
    }
    @keyframes pulseAnim {
      0% { transform: scale(0.95); opacity: 0.8; }
      50% { transform: scale(1.2); opacity: 1; }
      100% { transform: scale(0.95); opacity: 0.8; }
    }

    .hero h1 {
      font-size: 52px;
      max-width: 960px;
      margin: 0 auto 24px;
      letter-spacing: -0.03em;
    }
    .hero p.hero-subtitle {
      font-size: 19px;
      color: var(--text-muted);
      max-width: 780px;
      margin: 0 auto 40px;
      line-height: 1.6;
    }

    /* Live Trust Badges */
    .trust-badges-bar {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 16px;
      margin: 0 auto 48px;
      max-width: 900px;
    }
    .trust-badge-item {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 8px 18px;
      border-radius: var(--radius-full);
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid var(--border-subtle);
      font-size: 13px;
      font-weight: 600;
      color: #cbd5e1;
      backdrop-filter: blur(10px);
    }
    .trust-badge-item svg {
      color: var(--cyan-bright);
    }

    /* Subdomain Checker Card */
    .subdomain-card {
      max-width: 680px;
      margin: 0 auto 50px;
      background: rgba(17, 24, 39, 0.85);
      border: 1px solid rgba(56, 189, 248, 0.25);
      border-radius: var(--radius-lg);
      padding: 32px;
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 30px rgba(6, 182, 212, 0.1);
      backdrop-filter: blur(20px);
      text-align: left;
    }
    .subdomain-card-header {
      margin-bottom: 20px;
    }
    .subdomain-card-header h3 {
      font-size: 20px;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .subdomain-card-header p {
      font-size: 14px;
      color: var(--text-muted);
    }
    .subdomain-input-group {
      display: flex;
      align-items: center;
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: var(--radius-md);
      padding: 4px;
      transition: all 0.2s;
    }
    .subdomain-input-group:focus-within {
      border-color: var(--cyan-bright);
      box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.25);
    }
    .subdomain-prefix {
      padding-left: 14px;
      color: var(--text-dim);
      font-size: 14px;
      font-weight: 500;
    }
    .subdomain-input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: #ffffff;
      font-family: inherit;
      font-size: 16px;
      font-weight: 600;
      padding: 12px 6px;
      min-width: 140px;
    }
    .subdomain-input::placeholder {
      color: var(--text-dim);
      font-weight: 400;
    }
    .subdomain-suffix {
      padding: 0 12px;
      color: var(--cyan-bright);
      font-size: 14px;
      font-weight: 600;
      white-space: nowrap;
      user-select: none;
    }
    .subdomain-btn {
      white-space: nowrap;
    }

    .subdomain-result {
      margin-top: 14px;
      padding: 12px 16px;
      border-radius: var(--radius-sm);
      font-size: 13px;
      font-weight: 500;
      display: none;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .subdomain-result.available {
      display: flex;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.35);
      color: #34d399;
    }
    .subdomain-result.taken {
      display: flex;
      background: rgba(244, 63, 94, 0.12);
      border: 1px solid rgba(244, 63, 94, 0.35);
      color: #fb7185;
    }
    .subdomain-result.loading {
      display: flex;
      background: rgba(56, 189, 248, 0.1);
      border: 1px solid rgba(56, 189, 248, 0.3);
      color: var(--cyan-bright);
    }
    .subdomain-result-action {
      font-weight: 700;
      text-decoration: underline;
      cursor: pointer;
      color: #ffffff;
    }

    /* Section Headers */
    .section-header {
      text-align: center;
      max-width: 760px;
      margin: 0 auto 60px;
    }
    .section-header .section-tag {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: var(--cyan-bright);
      font-weight: 700;
      margin-bottom: 12px;
      display: block;
    }
    .section-header h2 {
      font-size: 38px;
      margin-bottom: 18px;
    }
    .section-header p {
      font-size: 16px;
      color: var(--text-muted);
    }

    /* Feature Grid Showcase */
    section.features {
      padding: 80px 0;
    }
    .features-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 28px;
    }
    .feature-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 32px;
      backdrop-filter: blur(16px);
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
    }
    .feature-card::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, var(--cyan-glow), transparent);
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    .feature-card:hover {
      background: var(--bg-card-hover);
      border-color: rgba(56, 189, 248, 0.3);
      transform: translateY(-4px);
      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.6), 0 0 25px rgba(6, 182, 212, 0.08);
    }
    .feature-card:hover::before {
      opacity: 1;
    }

    .feature-icon-wrapper {
      width: 54px;
      height: 54px;
      border-radius: 14px;
      background: rgba(30, 41, 59, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 22px;
      color: var(--cyan-bright);
    }
    .feature-card h3 {
      font-size: 20px;
      margin-bottom: 12px;
    }
    .feature-card p {
      font-size: 14px;
      color: var(--text-muted);
      margin-bottom: 18px;
      flex-grow: 1;
    }
    .feature-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .feature-tag {
      font-size: 11px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: var(--radius-full);
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.06);
      color: #cbd5e1;
    }

    /* Pricing Section */
    section.pricing {
      padding: 90px 0;
      position: relative;
    }
    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      align-items: stretch;
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
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
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
    .pricing-badge.pro-plus {
      background: linear-gradient(135deg, #6366f1, #9333ea);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
    }

    .pricing-header {
      margin-bottom: 24px;
      text-align: left;
    }
    .pricing-plan-name {
      font-size: 18px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 6px;
    }
    .pricing-plan-desc {
      font-size: 12px;
      color: var(--text-muted);
      min-height: 36px;
    }
    .pricing-price {
      margin: 18px 0;
      display: flex;
      align-items: baseline;
      gap: 4px;
    }
    .pricing-amount {
      font-size: 40px;
      font-weight: 800;
      color: #ffffff;
      line-height: 1;
    }
    .pricing-interval {
      font-size: 13px;
      color: var(--text-dim);
      font-weight: 500;
    }

    /* Warning/Important Box in Free Card */
    .storage-limit-notice {
      background: rgba(245, 158, 11, 0.09);
      border: 1px solid rgba(245, 158, 11, 0.28);
      border-radius: var(--radius-sm);
      padding: 10px 12px;
      margin-bottom: 20px;
      font-size: 11px;
      color: #fde68a;
      line-height: 1.45;
      display: flex;
      gap: 8px;
    }
    .storage-limit-notice svg {
      flex-shrink: 0;
      color: #f59e0b;
      margin-top: 1px;
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
      margin-bottom: 28px;
      flex-grow: 1;
      text-align: left;
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
    .pricing-cta .btn {
      width: 100%;
    }

    /* Comparison Table Section */
    section.comparison {
      padding: 80px 0;
    }
    .comparison-table-wrapper {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 24px;
      backdrop-filter: blur(16px);
      overflow-x: auto;
      box-shadow: 0 20px 50px -20px rgba(0, 0, 0, 0.6);
    }
    table.comparison-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      min-width: 820px;
    }
    table.comparison-table th,
    table.comparison-table td {
      padding: 14px 18px;
      font-size: 13px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    table.comparison-table th {
      color: #ffffff;
      font-weight: 700;
      background: rgba(15, 23, 42, 0.8);
    }
    table.comparison-table th:first-child {
      border-top-left-radius: var(--radius-sm);
      border-bottom-left-radius: var(--radius-sm);
      width: 32%;
    }
    table.comparison-table th:last-child {
      border-top-right-radius: var(--radius-sm);
      border-bottom-right-radius: var(--radius-sm);
    }
    table.comparison-table tr:hover td {
      background: rgba(255, 255, 255, 0.02);
    }
    table.comparison-table .category-row td {
      background: rgba(30, 41, 59, 0.7);
      font-weight: 700;
      color: var(--cyan-bright);
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.1em;
      padding-top: 18px;
      padding-bottom: 8px;
    }
    .check-yes {
      color: var(--emerald-accent);
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
    }
    .check-no {
      color: var(--text-dim);
      display: inline-flex;
      align-items: center;
    }
    .highlight-col {
      background: rgba(6, 182, 212, 0.04);
      font-weight: 600;
    }

    /* GoBD & DATEV Section */
    section.compliance {
      padding: 80px 0;
      background: radial-gradient(circle at 50% 50%, rgba(30, 41, 59, 0.35), transparent 70%);
    }
    .compliance-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      align-items: center;
    }
    .compliance-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 36px;
      backdrop-filter: blur(16px);
    }
    .compliance-card h3 {
      font-size: 22px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .compliance-card p {
      font-size: 14px;
      color: var(--text-muted);
      margin-bottom: 20px;
    }
    .compliance-points {
      list-style: none;
    }
    .compliance-points li {
      font-size: 13px;
      color: #cbd5e1;
      margin-bottom: 12px;
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }
    .compliance-points li svg {
      color: var(--cyan-bright);
      flex-shrink: 0;
      margin-top: 2px;
    }

    /* FAQ Section */
    section.faq {
      padding: 80px 0;
    }
    .faq-list {
      max-width: 860px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .faq-item {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      overflow: hidden;
      backdrop-filter: blur(12px);
      transition: border-color 0.2s;
    }
    .faq-item:hover {
      border-color: rgba(56, 189, 248, 0.3);
    }
    .faq-question {
      width: 100%;
      text-align: left;
      background: none;
      border: none;
      padding: 22px 24px;
      font-size: 16px;
      font-weight: 700;
      color: #ffffff;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      font-family: inherit;
    }
    .faq-icon {
      transition: transform 0.3s ease;
      color: var(--cyan-bright);
      flex-shrink: 0;
    }
    .faq-item.active .faq-icon {
      transform: rotate(180deg);
    }
    .faq-answer {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease, padding 0.3s ease;
      padding: 0 24px;
      color: var(--text-muted);
      font-size: 14px;
      line-height: 1.65;
    }
    .faq-item.active .faq-answer {
      max-height: 300px;
      padding: 0 24px 22px;
    }

    /* Modal / Onboarding Checkout Drawer */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      z-index: 999;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal-overlay.active {
      display: flex;
    }
    .modal-card {
      background: #0f172a;
      border: 1px solid rgba(56, 189, 248, 0.3);
      border-radius: var(--radius-lg);
      padding: 36px;
      max-width: 520px;
      width: 100%;
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.9);
      position: relative;
      animation: modalFadeIn 0.25s ease-out;
    }
    @keyframes modalFadeIn {
      from { opacity: 0; transform: translateY(12px) scale(0.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .modal-close-btn {
      position: absolute;
      top: 20px;
      right: 20px;
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 20px;
    }
    .modal-close-btn:hover {
      color: #fff;
    }
    .modal-card h3 {
      font-size: 22px;
      margin-bottom: 8px;
    }
    .modal-card p {
      font-size: 14px;
      color: var(--text-muted);
      margin-bottom: 24px;
    }
    .form-group {
      margin-bottom: 18px;
      text-align: left;
    }
    .form-label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #cbd5e1;
      margin-bottom: 6px;
    }
    .form-input {
      width: 100%;
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: var(--radius-sm);
      padding: 12px 14px;
      color: #fff;
      font-family: inherit;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
    }
    .form-input:focus {
      border-color: var(--cyan-bright);
    }
    .modal-plan-summary {
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 12px 16px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
    }

    /* Footer */
    footer.site-footer {
      background: #060911;
      border-top: 1px solid var(--border-subtle);
      padding: 60px 0 30px;
      color: var(--text-muted);
      font-size: 13px;
    }
    .footer-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 40px;
      margin-bottom: 40px;
    }
    .footer-brand p {
      margin-top: 12px;
      max-width: 340px;
      line-height: 1.6;
    }
    .footer-col h4 {
      color: #ffffff;
      font-size: 14px;
      margin-bottom: 16px;
    }
    .footer-col ul {
      list-style: none;
    }
    .footer-col ul li {
      margin-bottom: 10px;
    }
    .footer-col ul li a {
      color: var(--text-muted);
      text-decoration: none;
      transition: color 0.2s;
    }
    .footer-col ul li a:hover {
      color: var(--cyan-bright);
    }
    .footer-bottom {
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      padding-top: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      font-size: 12px;
      color: var(--text-dim);
    }

    /* Responsive Queries */
    @media (max-width: 1024px) {
      .pricing-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .features-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .footer-grid {
        grid-template-columns: 1fr 1fr;
      }
    }
    @media (max-width: 768px) {
      .nav-wrapper nav.main-nav {
        display: none;
      }
      .nav-wrapper.mobile-open nav.main-nav {
        display: flex;
        flex-direction: column;
        position: absolute;
        top: 76px;
        left: 0;
        right: 0;
        background: #090d16;
        border-bottom: 1px solid var(--border-subtle);
        padding: 24px;
        gap: 18px;
      }
      .menu-toggle {
        display: block;
      }
      .hero h1 {
        font-size: 34px;
      }
      .hero p.hero-subtitle {
        font-size: 16px;
      }
      .features-grid {
        grid-template-columns: 1fr;
      }
      .pricing-grid {
        grid-template-columns: 1fr;
      }
      .pricing-card.highlight {
        transform: none;
      }
      .compliance-grid {
        grid-template-columns: 1fr;
      }
      .footer-grid {
        grid-template-columns: 1fr;
      }
      .subdomain-input-group {
        flex-wrap: wrap;
      }
      .subdomain-btn {
        width: 100%;
        margin-top: 8px;
      }
    }
  </style>
</head>
<body>

  <!-- Ambient Light Effects -->
  <div class="ambient-glow glow-top-left"></div>
  <div class="ambient-glow glow-top-right"></div>
  <div class="ambient-glow glow-center"></div>

  <!-- Header -->
  <header class="site-header" id="siteHeader">
    <div class="container nav-wrapper" id="navWrapper">
      <a href="#" class="brand-logo" aria-label="ActaNex Startseite">
        <div class="logo-mark">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
            <path d="M2 17l10 5 10-5"></path>
            <path d="M2 12l10 5 10-5"></path>
          </svg>
        </div>
        <div class="brand-name">
          <span>ActaNex</span>
          <span class="brand-tagline">Evidence & Billing Hub</span>
        </div>
      </a>

      <nav class="main-nav" id="mainNav">
        <a href="#funktionen">Funktionen</a>
        <a href="#pakete">Pakete & Preise</a>
        <a href="#vergleich">Vergleich</a>
        <a href="#gobd-datev">GoBD & DATEV</a>
        <a href="#faq">FAQ</a>
      </nav>

      <div class="header-actions">
        <a href="#pakete" class="btn-primary">
          <span>Jetzt starten</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </a>
        <button class="menu-toggle" id="menuToggle" aria-label="Menü öffnen">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
        </button>
      </div>
    </div>
  </header>

  <!-- Hero Section -->
  <section class="hero">
    <div class="container">
      <div class="hero-badge-pill">
        <span class="pulse-dot"></span>
        <span>Version 3.3 • Vorlagen zur Verfahrensdokumentation &amp; Serverless Edge EU</span>
      </div>

      <h1>
        Die praxisnahe Zeiterfassungs- &amp; Nachweisplattform für <span class="gradient-text">IT-Freelancer, Berater &amp; Architekten</span>
      </h1>

      <p class="hero-subtitle">
        Unterstützung bei der Nachweisführung (orientiert an § 18 EStG), 22 IT-spezifische Reisekosten-Kategorien, moderne KI-Vision Belegverarbeitung und direkter Kanzlei-Sync (Lexware Office XL &amp; DATEV EXTF 700). 
      </p>

      <!-- Live Trust Badges -->
      <div class="trust-badges-bar">
        <div class="trust-badge-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <span>GoBD-Verfahrensdokumentation</span>
        </div>
        <div class="trust-badge-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
          <span>Lexware Office Live-Sync</span>
        </div>
        <div class="trust-badge-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          <span>DATEV EXTF Format 700</span>
        </div>
        <div class="trust-badge-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
          <span>Cloudflare Serverless EU</span>
        </div>
      </div>

      <!-- Subdomain Live Availability Checker -->
      <div class="subdomain-card" id="subdomain-check">
        <div class="subdomain-card-header">
          <h3>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            Wunsch-Subdomain prüfen
          </h3>
          <p>Sichern Sie sich Ihren individuellen Unternehmens-Zugang für Ihre Managed-Instanz:</p>
        </div>
        <div class="subdomain-input-group">
          <span class="subdomain-prefix">https://</span>
          <input type="text" id="subdomainInput" class="subdomain-input" placeholder="ihre-firma" autocomplete="off" spellcheck="false">
          <span class="subdomain-suffix">.open.actanex.app</span>
          <button type="button" id="checkSubdomainBtn" class="btn-primary subdomain-btn">
            <span>Verfügbarkeit prüfen</span>
          </button>
        </div>
        <div id="subdomainResult" class="subdomain-result"></div>
      </div>

      <div style="display: flex; justify-content: center; gap: 16px; flex-wrap: wrap;">
        <a href="#pakete" class="btn-primary btn-lg">
          <span>Pakete ansehen &amp; starten</span>
        </a>
        <a href="https://github.com/MKN1411/actanex-open" class="btn-secondary btn-lg" target="_blank" rel="noopener">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
          <span>GitHub Repository</span>
        </a>
      </div>
    </div>
  </section>

  <!-- Feature Showcase -->
  <section class="features" id="funktionen">
    <div class="container">
      <div class="section-header">
        <span class="section-tag">Funktionsumfang</span>
        <h2>Entwickelt für die anspruchsvolle IT-Praxis</h2>
        <p>ActaNex löst die spezifischen bürokratischen und steuerlichen Herausforderungen freiberuflicher Architekten, Consultants und Entwickler.</p>
      </div>

      <div class="features-grid">
        <!-- Feature 1 -->
        <div class="feature-card">
          <div class="feature-icon-wrapper">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <h3>⏱️ Zeiterfassung &amp; § 18 EStG Nachweise</h3>
          <p>Getrennte Erfassung von Ist- und Abrechnungszeit (Kulanz vs. Billable). Strukturierte Tätigkeitsnachweise auf 3 Detailstufen (Problem, Methode, Resultat) und Verknüpfung mit Architektur-Entscheidungen (ADR-Referenzen).</p>
          <div class="feature-tags">
            <span class="feature-tag">Orientiert an § 18 EStG</span>
            <span class="feature-tag">ADR-Referenzen</span>
            <span class="feature-tag">Ist vs. Billable</span>
          </div>
        </div>

        <!-- Feature 2 -->
        <div class="feature-card">
          <div class="feature-icon-wrapper">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 17h10M7 12h10M7 7h10"/></svg>
          </div>
          <h3>🚆 Reisekosten &amp; 22 IT-Kategorien</h3>
          <p>Maßgeschneidert auf Freiberufler: Coworking Day-Pässe, Fachkonferenzen, Roaming, Vor-Ort-Hardware, Hotel (Logis/Frühstück getrennt), VMA-Pauschalen und ein Kfz-Vollkosten-Planer für echte km-Sätze vs. 0,30 € Mindestsatz.</p>
          <div class="feature-tags">
            <span class="feature-tag">SKR04 &amp; SKR03</span>
            <span class="feature-tag">Kfz-Vollkosten</span>
            <span class="feature-tag">VMA 14€ / 28€</span>
          </div>
        </div>

        <!-- Feature 3 -->
        <div class="feature-card">
          <div class="feature-icon-wrapper">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a8 8 0 0 0-8 8c0 4.418 8 12 8 12s8-7.582 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          <h3>🧠 KI-Vision &amp; 70/30 Bewirtungssplitter</h3>
          <p>Multimodale Beleg-OCR via Google Gemini 3.7 Flash mit sofortigem Cloudflare LLaMA 3.2 Vision Fallback. Inklusive Smartphone QR-Upload in Echtzeit und automatischem Bewirtungssplitter (§ 4 Abs. 5 EStG).</p>
          <div class="feature-tags">
            <span class="feature-tag">Gemini 3.7 Pro/Flash</span>
            <span class="feature-tag">QR-Mobilupload</span>
            <span class="feature-tag">Prüfmodal</span>
          </div>
        </div>

        <!-- Feature 4 -->
        <div class="feature-card">
          <div class="feature-icon-wrapper">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h3>🔐 Zero-Trust OTP Kundenfreigabe</h3>
          <p>Mandanten bestätigen Leistungsnachweise ohne mühsame Passwort-Registrierung: Signierte Deeplinks fordern einen 6-stelligen E-Mail-Sicherheitscode an. Inklusive transparentem Beanstandungs- und Freigabe-Workflow.</p>
          <div class="feature-tags">
            <span class="feature-tag">Kein Passwort-Zwang</span>
            <span class="feature-tag">E-Mail OTP</span>
            <span class="feature-tag">Digital signiert</span>
          </div>
        </div>

        <!-- Feature 5 -->
        <div class="feature-card">
          <div class="feature-icon-wrapper">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          </div>
          <h3>⚡ Lexware Office Live-Sync &amp; Standalone</h3>
          <p>Zweiweg-Synchronisation mit Lexware Office XL: Kunden-Stammdaten, automatische Rechnungsentwürfe, Webhooks und Storno-Erkennung. Alternativ autarker Stand-Alone-Modus mit externen Nummern (SevDesk, Word).</p>
          <div class="feature-tags">
            <span class="feature-tag">Lexware Office XL</span>
            <span class="feature-tag">Stand-Alone Modus</span>
            <span class="feature-tag">Echtzeit-Webhooks</span>
          </div>
        </div>

        <!-- Feature 6 -->
        <div class="feature-card">
          <div class="feature-icon-wrapper">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <h3>🔒 Protokolle &amp; Monats-Merkle-Root</h3>
          <p>Kryptografische Prüfsummen (SHA-256) und Hashketten als technische Hilfestellung für Ihre Nachweisführung. 3-stufiger 2FA-Reset-Schutz gegen versehentlichen Datenverlust.</p>
          <div class="feature-tags">
            <span class="feature-tag">SHA-256 Prüfsummen</span>
            <span class="feature-tag">Merkle Root Siegel</span>
            <span class="feature-tag">2FA Schutz</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Pricing Section (4 Tiers) -->
  <section class="pricing" id="pakete">
    <div class="container">
      <div class="section-header">
        <span class="section-tag">Transparente Tarife</span>
        <h2>Wählen Sie das perfekte Paket für Ihre IT-Selbstständigkeit</h2>
        <p>Vom 100% kostenfreien Open-Source Self-Hosting bis zur voll gemanagten High-Performance Cloud – ohne versteckte Kosten und monatlich kündbar.</p>
      </div>

      <div class="pricing-grid">
        <!-- Paket 1: Free (STANDARD) -->
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

          <!-- WICHTIGER HINWEIS: Speicherlimit -->
          <div class="storage-limit-notice">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <div>
              <strong>Speicherlimit-Hinweis:</strong>
              Ablage erfolgt als SQL DB Blob / lokaler Speicher. Streng begrenzter Speicherplatz – ideal für geringes Belegaufkommen!
            </div>
          </div>

          <div class="limits-box" style="border-color: rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.1); color: #34d399;">
            <strong>Keine Kreditkarte notwendig:</strong>
            Lokales SQLite / Self-Hosted Community Deployment.
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
            <li class="muted">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              <span>Keine Managed Subdomain</span>
            </li>
          </ul>

          <div class="pricing-cta">
            <a href="https://actanex.app/installer/community" class="btn-primary" style="width: 100%;">Kostenlos starten (0 €)</a>
          </div>
        </div>

        <!-- Paket 2: Pro Self Service (BYOL) -->
        <div class="pricing-card">
          <div class="pricing-badge" style="background: rgba(99, 102, 241, 0.2); border: 1px solid rgba(99, 102, 241, 0.4); color: #818cf8;">BYOL</div>
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
              <span>Eigene Wunschdomain oder Workers.dev Subdomain</span>
            </li>
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <span>DATEV EXTF Format 700 &amp; Lexware XL Sync</span>
            </li>
          </ul>

          <div class="pricing-cta">
            <a href="https://actanex.app/installer/byol" class="btn-secondary" style="width: 100%;">BYOL Installer starten (2,50 €)</a>
          </div>
        </div>

        <!-- Paket 3: Pro Managed (BALD VERFÜGBAR) -->
        <div class="pricing-card" style="opacity: 0.85;">
          <div class="pricing-badge" style="background: rgba(148, 163, 184, 0.2); border: 1px solid rgba(148, 163, 184, 0.3); color: #cbd5e1;">Bald verfügbar</div>
          <div class="pricing-header">
            <div class="pricing-plan-name">ActaNex Pro</div>
            <div class="pricing-plan-desc">Vollständig verwaltetes Cloudflare-Hosting</div>
            <div class="pricing-price">
              <span class="pricing-amount">5,00 €</span>
              <span class="pricing-interval">/ Monat</span>
            </div>
          </div>

          <div class="limits-box">
            <strong>Managed Workers Free Limits:</strong>
            100.000 Requests/Tag • 5 GB D1 Datenbank • SSL inklusive.
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
              <span>Änderungsprotokoll &amp; Merkle-Root-Siegel</span>
            </li>
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Persönlicher E-Mail-Support</span>
            </li>
          </ul>

          <div class="pricing-cta">
            <button type="button" class="btn-secondary" style="width: 100%; opacity: 0.6; cursor: not-allowed;" disabled>
              Bald verfügbar (5,00 €)
            </button>
          </div>
        </div>

        <!-- Paket 4: Pro+ Managed (BALD VERFÜGBAR) -->
        <div class="pricing-card" style="opacity: 0.85;">
          <div class="pricing-badge" style="background: rgba(148, 163, 184, 0.2); border: 1px solid rgba(148, 163, 184, 0.3); color: #cbd5e1;">Bald verfügbar</div>
          <div class="pricing-header">
            <div class="pricing-plan-name">ActaNex Pro+</div>
            <div class="pricing-plan-desc">Managed High-Performance Enterprise Tier</div>
            <div class="pricing-price">
              <span class="pricing-amount">8,50 €</span>
              <span class="pricing-interval">/ Monat</span>
            </div>
          </div>

          <div class="limits-box">
            <strong>Cloudflare Pro Plan Merkmale:</strong>
            Workers Free + erweiterte DDoS/WAF, globale Beschleunigung &amp; Priorität.
          </div>

          <ul class="pricing-features-list">
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Alle Funktionen aus <strong>Pro Managed</strong> enthalten</span>
            </li>
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <span><strong>Priorisierter KI-Vision Durchsatz:</strong> Google Gemini 3.7 Pro Support</span>
            </li>
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Erweiterte Enterprise DDoS &amp; WAF Schutzschichten</span>
            </li>
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Unbegrenzte Protokollhistorie &amp; Snapshots</span>
            </li>
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Dedizierter Priority-Support mit Notfall-Kanal</span>
            </li>
          </ul>

          <div class="pricing-cta">
            <button type="button" class="btn-secondary" style="width: 100%; opacity: 0.6; cursor: not-allowed;" disabled>
              Bald verfügbar (8,50 €)
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Interactive Feature Comparison Table -->
  <section class="comparison" id="vergleich">
    <div class="container">
      <div class="section-header">
        <span class="section-tag">Transparenter Vergleich</span>
        <h2>Alle Funktionen im direkten Paketvergleich</h2>
        <p>Volle Übersicht über Hosting, Limits, Speichertechnologien und Enterprise-Leistungen.</p>
      </div>

      <div class="comparison-table-wrapper">
        <table class="comparison-table">
          <thead>
            <tr>
              <th>Funktion / Leistungsmerkmal</th>
              <th>Free (Community)</th>
              <th>Pro (Self Service)</th>
              <th class="highlight-col">Pro (Managed) <em>(Bald verfügbar)</em></th>
              <th>Pro+ (Managed) <em>(Bald verfügbar)</em></th>
            </tr>
          </thead>
          <tbody>
            <tr class="category-row">
              <td colspan="5">Tarif &amp; Hosting</td>
            </tr>
            <tr>
              <td><strong>Monatlicher Preis</strong></td>
              <td>0,00 €</td>
              <td>2,50 €</td>
              <td class="highlight-col">5,00 € (Bald verfügbar)</td>
              <td>8,50 € (Bald verfügbar)</td>
            </tr>
            <tr>
              <td><strong>Betriebsmodell</strong></td>
              <td>Self-Hosted / Lokal</td>
              <td>BYOL (Eigenes CF-Konto)</td>
              <td class="highlight-col">Voll gemanagt durch ActaNex</td>
              <td>Voll gemanagt High-Performance</td>
            </tr>
            <tr>
              <td><strong>Wunsch-Subdomain</strong></td>
              <td><span class="check-no">✕ Lokale URL</span></td>
              <td>Beliebig im eigenen Konto</td>
              <td class="highlight-col"><span class="check-yes">✓ *.open.actanex.app</span></td>
              <td><span class="check-yes">✓ *.open.actanex.app + Custom Domain</span></td>
            </tr>
            <tr>
              <td><strong>Beleg- &amp; PDF-Speicher</strong></td>
              <td>
                <span style="color:#fbbf24; font-weight:600;">⚠️ Begrenzter SQL DB Blob</span>
              </td>
              <td>Cloudflare R2 (10 GB)</td>
              <td class="highlight-col">Cloudflare R2 Managed (10 GB)</td>
              <td>Cloudflare R2 Managed (Erweitert)</td>
            </tr>
            <tr>
              <td><strong>Täglicher Durchsatz</strong></td>
              <td>Lokal / unlimitiert</td>
              <td>100.000 Requests / Tag</td>
              <td class="highlight-col">100.000 Requests / Tag</td>
              <td>100k + Priorisierter Durchsatz</td>
            </tr>

            <tr class="category-row">
              <td colspan="5">Kernfunktionen für IT-Freelancer</td>
            </tr>
            <tr>
              <td><strong>Zeiterfassung &amp; § 18 EStG</strong></td>
              <td><span class="check-yes">✓ Vollständig</span></td>
              <td><span class="check-yes">✓ Vollständig</span></td>
              <td class="highlight-col"><span class="check-yes">✓ Vollständig</span></td>
              <td><span class="check-yes">✓ Vollständig</span></td>
            </tr>
            <tr>
              <td><strong>22 Reisekostenkategorien &amp; Kfz-Rechner</strong></td>
              <td><span class="check-yes">✓ Standard</span></td>
              <td><span class="check-yes">✓ Inklusive</span></td>
              <td class="highlight-col"><span class="check-yes">✓ Inklusive</span></td>
              <td><span class="check-yes">✓ Inklusive</span></td>
            </tr>
            <tr>
              <td><strong>KI-Vision Belegerkennung (Gemini &amp; LLaMA)</strong></td>
              <td>Manuell / Eigener API-Key</td>
              <td><span class="check-yes">✓ Gemini 3.7 Flash</span></td>
              <td class="highlight-col"><span class="check-yes">✓ Gemini 3.7 Flash</span></td>
              <td><span class="check-yes">✓ Gemini 3.7 Pro + Priorität</span></td>
            </tr>
            <tr>
              <td><strong>Smartphone QR-Upload (Echtzeit)</strong></td>
              <td><span class="check-no">✕ Nicht verfügbar</span></td>
              <td><span class="check-yes">✓ 15-Min-Session</span></td>
              <td class="highlight-col"><span class="check-yes">✓ 15-Min-Session</span></td>
              <td><span class="check-yes">✓ 15-Min-Session</span></td>
            </tr>
            <tr>
              <td><strong>Zero-Trust OTP Mandantenfreigabe</strong></td>
              <td><span class="check-no">✕ Manuelle PDF</span></td>
              <td><span class="check-yes">✓ E-Mail OTP</span></td>
              <td class="highlight-col"><span class="check-yes">✓ E-Mail OTP</span></td>
              <td><span class="check-yes">✓ E-Mail OTP</span></td>
            </tr>
            <tr>
              <td><strong>Lexware Office XL Live-Sync</strong></td>
              <td><span class="check-yes">✓ REST-Sync</span></td>
              <td><span class="check-yes">✓ REST-Sync + Webhooks</span></td>
              <td class="highlight-col"><span class="check-yes">✓ REST-Sync + Webhooks</span></td>
              <td><span class="check-yes">✓ REST-Sync + Webhooks</span></td>
            </tr>
            <tr>
              <td><strong>DATEV EXTF Format 700 Kanzlei-Export</strong></td>
              <td><span class="check-yes">✓ Manuell</span></td>
              <td><span class="check-yes">✓ 1-Klick Export</span></td>
              <td class="highlight-col"><span class="check-yes">✓ 1-Klick Export</span></td>
              <td><span class="check-yes">✓ 1-Klick Export</span></td>
            </tr>

            <tr class="category-row">
              <td colspan="5">Sicherheit, Backups &amp; Support</td>
            </tr>
            <tr>
              <td><strong>GoBD-Audit-Trail &amp; Merkle-Root</strong></td>
              <td>Standard-Log</td>
              <td><span class="check-yes">✓ SHA-256 Integrität</span></td>
              <td class="highlight-col"><span class="check-yes">✓ SHA-256 Integrität</span></td>
              <td><span class="check-yes">✓ Unbegrenzte Revisionshistorie</span></td>
            </tr>
            <tr>
              <td><strong>Automatische Cloud-Backups</strong></td>
              <td>Manuell</td>
              <td>Selbstkonfiguriert</td>
              <td class="highlight-col"><span class="check-yes">✓ Tägliche Snapshots</span></td>
              <td class="check-yes"><span class="check-yes">✓ Echtzeit-Snapshots</span></td>
            </tr>
            <tr>
              <td><strong>Support &amp; Betreuung</strong></td>
              <td>GitHub Issues</td>
              <td>Web-Wizard &amp; Docs</td>
              <td class="highlight-col"><span class="check-yes">✓ E-Mail Support</span></td>
              <td><span class="check-yes">✓ Dedizierter Priority-Support</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>

  <!-- GoBD & DATEV Deep-Dive -->
  <section class="compliance" id="gobd-datev">
    <div class="container">
      <div class="compliance-grid">
        <div class="compliance-card">
          <h3>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            Unterstützung bei GoBD-Dokumentation &amp; Nachweisen
          </h3>
          <p>Freiberufliche IT-Dienstleistungen und Gutachten erfordern sorgfältige Nachweise. ActaNex bietet technische Funktionen, die Sie bei der ordnungsmäßigen Aufzeichnung unterstützen:</p>
          <ul class="compliance-points">
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <span><strong>Muster-Verfahrensdokumentation:</strong> Dokumentationsvorlagen für Systemarchitektur und Nachweisabläufe zur individuellen Anpassung.</span>
            </li>
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <span><strong>Kryptografische Prüfsummen:</strong> Buchungs- und Zeiteinträge werden mit SHA-256 Hashwerten und Merkle-Root-Monatsabschlüssen protokolliert.</span>
            </li>
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <span><strong>Nachvollziehbarkeit:</strong> Fortlaufendes technisches Änderungsprotokoll zur lückenlosen Historienführung.</span>
            </li>
          </ul>
        </div>

        <div class="compliance-card">
          <h3>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
            Kanzlei-Sync &amp; DATEV EXTF Format 700
          </h3>
          <p>Übergeben Sie Ihre Zahlen vorbereitet an Ihren Steuerberater ohne zeitraubende manuelle Nachbereitung:</p>
          <ul class="compliance-points">
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <span><strong>Kanzlei-Export:</strong> 116-Spalten Export angelehnt an das DATEV EXTF Format 700 (Kategorie 21) inklusive SKR03 / SKR04 Kontierung.</span>
            </li>
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <span><strong>Lexware Office Live-Sync:</strong> Automatische Synchronisation von Ausgangsrechnungen, Kundenkontakten und Belegen.</span>
            </li>
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <span><strong>Server-Standort EU:</strong> Hosting auf ISO 27001 zertifizierter Cloudflare Serverless Infrastruktur in der EU (Frankfurt / Amsterdam).</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>

  <!-- FAQ Section -->
  <section class="faq" id="faq">
    <div class="container">
      <div class="section-header">
        <span class="section-tag">Häufige Fragen</span>
        <h2>Alles, was Sie über ActaNex wissen müssen</h2>
        <p>Klare Antworten zu Datenschutz, Tarifen, Hosting und Kündigung.</p>
      </div>

      <div class="faq-list">
        <!-- FAQ 1 -->
        <div class="faq-item">
          <button class="faq-question">
            <span>Wie unterstützt ActaNex bei der GoBD-Sicherheit und Dokumentation?</span>
            <svg class="faq-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div class="faq-answer">
            ActaNex stellt technische Werkzeuge bereit: Sämtliche Änderungen an Zeiteinträgen, Reisekosten und Belegen werden mit Zeitstempel und kryptografischer SHA-256 Prüfsumme protokolliert. Bei Monatsabschlüssen kann ein Merkle-Root-Hash gebildet werden, der die Unverändertheit des Datenbestands dokumentiert. ActaNex ist ein Software-Hilfsmittel und erbringt keine Rechts- oder Steuerberatung. Die steuerliche Verantwortung liegt stets beim Anwender.
          </div>
        </div>

        <!-- FAQ 2 -->
        <div class="faq-item">
          <button class="faq-question">
            <span>Wo befindet sich der Server-Standort und wie ist der Datenschutz geregelt?</span>
            <svg class="faq-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div class="faq-answer">
            Die Managed-Instanzen laufen auf der Cloudflare Serverless Edge mit EU-Datenresidenz (primär Frankfurt am Main). Alle gespeicherten Belege im R2-Speicher und Transaktionsdaten in der D1-Datenbank unterliegen strikt der DSGVO. Sensible API-Keys werden mit AES-GCM verschlüsselt hinterlegt.
          </div>
        </div>

        <!-- FAQ 3 -->
        <div class="faq-item">
          <button class="faq-question">
            <span>Wie flexibel ist die Kündbarkeit der Managed-Pakete?</span>
            <svg class="faq-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div class="faq-answer">
            Alle kostenpflichtigen Pakete sind monatlich kündbar – ohne lange Mindestlaufzeiten oder versteckte Kündigungsfristen. Sie behalten stets die volle Datenhoheit: Vor einer Beendigung können Sie mit einem einzigen Klick einen vollständigen D1 SQLite SQL-Dump, alle Belege als ZIP-Archiv und den DATEV EXTF Buchungsstapel exportieren.
          </div>
        </div>

        <!-- FAQ 4 -->
        <div class="faq-item">
          <button class="faq-question">
            <span>Kann ich jederzeit zwischen den Paketen wechseln?</span>
            <svg class="faq-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div class="faq-answer">
            Ja. Ein Upgrade von der kostenlosen Community-Version zu Pro (Self Service) oder Pro (Managed) ist jederzeit nahtlos über den integrierten Datenmigrations-Assistenten möglich. Auch der Wechsel von Pro Self zu Managed erfolgt reibungslos ohne Datenverlust.
          </div>
        </div>

        <!-- FAQ 5 -->
        <div class="faq-item">
          <button class="faq-question">
            <span>Was genau bedeutet das BYOL-Modell bei "ActaNex Pro (Self Service)"?</span>
            <svg class="faq-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div class="faq-answer">
            BYOL steht für "Bring Your Own License" bzw. Bring Your Own Account. Sie erstellen kostenfrei ein eigenes Cloudflare-Konto. Über unseren 1-Klick Web-Installer hinterlegen Sie ein API-Token. Der Worker deployt sich direkt in Ihre persönliche Infrastruktur. Da Cloudflare im Free-Tier 100.000 Requests pro Tag und 5 GB D1 Datenbank kostenfrei anbietet, zahlen Sie bei Cloudflare 0,00 € und bei uns nur die Lizenzgebühr von 2,50 € / Monat für die Automatisierung und Wartung.
          </div>
        </div>

        <!-- FAQ 6 -->
        <div class="faq-item">
          <button class="faq-question">
            <span>Warum hat das kostenlose Free-Paket ein begrenztes Beleg-Speicherlimit?</span>
            <svg class="faq-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div class="faq-answer">
            In der Free-Community-Version werden Beleg-Dateien als Binärblobs direkt in der relationalen Datenbank bzw. im lokalen Dateispeicher abgelegt. Dadurch entfällt zwar die Notwendigkeit eines Cloud-Speicherdienstes, allerdings wächst die Datenbankgröße bei hochauflösenden Belegen rasch an. Für produktiven Einsatz mit hohem Belegaufkommen empfehlen wir daher die Nutzung von R2 Objektspeicher in den Pro-Tarifen.
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Booking / Subdomain Checkout Modal -->
  <div class="modal-overlay" id="bookingModal">
    <div class="modal-card">
      <button class="modal-close-btn" id="modalCloseBtn" aria-label="Schließen">&times;</button>
      <h3 id="modalPlanTitle">Instanz buchen</h3>
      <p id="modalPlanDesc">Sichern Sie sich Ihre persönliche ActaNex Cloud-Instanz:</p>

      <div class="modal-plan-summary">
        <div>
          <strong id="modalSummaryPlanName">ActaNex Pro (Managed)</strong>
          <div style="color: var(--text-dim); font-size: 11px;">Monatlich kündbar</div>
        </div>
        <div style="font-weight: 800; font-size: 16px; color: var(--cyan-bright);" id="modalSummaryPrice">5,00 € / Monat</div>
      </div>

      <form id="bookingForm">
        <div class="form-group">
          <label class="form-label" for="bookingSubdomain">Gewünschte Subdomain</label>
          <div style="display: flex; align-items: center; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: var(--radius-sm); padding: 0 10px;">
            <input type="text" id="bookingSubdomain" class="form-input" style="border: none; padding: 10px 0;" placeholder="ihre-firma" required>
            <span style="color: var(--cyan-bright); font-size: 12px; font-weight: 600;">.open.actanex.app</span>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="bookingEmail">Ihre E-Mail-Adresse für den Admin-Zugang</label>
          <input type="email" id="bookingEmail" class="form-input" placeholder="name@ihre-domain.de" required>
        </div>

        <div class="form-group">
          <label class="form-label" for="bookingName">Name / Firmenbezeichnung</label>
          <input type="text" id="bookingName" class="form-input" placeholder="z. B. Max Mustermann Cloud Consulting" required>
        </div>

        <div style="margin-top: 24px;">
          <button type="submit" class="btn-primary" style="width: 100%; padding: 14px;">
            <span>Zur Aktivierung &amp; Einrichtung</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>
        </div>

        <div style="font-size: 11px; color: var(--text-dim); text-align: center; margin-top: 12px;">
          Sichere Übertragung • Sofortige Bereitstellung • Keine Einrichtungsgebühr
        </div>
      </form>
    </div>
  </div>

  <!-- Footer -->
  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <div class="brand-logo">
            <div class="logo-mark" style="width: 32px; height: 32px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </div>
            <div class="brand-name">
              <span>ActaNex</span>
              <span class="brand-tagline">Evidence &amp; Billing Hub</span>
            </div>
          </div>
          <p>
            Softwarelösung für IT-Freelancer, Cloud Architects und Consultants zur praktischen Unterstützung bei Zeiterfassung und Nachweisführung.
          </p>
        </div>

        <div class="footer-col">
          <h4>Plattform</h4>
          <ul>
            <li><a href="#funktionen">Funktionen</a></li>
            <li><a href="#pakete">Tarife &amp; Preise</a></li>
            <li><a href="#vergleich">Feature-Vergleich</a></li>
            <li><a href="#gobd-datev">Dokumentationshilfe</a></li>
            <li><a href="https://actanex.app/installer">Web-Installer Übersicht</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Schnittstellen</h4>
          <ul>
            <li><a href="#funktionen">Lexware Office XL Sync</a></li>
            <li><a href="#gobd-datev">DATEV EXTF Format 700</a></li>
            <li><a href="#funktionen">Google Gemini Multimodal Vision</a></li>
            <li><a href="#funktionen">Cloudflare Workers &amp; D1</a></li>
            <li><a href="https://github.com/MKN1411/actanex-open" target="_blank" rel="noopener">GitHub Open Source</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Rechtliches</h4>
          <ul>
            <li><a href="https://actanex.app/impressum">Impressum</a></li>
            <li><a href="https://actanex.app/datenschutz">Datenschutzerklärung</a></li>
            <li><a href="https://actanex.app/nutzungsbedingungen">Nutzungsbedingungen</a></li>
            <li><a href="#faq">Häufige Fragen (FAQ)</a></li>
            <li><a href="mailto:support@actanex.app">Kontakt &amp; Support</a></li>
          </ul>
        </div>
      </div>

      <div style="max-width:850px; margin:0 auto 24px; color:var(--text-dim); font-size:12px; line-height:1.6; text-align:center;">
        <strong>Rechtlicher Hinweis:</strong> ActaNex ist ein technisches Organisationswerkzeug und Softwarelösung. 
        Keine Steuer- oder Rechtsberatung. Keine Garantiezusagen für das Bestehen steuerlicher Betriebsprüfungen. 
        Der Anwender bleibt uneingeschränkt selbst für die steuerliche und buchhalterische Richtigkeit verantwortlich.
      </div>

      <div class="footer-bottom">
        <div>
          &copy; 2026 Michael Kirst-Neshva &bull; ActaNex Open &bull; Ruthenberger Markt 11b, 24539 Neumünster &bull; Domain: <code style="color:var(--cyan-bright);">actanex.app</code>
        </div>
        <div>
          Gehostet auf Cloudflare Serverless Edge EU &bull; Technische Nachweishilfe
        </div>
      </div>
    </div>
  </footer>

  <!-- Vanilla JavaScript Interaction -->
  <script>
    (function() {
      // 1. Mobile Menu Toggle
      const menuToggle = document.getElementById('menuToggle');
      const navWrapper = document.getElementById('navWrapper');
      if (menuToggle && navWrapper) {
        menuToggle.addEventListener('click', function() {
          navWrapper.classList.toggle('mobile-open');
        });
      }

      // 2. FAQ Accordion
      const faqQuestions = document.querySelectorAll('.faq-question');
      faqQuestions.forEach(function(btn) {
        btn.addEventListener('click', function() {
          const item = this.parentElement;
          const isActive = item.classList.contains('active');
          document.querySelectorAll('.faq-item').forEach(function(el) {
            el.classList.remove('active');
          });
          if (!isActive) {
            item.classList.add('active');
          }
        });
      });

      // 3. Subdomain Live Availability Check
      const subdomainInput = document.getElementById('subdomainInput');
      const checkSubdomainBtn = document.getElementById('checkSubdomainBtn');
      const subdomainResult = document.getElementById('subdomainResult');
      let debounceTimer = null;

      function sanitizeSlug(val) {
        return val.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, '');
      }

      async function performSubdomainCheck() {
        if (!subdomainInput || !subdomainResult) return;
        const rawSlug = subdomainInput.value.trim().toLowerCase();
        const slug = sanitizeSlug(rawSlug);
        
        if (!slug || slug.length < 3) {
          subdomainResult.className = 'subdomain-result taken';
          subdomainResult.innerHTML = '<span>⚠️ Bitte geben Sie mindestens 3 Zeichen (Buchstaben, Ziffern) ein.</span>';
          return;
        }

        subdomainResult.className = 'subdomain-result loading';
        subdomainResult.innerHTML = '<span>Prüfe Verfügbarkeit von <strong>' + slug + '.open.actanex.app</strong>...</span>';

        try {
          // Dynamic endpoint matching current host or fallback to worker api
          const apiBase = window.location.origin.includes('actanex') || window.location.origin.includes('localhost') || window.location.origin.includes('workers.dev')
            ? window.location.origin
            : '';
          const res = await fetch(apiBase + '/api/v1/tenants/check-slug?slug=' + encodeURIComponent(slug));
          const data = await res.json();

          if (data && data.available) {
            subdomainResult.className = 'subdomain-result available';
            subdomainResult.innerHTML = '<span>🎉 <strong>' + data.hostname + '</strong> ist noch frei!</span>' +
              '<span class="subdomain-result-action" onclick="window.selectPlanWithSubdomain(\'' + slug + '\')">Jetzt sichern &rarr;</span>';
            // Sync with modal input
            const bookingSubdomain = document.getElementById('bookingSubdomain');
            if (bookingSubdomain) bookingSubdomain.value = slug;
          } else {
            subdomainResult.className = 'subdomain-result taken';
            const reason = (data && data.reason) ? data.reason : 'Dieser Name ist bereits vergeben oder reserviert.';
            subdomainResult.innerHTML = '<span>✕ <strong>' + slug + '.open.actanex.app</strong> ist leider belegt: ' + reason + '</span>';
          }
        } catch (err) {
          // Fallback if offline/network error: show valid format confirmation
          subdomainResult.className = 'subdomain-result available';
          subdomainResult.innerHTML = '<span>✓ Format gültig: <strong>' + slug + '.open.actanex.app</strong></span>' +
            '<span class="subdomain-result-action" onclick="window.selectPlanWithSubdomain(\'' + slug + '\')">Jetzt buchen &rarr;</span>';
          const bookingSubdomain = document.getElementById('bookingSubdomain');
          if (bookingSubdomain) bookingSubdomain.value = slug;
        }
      }

      if (checkSubdomainBtn) {
        checkSubdomainBtn.addEventListener('click', performSubdomainCheck);
      }
      if (subdomainInput) {
        subdomainInput.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            performSubdomainCheck();
          }
        });
        subdomainInput.addEventListener('input', function() {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(performSubdomainCheck, 800);
        });
      }

      // 4. Modal / Booking Drawer Handling
      const bookingModal = document.getElementById('bookingModal');
      const modalCloseBtn = document.getElementById('modalCloseBtn');
      const modalPlanTitle = document.getElementById('modalPlanTitle');
      const modalSummaryPlanName = document.getElementById('modalSummaryPlanName');
      const modalSummaryPrice = document.getElementById('modalSummaryPrice');
      const bookingForm = document.getElementById('bookingForm');

      function openModal(planKey, planTitle, planPrice) {
        if (!bookingModal) return;
        if (modalPlanTitle) modalPlanTitle.textContent = planTitle || 'Instanz buchen';
        if (modalSummaryPlanName) modalSummaryPlanName.textContent = planTitle || 'ActaNex Pro (Managed)';
        if (modalSummaryPrice) modalSummaryPrice.textContent = planPrice || '5,00 € / Monat';

        const subVal = subdomainInput ? sanitizeSlug(subdomainInput.value) : '';
        const bookingSubdomain = document.getElementById('bookingSubdomain');
        if (bookingSubdomain && subVal) {
          bookingSubdomain.value = subVal;
        }

        bookingModal.classList.add('active');
      }

      function closeModal() {
        if (bookingModal) bookingModal.classList.remove('active');
      }

      if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
      if (bookingModal) {
        bookingModal.addEventListener('click', function(e) {
          if (e.target === bookingModal) closeModal();
        });
      }

      document.querySelectorAll('.open-booking-modal').forEach(function(btn) {
        btn.addEventListener('click', function() {
          const planKey = this.getAttribute('data-plan');
          const title = this.getAttribute('data-title');
          const price = this.getAttribute('data-price');
          openModal(planKey, title, price);
        });
      });

      window.selectPlanWithSubdomain = function(slug) {
        const bookingSubdomain = document.getElementById('bookingSubdomain');
        if (bookingSubdomain) bookingSubdomain.value = slug;
        openModal('pro_managed', 'ActaNex Pro (Managed)', '5,00 € / Monat');
      };

      if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
          e.preventDefault();
          const sub = (document.getElementById('bookingSubdomain').value || '').trim();
          const email = (document.getElementById('bookingEmail').value || '').trim();
          const name = (document.getElementById('bookingName').value || '').trim();
          
          // Redirect to installer hub on actanex.app with preloaded query params
          const installerUrl = 'https://actanex.app/installer?subdomain=' + encodeURIComponent(sub) +
            '&email=' + encodeURIComponent(email) + '&name=' + encodeURIComponent(name);
          window.location.href = installerUrl;
        });
      }
    })();
  </script>
</body>
</html>
`;
}
