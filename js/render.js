/* ------------------------------------------------------------------
   RENDER
   Le dados/perfil.json e dados/blocos.json e monta a pagina.
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

  function temLink(bloco) {
    return typeof bloco.link === 'string' && /^https?:/i.test(bloco.link.trim());
  }


  /* --- perfil --- */

  function montarPerfil(perfil) {
    if (!perfil || perfil.mostrar === false) return;
    const alvo = alvos.perfil;

    if (perfil.foto) {
      const img = el('img', 'perfil__foto');
      img.src = perfil.foto;
      img.alt = perfil.nome || '';
      img.width = 104;
      img.height = 104;
      img.addEventListener('error', function () {
        if (img.dataset.reserva) return;
        img.dataset.reserva = '1';
        img.src = 'img/dr/reserva.svg';
      });
      alvo.appendChild(img);
    }

    if (perfil.nome) alvo.appendChild(el('h1', 'perfil__nome', perfil.nome));
    if (perfil.credencial) alvo.appendChild(el('p', 'perfil__credencial', perfil.credencial));

    alvo.hidden = false;
    if (perfil.nome) document.title = perfil.nome;
  }


  /* --- um bloco --- */

  function montarBloco(bloco) {
    const pendente = !temLink(bloco);

    const card = el('a', 'bloco');
    card.dataset.lado  = bloco.lado_da_foto || 'direita';
    card.dataset.id    = bloco.id || '';
    if (bloco.botao_cor) card.dataset.botao = bloco.botao_cor;

    const cores = bloco.cores || {};
    card.style.setProperty('--cor-a', cores.a || '#102a4c');
    card.style.setProperty('--cor-b', cores.b || '#071428');

    if (pendente) {
      card.classList.add('bloco--pendente');
      card.href = '#';
      card.setAttribute('aria-disabled', 'true');
      card.addEventListener('click', e => e.preventDefault());
    } else {
      card.href = UTM.aplicar(bloco.link.trim());
      if (bloco.nova_aba !== false) {
        card.target = '_blank';
        card.rel = 'noopener';
      }
      // Gancho para a medicao da fase 2. Ninguem escuta ainda.
      card.addEventListener('click', function () {
        document.dispatchEvent(new CustomEvent('bloco:clique', {
          detail: { id: bloco.id, titulo: bloco.titulo, link: bloco.link }
        }));
      });
    }

    if (bloco.foto) {
      const foto = el('img', 'bloco__foto');
      foto.src = bloco.foto;
      foto.alt = '';
      foto.setAttribute('aria-hidden', 'true');
      foto.loading = 'lazy';
      foto.decoding = 'async';
      // Enquanto a foto de verdade nao chega, uma silhueta segura o layout.
      foto.addEventListener('error', function () {
        if (foto.dataset.reserva) return;
        foto.dataset.reserva = '1';
        foto.classList.add('bloco__foto--reserva');
        foto.src = 'img/dr/reserva.svg';
      });
      card.appendChild(foto);
    }

    const texto = el('div', 'bloco__texto');
    if (bloco.sobretitulo) texto.appendChild(el('p', 'bloco__sobretitulo', bloco.sobretitulo));
    if (bloco.titulo)      texto.appendChild(el('h2', 'bloco__titulo', bloco.titulo));
    if (bloco.subtitulo)   texto.appendChild(el('p', 'bloco__sub', bloco.subtitulo));
    if (bloco.botao)       texto.appendChild(el('span', 'bloco__botao', bloco.botao));
    card.appendChild(texto);

    return card;
  }


  /* --- vitrine --- */

  function montarVitrine(blocos) {
    const lista = (blocos || [])
      .filter(b => b.ativo !== false)
      .filter(b => rascunho || temLink(b))   // sem link, so aparece no rascunho
      .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

    if (rascunho) {
      const faltam = lista.filter(b => !temLink(b)).length;
      alvos.vitrine.appendChild(el(
        'p', 'rascunho-aviso',
        faltam
          ? 'MODO BORRADOR · ' + faltam + ' bloque(s) sin enlace. No aparecen en la página pública.'
          : 'MODO BORRADOR · todos los bloques tienen enlace.'
      ));
    }

    lista.forEach(b => alvos.vitrine.appendChild(montarBloco(b)));
  }


  /* --- rodape --- */

  function montarPie(pie) {
    if (!pie || pie.mostrar === false) return;
    const alvo = alvos.pie;

    if (Array.isArray(pie.redes) && pie.redes.length) {
      const linha = el('div', 'pie__redes');
      pie.redes.forEach(rede => {
        if (!rede.link) return;
        const a = el('a', 'pie__rede', rede.nome);
        a.href = UTM.aplicar(rede.link);
        a.target = '_blank';
        a.rel = 'noopener';
        linha.appendChild(a);
      });
      if (linha.childElementCount) alvo.appendChild(linha);
    }

    if (pie.texto) alvo.appendChild(el('p', null, pie.texto));
    alvo.hidden = false;
  }


  /* --- inicio --- */

  Promise.all([carregar('dados/perfil.json'), carregar('dados/blocos.json')])
    .then(([perfil, blocos]) => {
      montarPerfil(perfil.perfil || perfil);
      montarVitrine(blocos.blocos || blocos);
      montarPie(perfil.pie);
    })
    .catch(err => {
      console.error(err);
      alvos.vitrine.appendChild(el('p', 'rascunho-aviso', 'Error al cargar el contenido: ' + err.message));
    });

})();
