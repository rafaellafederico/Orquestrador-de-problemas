const axios = require('axios');
const { CLAUDE_KEY } = require('../config/env');

async function analisar(data) {
  const prompt = `Você é um sistema de monitoramento de e-commerce. Analise os dados abaixo e retorne um diagnóstico no formato exato especificado.

DADOS DO MONITORAMENTO:
- Promoção "compre 2 pague 1" aplicada: ${data.promo}
- Frete calculado com sucesso: ${data.frete}
- Tempo de carregamento do checkout: ${data.tempo}s
- Pedidos na última hora: ${data.pedidos}
- Média histórica de pedidos/hora: ${data.mediaHistorica}
- Status das vendas: ${data.statusVendas}

REGRAS DE CLASSIFICAÇÃO:
- Promoção não aplicada → ERRO CRÍTICO
- Frete com erro → ERRO CRÍTICO
- Checkout < 3s → OK | 3–6s → ALERTA | > 6s → ERRO
- Falha no pagamento → ERRO CRÍTICO
- Zero pedidos na última hora → ERRO | Queda > 60% da média → ALERTA

Retorne EXATAMENTE neste formato:

STATUS: [OK / ALERTA / ERRO CRÍTICO]

PROBLEMAS:
- [liste cada problema encontrado, ou "Nenhum" se tudo estiver OK]

AÇÃO RECOMENDADA:
- [ação direta e prática para cada problema, ou "Manter monitoramento padrão" se tudo OK]`;

  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    },
    {
      headers: {
        'x-api-key': CLAUDE_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
    }
  );

  return response.data.content[0].text;
}

module.exports = analisar;
