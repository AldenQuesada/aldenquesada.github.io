/* ------------------------------------------------------------------
   RENDER
   Le dados/perfil.json e dados/cards.json e monta a pagina.
   Nenhuma copy, nenhum link e nenhuma cor moram aqui.
   Para mudar a pagina, mexe no JSON. Este arquivo fica quieto.
------------------------------------------------------------------ */

(function () {

  const rascunho = new URLSearchParams(location.search).get('rascunho') === '1';

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
      img.src = 'img/dr/reserva.svg';
    });
  }


  /* --- perfil --- */

  function montarPerfil(p) {
    if (!p || p.mostrar === false) return;
    const alvo = alvos.perfil;

    if (p.assinatura) alvo.appendChild(el('p', 'perfil__assinatura', p.assinatura));

    if (p.avatar) {
      const img = el('img', 'perfil__avatar');
      img.src = p.avatar;
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


  /* --- um card --- */

  function montarCard(card) {
    const pendente = !temLink(card);

    const a = el('a', 'card');
    a.dataset.lado = card.lado_da_foto || 'esquerda';
    a.dataset.id   = card.id || '';
    if (card.fonte) a.dataset.fonte = card.fonte;

    const cores = card.cores || {};
    a.style.setProperty('--cor-a', cores.a || '#1b1510');
    a.style.setProperty('--cor-b', cores.b || '#0c0907');

    if (pendente) {
      a.classList.add('card--pendente');
      a.href = '#';
      a.setAttribute('aria-disabled', 'true');
      a.addEventListener('click', e => e.preventDefault());
    } else {
      ligar(a, card);
    }

    if (card.foto) {
      const img = el('img', 'card__foto');
      img.src = card.foto;
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      img.loading = 'lazy';
      img.decoding = 'async';
      reserva(img);
      a.appendChild(img);
    }

    const texto = el('div', 'card__texto');
    if (card.sobretitulo) texto.appendChild(el('span', 'card__sobretitulo', card.sobretitulo));
    if (card.titulo)      texto.appendChild(el('h2', 'card__titulo', card.titulo));
    if (card.subtitulo)   texto.appendChild(el('p', 'card__sub', card.subtitulo));
    a.appendChild(texto);

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
    })
    .catch(err => {
      console.error(err);
      alvos.vitrine.appendChild(el('p', 'rascunho-aviso', 'Error al cargar el contenido: ' + err.message));
    });

})();
