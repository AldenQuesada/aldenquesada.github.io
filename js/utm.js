/* ------------------------------------------------------------------
   UTM
   Quem chega pelo Instagram carrega utm_source=bio-ig. Esse rastro
   precisa chegar ate o checkout, senao a venda aparece como "direta"
   e a pagina fica sem credito nenhum.

   A entrada e guardada na sessao: se a pessoa voltar pelo botao do
   navegador e a URL perder os parametros, o rastro continua de pe.
------------------------------------------------------------------ */

window.UTM = (function () {

  const CHAVE = 'linkbio_utm';

  // Parametros que sao da pagina, nao da campanha. Nunca saem daqui.
  const INTERNOS = ['rascunho'];

  function capturar() {
    const entrada = new URLSearchParams(location.search);
    const guardado = {};

    for (const [chave, valor] of entrada) {
      if (INTERNOS.includes(chave)) continue;
      if (!valor) continue;
      guardado[chave] = valor;
    }

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
