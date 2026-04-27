const { chromium } = require('playwright');
const { SITE_URL, CEP_BASE } = require('../config/env');

async function testFrete() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto(`${SITE_URL}/carrinho`);

    await page.fill('#cep', CEP_BASE);
    await page.click('#calcular-frete');

    // Aguarda até 8s pelo resultado do frete
    await page.waitForSelector('.frete-valor', { timeout: 8000 });

    const frete = await page.locator('.frete-valor').innerText();

    return {
      freteOk: Boolean(frete && frete.trim().length > 0),
      valor: frete,
    };
  } catch (err) {
    return { freteOk: false, erro: err.message };
  } finally {
    await browser.close();
  }
}

module.exports = testFrete;
