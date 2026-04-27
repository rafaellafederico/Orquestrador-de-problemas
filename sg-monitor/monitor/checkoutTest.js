const { chromium } = require('playwright');
const { SITE_URL } = require('../config/env');

async function testCheckout() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    const start = Date.now();
    await page.goto(`${SITE_URL}/checkout`, { waitUntil: 'domcontentloaded' });
    const tempo = (Date.now() - start) / 1000;

    let status;
    if (tempo < 3) status = 'OK';
    else if (tempo <= 6) status = 'ALERTA';
    else status = 'ERRO';

    return { tempo, status };
  } catch (err) {
    return { tempo: null, status: 'ERRO', erro: err.message };
  } finally {
    await browser.close();
  }
}

module.exports = testCheckout;
