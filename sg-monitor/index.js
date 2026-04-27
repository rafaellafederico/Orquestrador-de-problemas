const testPromo = require('./monitor/promoTest');
const testFrete = require('./monitor/freteTest');
const testCheckout = require('./monitor/checkoutTest');
const getSales = require('./monitor/salesCheck');
const analisar = require('./services/claude');
const sendAlert = require('./services/whatsapp');

async function run() {
  console.log(`[${new Date().toISOString()}] Iniciando monitoramento SG...`);

  const [promo, frete, checkout, sales] = await Promise.all([
    testPromo(),
    testFrete(),
    testCheckout(),
    getSales(),
  ]);

  console.log('Resultados brutos:', { promo, frete, checkout, sales });

  const resultado = await analisar({
    promo: promo.promoAplicada,
    frete: frete.freteOk,
    tempo: checkout.tempo,
    pedidos: sales.pedidosUltimaHora,
    mediaHistorica: sales.mediaHistorica,
    statusVendas: sales.statusVendas,
  });

  console.log('\n=== DIAGNÓSTICO ===\n');
  console.log(resultado);
  console.log('\n==================\n');

  const temErro = resultado.includes('ERRO CRÍTICO') || resultado.includes('ERRO');
  const temAlerta = resultado.includes('ALERTA');

  if (temErro || temAlerta) {
    await sendAlert(resultado);
    console.log('Alerta enviado via WhatsApp.');
  }
}

run().catch((err) => {
  console.error('Falha no monitoramento:', err.message);
  process.exit(1);
});
