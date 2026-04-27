const { chromium } = require('playwright');
const { SITE_URL } = require('../config/env');

async function testPromo() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto(SITE_URL);

    // Adiciona 2 unidades do mesmo produto ao carrinho
    await page.click('.produto-item:first-child .btn-adicionar');
    await page.click('.produto-item:first-child .btn-adicionar');

    await page.goto(`${SITE_URL}/carrinho`);

    const totalText = await page.locator('.total-carrinho').innerText();
    const descontoVisivel = await page.locator('.desconto-promo').isVisible().catch(() => false);

    return {
      promoAplicada: descontoVisivel || totalText.toLowerCase().includes('desconto'),
      detalhes: totalText,
    };
  } catch (err) {
    return { promoAplicada: false, erro: err.message };
  } finally {
    await browser.close();
  }
}

module.exports = testPromo;
