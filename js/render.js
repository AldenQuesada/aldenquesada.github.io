/* ------------------------------------------------------------------
   RENDER
   Le dados/perfil.json e dados/fileiras.json e monta a pagina.
   Nenhuma copy, nenhum link e nenhuma cor moram aqui.
   Para mudar a pagina, mexe no JSON. Este arquivo fica quieto.
------------------------------------------------------------------ */

(function () {

  const rascunho = new URLSearchParams(location.search).get('rascunho') === '1';

  const alvos = {
    billboard: document.getElementById('billboard'),
    palco:     document.getElementById('palco'),
    pie:       document.getElementById('pie')
  };

  /* --- utilitarios --- */

  function el(tag, classe, texto) {
    const n = document.createElement(tag);
    if (classe) n.className = classe;
    if (texto != null) n.textContent = texto;
    return n;
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
        detail: { id: item.id, titulo: item.titulo, link: item.link }
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


  /* --- billboard --- */

  function montarBillboard(b) {
    if (!b || b.mostrar === false) return;
    const alvo = alvos.billboard;

    if (b.foto) {
      const img = el('img', 'billboard__foto');
      img.src = b.foto;
      img.alt = b.nome || '';
      img.fetchPriority = 'high';
      reserva(img);
      alvo.appendChild(img);
    }

    const caixa = el('div', 'billboard__texto');
    if (b.nome)       caixa.appendChild(el('h1', 'billboard__nome', b.nome));
    if (b.credencial) caixa.appendChild(el('p', 'billboard__credencial', b.credencial));
    if (b.frase)      caixa.appendChild(el('p', 'billboard__frase', b.frase));

    const acoes = (b.acoes || []).filter(a => rascunho || temLink(a));
    if (acoes.length) {
      const linha = el('div', 'billboard__acoes');
      acoes.forEach((acao, i) => {
        const a = el('a', 'botao ' + (i === 0 ? 'botao--ouro' : 'botao--vidro'), acao.texto);
        if (temLink(acao)) {
          ligar(a, acao);
        } else {
          a.href = '#';
          a.setAttribute('aria-disabled', 'true');
          a.addEventListener('click', e => e.preventDefault());
        }
        linha.appendChild(a);
      });
      caixa.appendChild(linha);
    }

    alvo.appendChild(caixa);
    alvo.hidden = false;
    if (b.nome) document.title = b.nome;
  }


  /* --- um poster --- */

  function montarPoster(card) {
    const pendente = !temLink(card);

    const a = el('a', 'poster');
    a.dataset.id = card.id || '';
    if (card.etiqueta_cor) a.dataset.etiquetaCor = card.etiqueta_cor;

    if (pendente) {
      a.classList.add('poster--pendente');
      a.href = '#';
      a.setAttribute('aria-disabled', 'true');
      a.addEventListener('click', e => e.preventDefault());
    } else {
      ligar(a, card);
    }

    if (card.foto) {
      const img = el('img', 'poster__foto');
      img.src = card.foto;
      img.alt = card.titulo || '';
      img.loading = 'lazy';
      img.decoding = 'async';
      reserva(img);
      a.appendChild(img);
    }

    const etiqueta = pendente && rascunho ? 'PENDIENTE' : card.etiqueta;
    if (etiqueta) a.appendChild(el('span', 'poster__etiqueta', etiqueta));

    const texto = el('div', 'poster__texto');
    if (card.titulo)    texto.appendChild(el('h3', 'poster__titulo', card.titulo));
    if (card.subtitulo) texto.appendChild(el('p', 'poster__sub', card.subtitulo));
    a.appendChild(texto);

    return a;
  }


  /* --- fileiras --- */

  function montarFileiras(fileiras) {
    let faltam = 0;

    (fileiras || []).forEach(fileira => {
      if (fileira.ativo === false) return;

      const cards = (fileira.cards || [])
        .filter(c => c.ativo !== false)
        .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

      faltam += cards.filter(c => !temLink(c)).length;

      const visiveis = rascunho ? cards : cards.filter(temLink);
      if (!visiveis.length) return;   // fileira sem nada publicavel nao aparece

      const sec = el('section', 'fileira');
      sec.setAttribute('aria-label', fileira.titulo || '');
      if (fileira.formato) sec.dataset.formato = fileira.formato;

      if (fileira.titulo) sec.appendChild(el('h2', 'fileira__titulo', fileira.titulo));

      const trilho = el('div', 'fileira__trilho');
      visiveis.forEach(c => trilho.appendChild(montarPoster(c)));
      sec.appendChild(trilho);

      alvos.palco.appendChild(sec);
    });

    if (rascunho) {
      const aviso = el('p', 'rascunho-aviso',
        faltam
          ? 'MODO BORRADOR · ' + faltam + ' tarjeta(s) sin enlace. No aparecen en la página pública.'
          : 'MODO BORRADOR · todas las tarjetas tienen enlace.');
      alvos.palco.prepend(aviso);
    }
  }


  /* --- rodape --- */

  function montarPie(pie) {
    if (!pie || pie.mostrar === false) return;
    const alvo = alvos.pie;

    const redes = (pie.redes || []).filter(r => temLink(r));
    if (redes.length) {
      const linha = el('div', 'pie__redes');
      redes.forEach(rede => {
        const a = el('a', 'pie__rede', rede.nome);
        ligar(a, rede);
        linha.appendChild(a);
      });
      alvo.appendChild(linha);
    }

    if (pie.texto) alvo.appendChild(el('p', null, pie.texto));
    alvo.hidden = false;
  }


  /* --- inicio --- */

  Promise.all([carregar('dados/perfil.json'), carregar('dados/fileiras.json')])
    .then(([perfil, conteudo]) => {
      montarBillboard(perfil.billboard);
      montarFileiras(conteudo.fileiras);
      montarPie(perfil.pie);
    })
    .catch(err => {
      console.error(err);
      alvos.palco.appendChild(el('p', 'rascunho-aviso', 'Error al cargar el contenido: ' + err.message));
    });

})();
