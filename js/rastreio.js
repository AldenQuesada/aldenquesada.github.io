/* ------------------------------------------------------------------
   RASTREIO
   Mesma arquitetura da pagina de venda do quiz: o banco e a fonte de
   verdade, e nao depende de pixel, de bloqueador nem de cookie aceito.

   Os eventos vao para a tabela quiz_events do Supabase do Instituto,
   com prefixo proprio, do mesmo jeito que os da TSL usam 'tsl_'. O
   prefixo e o metadata.site separam as paginas na hora de ler.

   O que e medido:
     view     chegada, com UTM, referencia, tela, dispositivo e idioma
     scroll   25, 50, 75 e 100 por cento, cada um uma vez
     bloco    cada secao vista, com o segundo em que foi vista
     click    todo clique em link, com coordenada para mapa de calor
     morto    clique que nao acertou nada, que e sinal de frustracao
     tempo    segundos com a aba a vista, nao com a aba aberta
     saida    como a pessoa saiu e ate onde tinha chegado

   Nada de dado de saude aqui. Esta pagina nao coleta nenhum.
------------------------------------------------------------------ */

window.Rastreio = (function () {

  var cfg = null, sessao = '', inicio = Date.now();
  var interno = false, feitos = {};
  var visivelDesde = Date.now(), visivelTotal = 0, rolouMax = 0, blocoFundo = '';
  var tempoEnviado = -1, cliques = 0;

  function agora() { return Date.now(); }
  function seg()   { return Math.round((agora() - inicio) / 1000); }

  /* Uma vez so. Serve para marco de rolagem e para bloco visto. */
  function uma(chave, fn) { if (feitos[chave]) return; feitos[chave] = 1; fn(); }

  /* keepalive faz o envio sobreviver a pagina fechando, que e
     exatamente quando o tempo de permanencia e mandado. */
  function gravar(tipo, meta, manter) {
    if (!cfg || !cfg.quizId) return;
    var m = meta || {};
    m.site = cfg.site;
    if (interno) m.interno = true;
    try {
      fetch(cfg.url + '/rest/v1/quiz_events', {
        method: 'POST',
        keepalive: !!manter,
        headers: {
          apikey: cfg.anon,
          Authorization: 'Bearer ' + cfg.anon,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal'
        },
        body: JSON.stringify({
          quiz_id: cfg.quizId,
          session_id: sessao,
          tipo: cfg.prefixo + tipo,
          metadata: m
        })
      }).catch(function () {});
    } catch (e) {}
  }

  /* A sessao atravessa as paginas do site: quem veio do link da bio
     para a mentoria continua sendo a mesma pessoa na leitura. */
  function pegarSessao() {
    var chave = 'bio_sessao';
    try {
      var s = sessionStorage.getItem(chave);
      if (s) return s;
      s = 'b-' + agora() + '-' + Math.random().toString(36).slice(2, 9);
      sessionStorage.setItem(chave, s);
      return s;
    } catch (e) {
      return 'b-' + agora() + '-' + Math.random().toString(36).slice(2, 9);
    }
  }

  function dispositivo() {
    var l = window.innerWidth;
    return l < 640 ? 'movil' : l < 1024 ? 'tablet' : 'escritorio';
  }

  /* Tempo conta so com a aba a vista: aba esquecida atras de outra nao
     e leitura. Vai o acumulado; na analise vale o maior por sessao. */
  function enviarTempo(motivo) {
    if (visivelDesde) { visivelTotal += agora() - visivelDesde; visivelDesde = 0; }
    var s = Math.round(visivelTotal / 1000);
    if (s === tempoEnviado) return;
    tempoEnviado = s;
    gravar('tempo', {
      segundos: s, rolou: rolouMax, bloco_final: blocoFundo,
      clics: cliques, motivo: motivo || 'oculto'
    }, true);
  }

  function medirRolagem() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    if (h <= 0) return;
    var pct = Math.min(100, Math.round(window.scrollY / h * 100));
    if (pct > rolouMax) rolouMax = pct;
    [25, 50, 75, 100].forEach(function (m) {
      if (pct >= m) uma('rolou' + m, function () {
        gravar('scroll', { pct: m, segundos: seg() });
      });
    });
  }

  var io = null;
  function observarBlocos() {
    if (!('IntersectionObserver' in window)) return;
    /* Pode ser chamado de novo quando a pagina termina de montar: o
       conteudo vem de JSON, entao na primeira passada ainda nao existe
       bloco nenhum para observar. observe() repetido no mesmo no e
       ignorado pelo navegador, entao chamar duas vezes e seguro. */
    if (io) {
      document.querySelectorAll('[data-bloco]').forEach(function (n) { io.observe(n); });
      return;
    }
    /* Conta quando o bloco cruza a linha do meio da tela. "Metade do
       bloco visivel" nunca acontece com bloco mais alto que a tela do
       celular, e assim as secoes maiores ficariam de fora. */
    io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var b = e.target.getAttribute('data-bloco');
        blocoFundo = b;
        uma('bloco-' + b, function () {
          gravar('bloco', { bloco: b, segundos: seg() });
        });
      });
    }, { rootMargin: '-50% 0px -50% 0px', threshold: 0 });
    document.querySelectorAll('[data-bloco]').forEach(function (n) { io.observe(n); });
  }

  function ligarCliques() {
    document.addEventListener('click', function (ev) {
      var a = ev.target.closest && ev.target.closest('a[href]');
      /* Coordenada em porcentagem da pagina inteira, nao da tela: e o
         que permite montar o mapa de calor independente do aparelho. */
      var doc = document.documentElement;
      var x = Math.round((ev.pageX / doc.scrollWidth) * 1000) / 10;
      var y = Math.round((ev.pageY / doc.scrollHeight) * 1000) / 10;

      if (!a) {
        /* Clique que nao acertou nada. Em quantidade, mostra onde a
           pessoa achou que havia um botao e nao havia. */
        cliques++;
        gravar('morto', { x: x, y: y, segundos: seg(), rolou: rolouMax });
        return;
      }

      cliques++;
      var dono = a.closest('[data-bloco]');
      gravar('click', {
        destino: a.href.slice(0, 180),
        id: a.dataset.id || a.getAttribute('data-id') || '',
        texto: (a.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 70),
        bloco: dono ? dono.getAttribute('data-bloco') : '',
        x: x, y: y,
        segundos: seg(), rolou: rolouMax
      }, true);
    }, true);
  }

  return {
    iniciar: function (o) {
      cfg = o || {};
      cfg.prefixo = cfg.prefixo || 'bio_';
      cfg.site    = cfg.site || 'linkbio';
      sessao = pegarSessao();

      var url = new URLSearchParams(location.search);

      /* Lido ANTES do primeiro registro, senao a propria visita de
         teste entraria como trafego real. ?interno=1 marca o navegador
         e ?interno=0 desmarca. Mesma chave da pagina de venda. */
      try {
        if (url.get('interno') !== null) {
          if (url.get('interno') === '0') localStorage.removeItem('insonia_interno');
          else localStorage.setItem('insonia_interno', '1');
        }
        interno = localStorage.getItem('insonia_interno') === '1';
      } catch (e) {}

      var utm = {};
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
       'fbclid', 'gclid', 'ttclid'].forEach(function (k) {
        if (url.get(k)) utm[k] = url.get(k).slice(0, 120);
      });

      gravar('view', {
        utm: utm,
        ref: (document.referrer || '').slice(0, 180),
        tela: window.innerWidth + 'x' + window.innerHeight,
        dispositivo: dispositivo(),
        idioma: (navigator.language || '').slice(0, 10),
        ruta: location.pathname
      });

      window.addEventListener('scroll', medirRolagem, { passive: true });
      medirRolagem();
      observarBlocos();
      ligarCliques();

      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') enviarTempo('oculto');
        else visivelDesde = agora();
      });
      window.addEventListener('pagehide', function () { enviarTempo('salida'); });

      /* O conteudo chega depois, por fetch. Quando o render avisa que
         terminou, os blocos passam a ser observados de verdade. */
      document.addEventListener('pagina:pronta', observarBlocos);
    },

    /* Para a pagina avisar de algo proprio, como abrir uma pergunta do
       FAQ ou trocar o quadro do carrossel. */
    evento: function (tipo, meta) { gravar(tipo, meta || {}); }
  };

})();
