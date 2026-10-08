const urls = [
  'https://actanex.app/',
  'https://www.actanex.app/',
  'https://actanex.app/installer',
  'https://actanex.app/installer/byol',
  'https://actanex.app/installer/community',
  'https://actanex.app/update',
  'https://actanex.app/impressum',
  'https://actanex.app/datenschutz',
  'https://actanex.app/nutzungsbedingungen',
  'https://kirst-it.open.actanex.app/'
];

async function checkAll() {
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'ActaNex-Verifier/1.0',
          'Accept': 'text/html'
        }
      });
      const text = await res.text();
      const titleMatch = text.match(/<title>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : 'No title';
      console.log(`[${res.status}] ${url} -> Title: ${title}`);
    } catch (e) {
      console.error(`[FAIL] ${url} -> ${e.message}`);
    }
  }
}
async function verifyContent() {
  console.log('\n--- Deep Content Checks ---');
  const rootHtml = await (await fetch('https://actanex.app/')).text();
  const claimHtml = await (await fetch('https://kirst-it.open.actanex.app/')).text();

  console.log('Root checks:');
  console.log('- Header login button absent:', !rootHtml.includes('class="btn-login"'));
  console.log('- Free Standard highlighted:', rootHtml.includes('Standard • 0 € Community'));
  console.log('- Pro 5€ Bald verfügbar:', rootHtml.includes('Bald verfügbar (5,00 €)'));
  console.log('- Pro+ 8.50€ Bald verfügbar:', rootHtml.includes('Bald verfügbar (8,50 €)'));
  console.log('- Legal links on actanex.app:', rootHtml.includes('https://actanex.app/impressum') && rootHtml.includes('https://actanex.app/datenschutz'));
  console.log('- Provider name present:', rootHtml.includes('Michael Kirst-Neshva'));
  console.log('- Disclaimer present:', rootHtml.includes('Keine Steuer- oder Rechtsberatung'));

  console.log('\nClaim checks:');
  console.log('- Login button absent:', !claimHtml.includes('Zum Login') && !claimHtml.includes('Login / Portal'));
  console.log('- Free default selected:', claimHtml.includes('radio-free') && claimHtml.includes('checked'));
  console.log('- Managed Demnächst verfügbar:', claimHtml.includes('Demnächst verfügbar'));
}

async function run() {
  await checkAll();
  await verifyContent();
}

run();
