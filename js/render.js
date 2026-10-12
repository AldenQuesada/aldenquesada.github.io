/* ------------------------------------------------------------------
   RENDER
   Le dados/perfil.json e dados/cards.json e monta a pagina.
   Nenhuma copy, nenhum link e nenhuma cor moram aqui.
   Para mudar a pagina, mexe no JSON. Este arquivo fica quieto.
------------------------------------------------------------------ */

(function () {

  const rascunho = new URLSearchParams(location.search).get('rascunho') === '1';

  /* Tempo que cada slide do carrossel fica na tela. */
  const CARROSSEL_MS = 3400;

  /* Versao das imagens. Trocar o conteudo de um arquivo sem trocar o
     nome faz o navegador continuar servindo a imagem velha do cache:
     quem ja visitou nao ve a troca. Este numero entra como parametro em
     toda imagem e resolve isso.
     AO TROCAR QUALQUER IMAGEM EM img/, SUBA ESTE NUMERO. */
  const VERSAO_IMAGENS = 3;

  function versionar(src) {
    if (!src || /^(https?:|data:)/i.test(src)) return src;
    return src + (src.includes('?') ? '&' : '?') + 'a=' + VERSAO_IMAGENS;
  }

  const alvos = {
    perfil:  document.getElementById('perfil'),
    vitrine: document.getElementById('vitrine'),
    pie:     document.getElementById('pie')
  };

  /* Desenho de cada rede. Para acrescentar uma, basta o caminho do SVG
     (viewBox 24x24) com a chave no mesmo nome usado no JSON. */
  const ICONES = {
    instagram: 'M12 2.2c3.2 0 3.6 0 4.9.07 1.2.05 1.8.25 2.2.42.6.22 1 .48 1.4.9.43.42.7.82.92 1.4.17.42.37 1.06.42 2.25.06 1.28.07 1.66.07 4.9s0 3.6-.07 4.9c-.05 1.2-.25 1.8-.42 2.2-.22.6-.49 1-.91 1.4-.42.43-.82.7-1.4.92-.42.17-1.06.37-2.25.42-1.28.06-1.66.07-4.9.07s-3.6 0-4.9-.07c-1.2-.05-1.8-.25-2.2-.42-.6-.22-1-.49-1.4-.91-.43-.42-.7-.82-.92-1.4-.17-.42-.37-1.06-.42-2.25C2.21 15.6 2.2 15.2 2.2 12s0-3.6.07-4.9c.05-1.2.25-1.8.42-2.2.22-.6.49-1 .91-1.4.42-.43.82-.7 1.4-.92.42-.17 1.06-.37 2.25-.42C8.4 2.21 8.8 2.2 12 2.2zm0 1.98c-3.17 0-3.55 0-4.8.07-1.15.05-1.78.25-2.2.41-.55.22-.95.47-1.36.88-.41.41-.66.8-.88 1.36-.16.42-.36 1.05-.41 2.2-.06 1.25-.07 1.63-.07 4.8s0 3.55.07 4.8c.05 1.15.25 1.78.41 2.2.22.55.47.95.88 1.36.41.41.8.66 1.36.88.42.16 1.05.36 2.2.41 1.25.06 1.63.07 4.8.07s3.55 0 4.8-.07c1.15-.05 1.78-.25 2.2-.41.55-.22.95-.47 1.36-.88.41-.41.66-.8.88-1.36.16-.42.36-1.05.41-2.2.06-1.25.07-1.63.07-4.8s0-3.55-.07-4.8c-.05-1.15-.25-1.78-.41-2.2a3.6 3.6 0 0 0-.88-1.36 3.6 3.6 0 0 0-1.36-.88c-.42-.16-1.05-.36-2.2-.41-1.25-.06-1.63-.07-4.8-.07zm0 3.37a5.45 5.45 0 1 1 0 10.9 5.45 5.45 0 0 1 0-10.9zm0 8.99a3.54 3.54 0 1 0 0-7.08 3.54 3.54 0 0 0 0 7.08zm6.94-9.2a1.27 1.27 0 1 1-2.55 0 1.27 1.27 0 0 1 2.55 0z',
    youtube:   'M21.6 7.2a2.5 2.5 0 0 0-1.76-1.77C18.25 5 12 5 12 5s-6.25 0-7.84.43A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.76 1.77C5.75 19 12 19 12 19s6.25 0 7.84-.43a2.5 2.5 0 0 0 1.76-1.77A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15.2V8.8l5.5 3.2-5.5 3.2z',
    whatsapp:  'M12.04 2A9.9 9.9 0 0 0 2.1 11.9a9.8 9.8 0 0 0 1.35 4.96L2 22l5.3-1.39a9.9 9.9 0 0 0 4.73 1.2h.01a9.9 9.9 0 0 0 9.9-9.9A9.9 9.9 0 0 0 12.04 2zm0 18.05a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.1.81.83-3.03-.2-.31a8.2 8.2 0 1 1 6.96 3.86zm4.5-6.15c-.24-.12-1.46-.72-1.68-.8-.23-.09-.39-.13-.56.12-.16.24-.64.8-.78.97-.15.16-.29.18-.53.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.23-1.46-1.37-1.7-.15-.25-.02-.38.1-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.09-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.16 0-.43.06-.65.3-.23.25-.86.84-.86 2.05s.88 2.38 1 2.55c.13.16 1.74 2.65 4.2 3.72.59.25 1.05.4 1.4.52.59.18 1.13.16 1.55.1.48-.07 1.46-.6 1.66-1.18.21-.57.21-1.07.15-1.17-.06-.11-.22-.17-.46-.29z',
    tiktok:    'M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.1v12.4a2.59 2.59 0 1 1-2.59-2.6c.27 0 .53.05.78.13v-3.2a5.78 5.78 0 0 0-.78-.05A5.72 5.72 0 1 0 15.56 15V8.9a7.35 7.35 0 0 0 4.3 1.38V7.17a4.3 4.3 0 0 1-3.26-1.35z',
    facebook:  'M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99A10 10 0 0 0 22 12z',
    telegram:  'M21.9 5.4 18.9 19c-.22 1-.82 1.25-1.66.78l-4.6-3.39-2.22 2.14c-.25.25-.45.45-.92.45l.33-4.68 8.52-7.7c.37-.33-.08-.51-.57-.18L7.26 13.07l-4.53-1.42c-.99-.31-1-.99.2-1.46L20.63 3.9c.82-.3 1.54.2 1.27 1.5z'
  };


  /* --- utilitarios --- */

  function el(tag, classe, texto) {
    const n = document.createElement(tag);
    if (classe) n.className = classe;
    if (texto != null) n.textContent = texto;
    return n;
  }

  function svgIcone(nome, classe) {
    const caminho = ICONES[(nome || '').toLowerCase()];
    if (!caminho) return null;
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'currentColor');
    svg.setAttribute('aria-hidden', 'true');
    if (classe) svg.setAttribute('class', classe);
    const p = document.createElementNS(ns, 'path');
    p.setAttribute('d', caminho);
    svg.appendChild(p);
    return svg;
  }

  function seloVerificado() {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('class', 'perfil__selo');
    svg.setAttribute('aria-label', 'verificado');
    const estrela = document.createElementNS(ns, 'path');
    estrela.setAttribute('fill', '#3797f0');
    estrela.setAttribute('d', 'M12 1.5l2.4 2.1 3.2-.3.9 3.1 2.8 1.6-1.3 2.9 1.3 2.9-2.8 1.6-.9 3.1-3.2-.3L12 22.5l-2.4-2.1-3.2.3-.9-3.1-2.8-1.6L4 13.1 2.7 10.2l2.8-1.6.9-3.1 3.2.3z');
    const risco = document.createElementNS(ns, 'path');
    risco.setAttribute('fill', '#fff');
    risco.setAttribute('d', 'M10.8 15.3l-3-3 1.3-1.3 1.7 1.7 4.1-4.1 1.3 1.3z');
    svg.append(estrela, risco);
    return svg;
  }

  async function carregar(arquivo) {
    const r = await fetch(arquivo + '?v=' + Date.now());
    if (!r.ok) throw new Error('No se pudo cargar ' + arquivo + ' (' + r.status + ')');
    return r.json();
  }

  function temLink(item) {
    return typeof item.link === 'string' && /^https?:/i.test(item.link.trim());
  }

  /* Prepara um <a> de saida: UTM propagada, nova aba, gancho de medicao. */
  function ligar(a, item) {
    a.href = UTM.aplicar(item.link.trim());
    if (item.nova_aba !== false) {
      a.target = '_blank';
      a.rel = 'noopener';
    }
    a.addEventListener('click', function () {
      document.dispatchEvent(new CustomEvent('bloco:clique', {
        detail: { id: item.id, titulo: item.titulo || item.nome, link: item.link }
      }));
    });
  }

  function reserva(img) {
    img.addEventListener('error', function () {
      if (img.dataset.reserva) return;
      img.dataset.reserva = '1';
      img.src = versionar('img/dr/reserva.svg');
    });
  }


  /* --- perfil --- */

  /* A inicial de cada palavra da assinatura sai maior que o resto, como
     em assinatura escrita a mao: o A e o Q comandam, o resto acompanha. */
  function assinaturaComIniciais(texto, titulo) {
    const p = el('p', 'perfil__assinatura');
    if (titulo) p.appendChild(el('span', 'perfil__dr', titulo));
    texto.split(/(\s+)/).forEach(parte => {
      if (!parte.trim()) {
        p.appendChild(document.createTextNode(parte));
        return;
      }
      p.appendChild(el('span', 'perfil__inicial', parte.charAt(0)));
      if (parte.length > 1) p.appendChild(document.createTextNode(parte.slice(1)));
    });
    return p;
  }

  function montarPerfil(p) {
    if (!p || p.mostrar === false) return;
    const alvo = alvos.perfil;

    if (p.assinatura) alvo.appendChild(assinaturaComIniciais(p.assinatura, p.assinatura_titulo));

    if (p.avatar) {
      const img = el('img', 'perfil__avatar');
      img.src = versionar(p.avatar);
      img.alt = p.nome || '';
      img.fetchPriority = 'high';
      reserva(img);
      alvo.appendChild(img);
    }

    if (p.nome) {
      const h1 = el('h1', 'perfil__nome');
      h1.appendChild(document.createTextNode(p.nome));
      if (p.verificado === true) h1.appendChild(seloVerificado());
      alvo.appendChild(h1);
    }

    if (p.credencial) alvo.appendChild(el('p', 'perfil__credencial', p.credencial));

    alvo.hidden = false;
    if (p.nome) document.title = p.nome;
  }


  /* --- pecas do card --- */

  /* O titulo termina com um ponto na cor de acento. Se o texto ja vier
     com ponto, usamos o dele; senao, acrescentamos um. */
  function tituloComPonto(texto) {
    const h2 = el('h2', 'card__titulo');
    const corpo = texto.replace(/\s*\.\s*$/, '');
    h2.appendChild(document.createTextNode(corpo));
    h2.appendChild(el('span', 'card__ponto', '.'));
    return h2;
  }

  /* A descricao aceita [[trecho]] para realce. Montada com nos de texto,
     nunca com innerHTML: o JSON nao pode injetar marcacao na pagina. */
  function descricaoComRealce(texto) {
    const p = el('p', 'card__desc');
    texto.split(/(\[\[[^\]]*\]\])/).forEach(parte => {
      if (!parte) return;
      if (parte.startsWith('[[') && parte.endsWith(']]')) {
        p.appendChild(el('em', null, parte.slice(2, -2)));
      } else {
        p.appendChild(document.createTextNode(parte));
      }
    });
    return p;
  }

  /* Metade da imagem do card. Com uma foto so, e uma <img>. Com varias,
     vira carrossel: os slides se alternam sozinhos, por fade.

     Ele so roda quando o card esta na tela e a aba esta visivel. Carrossel
     girando fora de vista gasta bateria e nao e visto por ninguem. */
  function montarImagem(card) {
    const fotos = (card.fotos && card.fotos.length ? card.fotos : [card.foto]).filter(Boolean);
    const caixa = el('div', 'card__img');
    if (!fotos.length) return caixa;

    const parado = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const varias = fotos.length > 1 && !parado;

    (varias ? fotos : fotos.slice(0, 1)).forEach((src, i) => {
      const img = el('img');
      img.src = versionar(src);
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      img.loading = i === 0 ? 'lazy' : 'lazy';
      img.decoding = 'async';
      if (varias && i === 0) img.classList.add('ativo');
      reserva(img);
      caixa.appendChild(img);
    });

    if (!varias) return caixa;

    caixa.classList.add('card__img--carrossel');

    const pontos = el('div', 'card__pontos');
    fotos.forEach((_, i) => {
      const p = el('span', 'card__ponto-slide');
      if (i === 0) p.classList.add('ativo');
      pontos.appendChild(p);
    });
    caixa.appendChild(pontos);

    const slides = caixa.querySelectorAll('img');
    const marcas = pontos.children;
    let atual = 0, relogio = null;

    function avancar() {
      slides[atual].classList.remove('ativo');
      marcas[atual].classList.remove('ativo');
      atual = (atual + 1) % slides.length;
      slides[atual].classList.add('ativo');
      marcas[atual].classList.add('ativo');
    }

    const ligar  = () => { if (!relogio) relogio = setInterval(avancar, CARROSSEL_MS); };
    const parar  = () => { clearInterval(relogio); relogio = null; };

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entradas => {
        entradas[0].isIntersecting && !document.hidden ? ligar() : parar();
      }, { threshold: 0.35 }).observe(caixa);
    } else {
      ligar();
    }

    document.addEventListener('visibilitychange', () => {
      document.hidden ? parar() : null;
    });

    return caixa;
  }


  /* Triangulo de play, solido e sem circulo, como na referencia. */
  function botaoPlay() {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('class', 'card__play');
    svg.setAttribute('aria-hidden', 'true');
    const p = document.createElementNS(ns, 'path');
    p.setAttribute('fill', 'currentColor');
    p.setAttribute('d', 'M6 3.5v17l15-8.5z');
    svg.appendChild(p);
    return svg;
  }

  /* Logotipo da plataforma: o simbolo mais a palavra, como a marca se
     apresenta. Desenhado em SVG para ficar nitido em qualquer tela e
     acompanhar a cor do card. */
  const LOGOS = {
    youtube: function () {
      const ns = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('viewBox', '0 0 138 28');
      svg.setAttribute('class', 'card__logo');
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', 'YouTube');

      const caixa = document.createElementNS(ns, 'path');
      caixa.setAttribute('fill', '#ff0033');
      caixa.setAttribute('d', 'M38.6 4.4a5 5 0 0 0-3.5-3.5C32 0 20 0 20 0S8 0 4.9.9A5 5 0 0 0 1.4 4.4 52 52 0 0 0 .5 14c0 3.3.3 6.5.9 9.6a5 5 0 0 0 3.5 3.5C8 28 20 28 20 28s12 0 15.1-.9a5 5 0 0 0 3.5-3.5c.6-3.1.9-6.3.9-9.6s-.3-6.5-.9-9.6z');
      const play = document.createElementNS(ns, 'path');
      play.setAttribute('fill', '#fff');
      play.setAttribute('d', 'M16 20V8l10 6z');

      const palavra = document.createElementNS(ns, 'text');
      palavra.setAttribute('x', '46');
      palavra.setAttribute('y', '21');
      palavra.setAttribute('fill', 'currentColor');
      palavra.setAttribute('font-family', "'Inter', system-ui, sans-serif");
      palavra.setAttribute('font-size', '21');
      palavra.setAttribute('font-weight', '800');
      palavra.setAttribute('letter-spacing', '-1.1');
      palavra.textContent = 'YouTube';

      svg.append(caixa, play, palavra);
      return svg;
    }
  };

  function marcaDaRede(nome, cor) {
    const caixa = el('div', 'card__marca');
    if (cor) caixa.style.setProperty('--cor-marca', cor);
    const icone = svgIcone(nome);
    if (icone) caixa.appendChild(icone);
    return icone ? caixa : null;
  }


  function aneisDecorativos() {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 120 84');
    svg.setAttribute('class', 'card__aneis');
    svg.setAttribute('aria-hidden', 'true');
    [[60, 42, 58, 40], [60, 42, 42, 29], [60, 42, 26, 18]].forEach(([cx, cy, rx, ry]) => {
      const e = document.createElementNS(ns, 'ellipse');
      e.setAttribute('cx', cx); e.setAttribute('cy', cy);
      e.setAttribute('rx', rx); e.setAttribute('ry', ry);
      e.setAttribute('fill', 'none');
      e.setAttribute('stroke', 'currentColor');
      e.setAttribute('stroke-width', '1');
      svg.appendChild(e);
    });
    return svg;
  }


  /* --- um card --- */

  function montarCard(card) {
    const pendente = !temLink(card);

    const a = el('a', 'card');
    a.dataset.lado = card.lado_da_foto || 'esquerda';
    a.dataset.id   = card.id || '';
    a.dataset.bloco = card.id || '';
    if (card.estilo) a.dataset.estilo = card.estilo;

    a.style.setProperty('--cor-card', card.cor || '#1c1208');
    if (card.acento) a.style.setProperty('--acento', card.acento);

    if (pendente) {
      a.classList.add('card--pendente');
      a.href = '#';
      a.setAttribute('aria-disabled', 'true');
      a.addEventListener('click', e => e.preventDefault());
    } else {
      ligar(a, card);
    }

    const inner = el('div', 'card__inner');
    inner.appendChild(montarImagem(card));

    const texto = el('div', 'card__texto');

    if (card.estilo === 'canal') {
      // Play a esquerda, nome a direita: o card de canal nao tem
      // sobretitulo nem descricao, so o convite.
      texto.appendChild(botaoPlay());
      const bloco = el('div');
      if (card.logo && LOGOS[card.logo]) bloco.appendChild(LOGOS[card.logo]());
      else if (card.selo)                bloco.appendChild(el('span', 'card__selo', card.selo));
      if (card.titulo) bloco.appendChild(tituloComPonto(card.titulo));
      texto.appendChild(bloco);
    } else {
      if (card.titulo)      texto.appendChild(tituloComPonto(card.titulo));
      if (card.sobretitulo) texto.appendChild(el('p', 'card__sobretitulo', card.sobretitulo));
      if (card.descricao)   texto.appendChild(descricaoComRealce(card.descricao));
      texto.appendChild(aneisDecorativos());
    }

    inner.appendChild(texto);

    if (card.marca) {
      const m = marcaDaRede(card.marca, card.marca_cor);
      if (m) inner.appendChild(m);
    }

    a.appendChild(inner);
    return a;
  }


  /* --- vitrine --- */

  function montarVitrine(cards) {
    const lista = (cards || [])
      .filter(c => c.ativo !== false)
      .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

    const visiveis = rascunho ? lista : lista.filter(temLink);

    if (rascunho) {
      const faltam = lista.filter(c => !temLink(c)).length;
      alvos.vitrine.appendChild(el('p', 'rascunho-aviso',
        faltam
          ? 'MODO BORRADOR · ' + faltam + ' tarjeta(s) sin enlace. No aparecen en la página pública.'
          : 'MODO BORRADOR · todas las tarjetas tienen enlace.'));
    }

    visiveis.forEach(c => alvos.vitrine.appendChild(montarCard(c)));
  }

  /* Avisa quem estiver esperando que o conteudo ja esta na pagina.
     O rastreio usa isso para comecar a observar os blocos. */
  function avisarPronta() {
    document.dispatchEvent(new CustomEvent('pagina:pronta'));
  }


  /* --- rodape --- */

  function montarPie(pie) {
    if (!pie || pie.mostrar === false) return;
    const alvo = alvos.pie;

    const redes = (pie.redes || []).filter(temLink);
    if (redes.length) {
      const linha = el('div', 'pie__redes');
      redes.forEach(rede => {
        const a = el('a', 'pie__rede');
        a.setAttribute('aria-label', rede.nome || rede.id);
        a.title = rede.nome || rede.id;
        ligar(a, rede);
        const icone = svgIcone(rede.icone || rede.id || rede.nome);
        if (icone) a.appendChild(icone);
        else a.textContent = (rede.nome || '?').slice(0, 1);
        linha.appendChild(a);
      });
      alvo.appendChild(linha);
    }

    if (pie.texto) alvo.appendChild(el('p', 'pie__texto', pie.texto));
    alvo.hidden = false;
  }


  /* --- inicio --- */

  Promise.all([carregar('dados/perfil.json'), carregar('dados/cards.json')])
    .then(([perfil, conteudo]) => {
      montarPerfil(perfil.perfil);
      montarVitrine(conteudo.cards);
      montarPie(perfil.pie);
      avisarPronta();
    })
    .catch(err => {
      console.error(err);
      alvos.vitrine.appendChild(el('p', 'rascunho-aviso', 'Error al cargar el contenido: ' + err.message));
    });

})();
