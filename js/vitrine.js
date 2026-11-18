/* ------------------------------------------------------------------
   VITRINE
   Pagina de link de bio de uma conta que nao e o perfil principal
   (clipagem, parceria). Cada vitrine tem sua pasta de dados e seu id.

   O link e SEMPRE o mesmo em todas as redes da conta. Para a medicao
   saber de onde a pessoa veio, esta folha carimba a URL de chegada
   ANTES de qualquer outro script ler os parametros:

     utm_source   instagram, tiktok, facebook, youtube ou directo,
                  lido do navegador interno do app (ou do referer)
     utm_medium   bio
     utm_campaign o id da vitrine (window.VITRINE.id)
     utm_content  ?c=<conta>, opcional, para separar duas contas da
                  mesma vitrine na mesma rede

   utm_campaign e utm_content SAO da vitrine e sempre se sobrepoem: o
   proprio Instagram acrescenta utm_campaign=link-bio e
   utm_content=link_in_bio a todo link de bio, e deixar isso passar
   misturaria a conta nova com o perfil principal. utm_source que ja
   veio (o Instagram manda 'instagram') e mantido. utm.js, rastreio.js
   e os quizzes leem a URL carimbada, e o rastro viaja ate o checkout.
------------------------------------------------------------------ */

(function () {
  var V = window.VITRINE;
  if (!V || !V.id) return;

  function rede() {
    var ua = navigator.userAgent || '';
    var ref = '';
    try { ref = new URL(document.referrer).hostname; } catch (e) {}
    if (/Instagram/i.test(ua) || /instagram\.com$/.test(ref)) return 'instagram';
    if (/musical_ly|BytedanceWebview|TikTok|trill/i.test(ua) || /tiktok\.com$/.test(ref)) return 'tiktok';
    if (/FBAN|FBAV|FB_IAB/i.test(ua) || /facebook\.com$/.test(ref)) return 'facebook';
    if (/youtube\.com$/.test(ref)) return 'youtube';
    return 'directo';
  }

  var url;
  try { url = new URL(location.href); } catch (e) { return; }
  var q = url.searchParams;
  var mudou = false;
  function por(k, v) { if (v && !q.get(k)) { q.set(k, v); mudou = true; } }

  por('utm_source', rede());
  por('utm_medium', 'bio');
  function fixo(k, v) {
    if ((q.get(k) || '') === (v || '')) return;
    if (v) q.set(k, v); else q.delete(k);
    mudou = true;
  }
  fixo('utm_campaign', V.id);
  var conta = (q.get('c') || '').toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 40);
  fixo('utm_content', conta);

  if (mudou) {
    try { history.replaceState(history.state, '', url.toString()); } catch (e) {}
  }
})();
