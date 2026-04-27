const axios = require('axios');
const { NUVEMSHOP_TOKEN, NUVEMSHOP_STORE_ID, MEDIA_HISTORICA_PEDIDOS } = require('../config/env');

async function getSales() {
  const response = await axios.get(
    `https://api.nuvemshop.com.br/v1/${NUVEMSHOP_STORE_ID}/orders`,
    {
      headers: {
        Authentication: `bearer ${NUVEMSHOP_TOKEN}`,
        'User-Agent': 'SG-Monitor/1.0',
      },
      params: {
        per_page: 200,
        fields: 'id,created_at,status',
      },
    }
  );

  const agora = new Date();
  const pedidosUltimaHora = response.data.filter((p) => {
    const criado = new Date(p.created_at);
    return agora - criado < 3_600_000;
  });

  const quedaBrusca = pedidosUltimaHora.length < MEDIA_HISTORICA_PEDIDOS * 0.4;
  const semPedidos = pedidosUltimaHora.length === 0;

  let statusVendas;
  if (semPedidos) statusVendas = 'ERRO';
  else if (quedaBrusca) statusVendas = 'ALERTA';
  else statusVendas = 'OK';

  return {
    pedidosUltimaHora: pedidosUltimaHora.length,
    mediaHistorica: MEDIA_HISTORICA_PEDIDOS,
    statusVendas,
  };
}

module.exports = getSales;
