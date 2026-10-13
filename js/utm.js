/* ------------------------------------------------------------------
   UTM
   Quem chega pelo Instagram carrega utm_source. Esse rastro precisa
   chegar ate o checkout, senao a venda aparece como "direta" e a
   pagina fica sem credito nenhum.

   Mas so ESSE rastro viaja. Antes qualquer parametro da URL de entrada
   era repassado ao destino, e o Instagram manda muita coisa: uma volta
   pelo anuncio chegava ao checkout com dez parametros pendurados,
   feios na barra de endereco e inuteis para a analise.

   A entrada e guardada na sessao: se a pessoa voltar pelo botao do
   navegador e a URL perder os parametros, o rastro continua de pe.
------------------------------------------------------------------ */

window.UTM = (function () {

  const CHAVE = 'linkbio_utm';

  /* Lista fechada: so estes viajam. O que nao esta aqui fica na porta.
       utm_*   origem da campanha, que e o que o painel le
       fbclid  o clique do anuncio da Meta
       gclid   o do Google
       ttclid  o do TikTok
     'interno' NAO entra de proposito: ele marca visita de teste, e
     propagado faria uma venda real chegar marcada como teste. */
  const PERMITIDOS = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
    'fbclid', 'gclid', 'ttclid'
  ];

  const LIMITE = 160;   // valor mais longo que isso e lixo, nao rastro

  function capturar() {
    const entrada = new URLSearchParams(location.search);
    const guardado = {};

    PERMITIDOS.forEach(chave => {
      const valor = entrada.get(chave);
      if (valor) guardado[chave] = valor.slice(0, LIMITE);
    });

    if (Object.keys(guardado).length) {
      try { sessionStorage.setItem(CHAVE, JSON.stringify(guardado)); } catch (e) { /* modo privado */ }
      return guardado;
    }

    try { return JSON.parse(sessionStorage.getItem(CHAVE) || '{}'); } catch (e) { return {}; }
  }

  const rastro = capturar();

  /* Acrescenta o rastro a um link de saida.
     Parametro que o destino ja traz vence: o link mandou, nao mexemos. */
  function aplicar(destino) {
    if (!destino) return destino;
    if (!/^https?:/i.test(destino)) return destino;
    if (!Object.keys(rastro).length) return destino;

    let url;
    try { url = new URL(destino); } catch (e) { return destino; }

    for (const chave in rastro) {
      if (!url.searchParams.has(chave)) url.searchParams.set(chave, rastro[chave]);
    }

    return url.toString();
  }

  return { aplicar, rastro };

})();
