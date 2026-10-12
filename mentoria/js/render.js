/* ------------------------------------------------------------------
   RENDER DA PAGINA DE MENTORIA
   Le dados/pagina.json e monta a pagina inteira.
   Nenhuma copy, nenhum link e nenhuma cor moram aqui.

   Regra que vale para toda secao: se o conteudo que ela precisa nao
   estiver preenchido, ela nao e desenhada. Secao pela metade no ar e
   pior que secao ausente.
------------------------------------------------------------------ */

(function () {

  const rascunho = new URLSearchParams(location.search).get('rascunho') === '1';

  /* Versao das imagens: entra como ?a=N em toda foto da pagina.
     AO TROCAR QUALQUER ARQUIVO EM img/, SUBA ESTE NUMERO. Sem isso quem
     ja visitou continua vendo a foto antiga. */
  const VERSAO_IMAGENS = 2;

  const palco  = document.getElementById('palco');
  const topo   = document.getElementById('barra');
  const rodape = document.getElementById('rodape');

  let CTA = { texto: '', link: '' };
  const pendentes = [];


  /* --- utilitarios ------------------------------------------------- */

  function el(tag, classe, texto) {
    const n = document.createElement(tag);
    if (classe) n.className = classe;
    if (texto != null) n.textContent = texto;
    return n;
  }

  function temLink(x) {
    return x && typeof x.link === 'string' && /^(https?:|mailto:|\.|\/|#)/i.test(x.link.trim());
  }

  /* Texto com [[trecho]] vira trecho realcado. Montado com nos de
     texto: o JSON nunca injeta marcacao na pagina. */
  function comRealce(tag, classe, texto) {
    const n = el(tag, classe);
    // [[assim]] sai na cor de acento, **assim** sai em negrito claro.
    String(texto).split(/(\[\[[^\]]*\]\]|\*\*[^*]+\*\*)/).forEach(parte => {
      if (!parte) return;
      if (parte.startsWith('[[') && parte.endsWith(']]')) {
        n.appendChild(el('span', 'realce', parte.slice(2, -2)));
      } else if (parte.startsWith('**') && parte.endsWith('**')) {
        n.appendChild(el('strong', null, parte.slice(2, -2)));
      } else {
        n.appendChild(document.createTextNode(parte));
      }
    });
    return n;
  }

  function paragrafos(destino, lista) {
    (lista || []).forEach(p => {
      if (typeof p === 'string') { destino.appendChild(comRealce('p', null, p)); return; }
      if (p && p.golpe)          { destino.appendChild(comRealce('p', 'duplo__golpe', p.golpe)); }
      else if (p && p.texto)     { destino.appendChild(comRealce('p', null, p.texto)); }
    });
  }

  function secao(classeExtra, fundo) {
    const s = el('section', 'secao' + (classeExtra ? ' ' + classeExtra : ''));
    if (fundo) {
      s.classList.add('secao--foto');
      s.appendChild(imagem(fundo, '', 'secao__fundo'));
    }
    const dentro = el('div', 'palco');
    s.appendChild(dentro);
    return { s, dentro };
  }

  function cabecalho(dentro, dados) {
    if (dados.selo)   dentro.appendChild(el('span', 'selo', dados.selo));
    if (dados.titulo) dentro.appendChild(comRealce('h2', null, dados.titulo));
  }

  function botao(classe) {
    if (!CTA.link) return null;
    const a = el('a', 'botao' + (classe ? ' ' + classe : ''), CTA.texto);
    a.href = UTM.aplicar(CTA.link);
    a.target = '_blank';
    a.rel = 'noopener';
    a.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('cta:clique', { detail: { pagina: 'mentoria' } }));
    });
    return a;
  }

  function faixaCta(destino) {
    const b = botao();
    if (!b) return;
    const faixa = el('div', 'cta-faixa');
    faixa.appendChild(b);
    destino.appendChild(faixa);
  }

  function imagem(src, alt, classe) {
    const img = el('img', classe);
    img.src = src + (src.includes('?') ? '&' : '?') + 'a=' + VERSAO_IMAGENS;
    img.alt = alt || '';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.addEventListener('error', () => img.remove());
    return img;
  }


  /* --- um desenhista por tipo de secao ----------------------------- */

  const TIPOS = {

    hero(d) {
      if (!d.titulo) return null;
      const { s, dentro } = secao('hero');
      s.classList.remove('secao');
      s.className = 'hero';

      if (d.imagem) s.insertBefore(imagem(d.imagem, '', 'hero__fundo'), s.firstChild);

      if (d.selo)        dentro.appendChild(el('span', 'selo', d.selo));
      if (d.sobretitulo) dentro.appendChild(el('p', 'hero__sobretitulo', d.sobretitulo));
      dentro.appendChild(comRealce('h1', null, d.titulo));
      if (d.subtitulo)   dentro.appendChild(comRealce('p', 'hero__sub', d.subtitulo));

      if (d.video) {
        const caixa = el('div', 'hero__video');
        const f = document.createElement('iframe');
        f.src = d.video;
        f.title = d.titulo;
        f.allow = 'accelerometer; autoplay; encrypted-media; picture-in-picture';
        f.allowFullscreen = true;
        caixa.appendChild(f);
        dentro.appendChild(caixa);
      } else if (d.reservar_video) {
        // O espaco fica a vista enquanto o video nao existe: assim a
        // pagina ja mostra onde ele entra, em vez de mudar de altura
        // no dia em que o video chegar.
        const caixa = el('div', 'hero__video hero__video--vazio');
        caixa.appendChild(el('span', 'play', '▶'));
        caixa.appendChild(el('p', null, d.rotulo_video || 'Espacio reservado para el video'));
        dentro.appendChild(caixa);
      }

      faixaCta(dentro);

      if ((d.marcas || []).length) {
        const m = el('div', 'hero__marcas');
        d.marcas.forEach(t => m.appendChild(el('span', null, t)));
        dentro.appendChild(m);
      }
      return s;
    },

    /* Numero grande e texto ao lado. Na referencia e o dado de mercado
       que justifica a urgencia do tema. */
    contexto(d) {
      if (!(d.dados || []).length) return null;
      const { s, dentro } = secao(null, d.fundo);
      cabecalho(dentro, d);
      if (d.intro) dentro.appendChild(comRealce('p', null, d.intro));
      const grade = el('div', 'contexto__grade');
      d.dados.forEach(x => {
        const c = el('div', 'dado');
        if (x.numero) c.appendChild(el('p', 'dado__numero', x.numero));
        if (x.texto)  c.appendChild(comRealce('p', 'dado__texto', x.texto));
        grade.appendChild(c);
      });
      dentro.appendChild(grade);
      if (d.fecho) dentro.appendChild(comRealce('p', 'contexto__fecho', d.fecho));
      return s;
    },

    /* Passos ligados por uma linha: mostra que existe ordem, nao lista
       solta. Cada passo aceita [[destaque]] no texto. */
    passos(d) {
      if (!(d.itens || []).length) return null;
      const { s, dentro } = secao(null, d.fundo);
      cabecalho(dentro, d);
      if (d.intro) dentro.appendChild(comRealce('p', null, d.intro));
      const lista = el('div', 'passos');
      d.itens.forEach((t, i) => {
        const p = el('div', 'passo');
        p.appendChild(el('span', 'passo__num', String(i + 1)));
        p.appendChild(comRealce('div', 'passo__texto', t));
        lista.appendChild(p);
      });
      dentro.appendChild(lista);
      if (d.fecho) dentro.appendChild(comRealce('p', 'passos__fecho', d.fecho));
      faixaCta(dentro);
      return s;
    },

    equipe(d) {
      if (!(d.pessoas || []).length) return null;
      const { s, dentro } = secao(null, d.fundo);
      cabecalho(dentro, d);
      if (d.intro) dentro.appendChild(comRealce('p', null, d.intro));
      const grade = el('div', 'equipe');
      d.pessoas.forEach(x => {
        const c = el('div', 'pessoa');
        if (x.foto)  c.appendChild(imagem(x.foto, x.nome || '', 'pessoa__foto'));
        if (x.nome)  c.appendChild(el('h3', null, x.nome));
        if (x.papel) c.appendChild(el('p', 'pessoa__papel', x.papel));
        if (x.texto) c.appendChild(comRealce('p', 'pessoa__texto', x.texto));
        grade.appendChild(c);
      });
      dentro.appendChild(grade);
      return s;
    },

    /* Prints de rede social. Card claro, levemente girado: e o que faz
       parecer recorte de verdade e nao depoimento montado. */
    depoimentos(d) {
      const itens = d.itens || [];
      const vazios = Math.max(0, (d.reservar || 0) - itens.length);
      if (!itens.length && !vazios) return null;
      const { s, dentro } = secao('depoimentos', d.fundo);
      cabecalho(dentro, d);
      const grade = el('div', 'depoimentos__grade');
      itens.forEach(x => {
        const c = el('div', 'depoimento');
        const topo = el('div', 'depoimento__topo');
        if (x.foto) topo.appendChild(imagem(x.foto, '', 'depoimento__foto'));
        const quem = el('div');
        if (x.quem)   quem.appendChild(el('p', 'depoimento__quem', x.quem));
        if (x.quando) quem.appendChild(el('p', 'depoimento__quando', x.quando));
        topo.appendChild(quem);
        c.appendChild(topo);
        if (x.texto) c.appendChild(comRealce('p', 'depoimento__texto', x.texto));
        grade.appendChild(c);
      });
      for (let i = 0; i < vazios; i++) {
        grade.appendChild(el('div', 'depoimento depoimento--vazio', 'Espacio para testimonio'));
      }
      dentro.appendChild(grade);
      faixaCta(dentro);
      return s;
    },

    desejos(d) {
      if (!(d.itens || []).length) return null;
      const { s, dentro } = secao('desejos', d.fundo);
      cabecalho(dentro, d);
      const lista = el('div', 'desejos__lista');
      d.itens.forEach(t => {
        const li = el('div', 'desejo');
        li.appendChild(el('span', 'desejo__marca', '✓'));
        li.appendChild(comRealce('span', null, t));
        lista.appendChild(li);
      });
      dentro.appendChild(lista);
      return s;
    },

    historia(d) {
      if (!(d.paragrafos || []).length) return null;
      const { s, dentro } = secao();
      const grade = el('div', 'duplo');
      const foto = el('div', 'duplo__foto');
      if (d.imagem) foto.appendChild(imagem(d.imagem, d.titulo || ''));
      const texto = el('div');
      cabecalho(texto, d);
      paragrafos(texto, d.paragrafos);
      grade.append(foto, texto);
      dentro.appendChild(grade);
      return s;
    },

    metodo(d) {
      if (!(d.fases || []).length) return null;
      const { s, dentro } = secao('metodo', d.fundo);
      cabecalho(dentro, d);
      if (d.intro) dentro.appendChild(comRealce('p', 'metodo__intro', d.intro));
      const grade = el('div', 'fases');
      d.fases.forEach((f, i) => {
        const c = el('div', 'fase');
        c.appendChild(el('p', 'fase__num', f.etapa || ('Fase 0' + (i + 1))));
        if (f.nome)    c.appendChild(el('p', 'fase__nome', f.nome));
        if (f.titulo)  c.appendChild(el('h3', 'fase__titulo', f.titulo));
        if (f.texto)   c.appendChild(comRealce('p', 'fase__texto', f.texto));
        if (f.nota)    c.appendChild(comRealce('p', 'fase__nota', f.nota));
        grade.appendChild(c);
      });
      dentro.appendChild(grade);
      return s;
    },

    entrega(d) {
      if (!(d.pilares || []).length) return null;
      const { s, dentro } = secao(null, d.fundo);
      cabecalho(dentro, d);
      const grade = el('div', 'pilares');
      d.pilares.forEach((p, i) => {
        const c = el('div', 'pilar');
        c.appendChild(el('p', 'pilar__num', p.rotulo || ('Pilar 0' + (i + 1))));
        const lado = el('div');
        if (p.titulo) lado.appendChild(el('h3', null, p.titulo));
        if (p.texto)  lado.appendChild(comRealce('p', 'pilar__texto', p.texto));
        c.appendChild(lado);
        grade.appendChild(c);
      });
      dentro.appendChild(grade);
      faixaCta(dentro);
      return s;
    },

    sobre(d) {
      if (!(d.paragrafos || []).length) return null;
      const { s, dentro } = secao();
      const grade = el('div', 'duplo duplo--invertido');
      const foto = el('div', 'duplo__foto');
      if (d.imagem) foto.appendChild(imagem(d.imagem, d.titulo || ''));
      const texto = el('div');
      cabecalho(texto, d);
      if (d.credencial) texto.appendChild(el('p', 'duplo__credencial', d.credencial));
      paragrafos(texto, d.paragrafos);
      grade.append(foto, texto);
      dentro.appendChild(grade);
      return s;
    },

    prova(d) {
      if (!(d.casos || []).length) return null;
      const { s, dentro } = secao();
      cabecalho(dentro, d);
      if (d.intro) dentro.appendChild(comRealce('p', null, d.intro));
      const grade = el('div', 'casos');
      d.casos.forEach(c => {
        const card = el('div', 'caso');
        if (c.foto) card.appendChild(imagem(c.foto, c.nome || '', 'caso__foto'));
        if (c.nome)     card.appendChild(el('h3', 'caso__nome', c.nome));
        if (c.registro) card.appendChild(el('p', 'caso__registro', c.registro));
        if (c.antes)    card.appendChild(el('p', 'caso__antes', c.antes));
        if (c.rotulo)   card.appendChild(el('p', 'caso__rotulo', c.rotulo));
        if (c.depois)   card.appendChild(el('p', 'caso__depois', c.depois));
        grade.appendChild(card);
      });
      dentro.appendChild(grade);
      faixaCta(dentro);
      return s;
    },

    perfil(d) {
      if (!(d.para_quem || []).length && !(d.nao_e || []).length) return null;
      const { s, dentro } = secao(null, d.fundo);
      cabecalho(dentro, d);
      const grade = el('div', 'perfil-colunas');
      [['sim', 'Es para ti que:', d.para_quem], ['nao', 'No es para ti que:', d.nao_e]]
        .forEach(([tipo, rotulo, itens]) => {
          if (!(itens || []).length) return;
          const col = el('div', 'coluna coluna--' + tipo);
          col.appendChild(el('p', 'coluna__titulo', rotulo));
          const ul = el('ul');
          itens.forEach(t => ul.appendChild(comRealce('li', null, t)));
          col.appendChild(ul);
          grade.appendChild(col);
        });
      dentro.appendChild(grade);
      return s;
    },

    aviso(d) {
      if (!d.titulo && !d.destaque) return null;
      const { s, dentro } = secao(null, d.fundo);
      const h = el('h2', 'aviso__titulo');
      h.appendChild(document.createTextNode(d.titulo || ''));
      if (d.destaque) h.appendChild(el('span', 'aviso__destaque', d.destaque));
      dentro.appendChild(h);
      if (d.texto) dentro.appendChild(comRealce('p', 'aviso__texto', d.texto));
      return s;
    },

    investimento(d) {
      if (!d.valor) return null;
      const { s, dentro } = secao('investimento');
      cabecalho(dentro, d);
      const caixa = el('div', 'investimento__caixa');
      caixa.appendChild(el('p', 'investimento__valor', d.valor));
      if ((d.condicoes || []).length) {
        const ul = el('ul', 'investimento__condicoes');
        d.condicoes.forEach(t => ul.appendChild(comRealce('li', null, t)));
        caixa.appendChild(ul);
      }
      const b = botao();
      if (b) { const f = el('div', 'cta-faixa'); f.appendChild(b); caixa.appendChild(f); }
      if (d.observacao) caixa.appendChild(el('p', 'investimento__obs', d.observacao));
      dentro.appendChild(caixa);
      return s;
    },

    garantia(d) {
      if (!(d.itens || []).length) return null;
      const { s, dentro } = secao();
      const caixa = el('div', 'garantia');
      if (d.titulo) caixa.appendChild(comRealce('h2', null, d.titulo));
      const ul = el('ul');
      d.itens.forEach(t => ul.appendChild(comRealce('li', null, t)));
      caixa.appendChild(ul);
      const b = botao();
      if (b) { const f = el('div', 'cta-faixa'); f.appendChild(b); caixa.appendChild(f); }
      dentro.appendChild(caixa);
      return s;
    },

    faq(d) {
      if (!(d.perguntas || []).length) return null;
      const { s, dentro } = secao('faq');
      cabecalho(dentro, d);
      const lista = el('div', 'faq__lista');
      d.perguntas.forEach(p => {
        if (!p.pergunta || !p.resposta) return;
        const det = document.createElement('details');
        const sum = document.createElement('summary');
        sum.appendChild(document.createTextNode(p.pergunta));
        det.appendChild(sum);
        det.appendChild(comRealce('div', 'faq__resposta', p.resposta));
        lista.appendChild(det);
      });
      if (!lista.children.length) return null;
      dentro.appendChild(lista);
      return s;
    },

    contato(d) {
      if (!temLink(d)) return null;
      const { s, dentro } = secao();
      const caixa = el('div', 'contato');

      const ns = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('fill', 'currentColor');
      svg.setAttribute('aria-hidden', 'true');
      const p = document.createElementNS(ns, 'path');
      p.setAttribute('d', 'M12 2a9 9 0 0 0-9 9v5a3 3 0 0 0 3 3h1a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1H5v-.1A7 7 0 0 1 19 11v.9h-2a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h.5a2.5 2.5 0 0 1-2.5 2h-2a1 1 0 1 0 0 2h2a4.5 4.5 0 0 0 4.4-4A3 3 0 0 0 21 16v-5a9 9 0 0 0-9-9z');
      svg.appendChild(p);
      const icone = el('div', 'contato__icone');
      icone.appendChild(svg);

      const texto = el('div', 'contato__texto');
      if (d.titulo) texto.appendChild(el('p', 'contato__titulo', d.titulo));
      if (d.texto)  texto.appendChild(comRealce('p', null, d.texto));

      const a = el('a', 'botao botao--vazio', d.botao || 'Hablar');
      a.href = UTM.aplicar(d.link.trim());
      a.target = '_blank';
      a.rel = 'noopener';

      caixa.append(icone, texto, a);
      dentro.appendChild(caixa);
      return s;
    }
  };


  /* --- montagem ---------------------------------------------------- */

  function montarBarra(b) {
    if (!b || b.ativo === false || !b.texto) return;
    const faixa = el(temLink(b) ? 'a' : 'div', 'barra', b.texto);
    if (temLink(b)) { faixa.href = UTM.aplicar(b.link.trim()); faixa.target = '_blank'; faixa.rel = 'noopener'; }
    topo.replaceWith(faixa);
    document.body.classList.add('com-barra');
  }

  function montarRodape(r) {
    if (!r) return;
    const dentro = el('div', 'palco');
    if (r.voltar && r.voltar.link) {
      const a = el('a', 'rodape__voltar');
      a.href = r.voltar.link;
      a.setAttribute('aria-label', r.voltar.texto || 'Volver');
      a.textContent = '↑';
      dentro.appendChild(a);
    }
    if (r.texto) dentro.appendChild(el('p', 'rodape__texto', r.texto));
    if (r.aviso) dentro.appendChild(el('p', 'rodape__aviso', r.aviso));
    rodape.appendChild(dentro);
  }

  function montar(dados) {
    if (dados.meta) {
      if (dados.meta.titulo) document.title = dados.meta.titulo;
      if (dados.meta.idioma) document.documentElement.lang = dados.meta.idioma;
    }

    CTA = dados.cta || CTA;
    montarBarra(dados.barra);

    (dados.secoes || []).forEach(d => {
      const desenhar = TIPOS[d.tipo];
      if (!desenhar) { console.warn('tipo de secao desconhecido:', d.tipo); return; }

      if (d.ativo === false) { pendentes.push(d.tipo + (d._pendente ? ': ' + d._pendente : '')); return; }

      const bloco = desenhar(d);
      if (bloco) palco.appendChild(bloco);
      else pendentes.push(d.tipo + ': sin contenido');
    });

    montarRodape(dados.rodape);

    if (rascunho) {
      const texto = pendentes.length
        ? 'MODO BORRADOR · ' + pendentes.length + ' sección(es) fuera del aire: ' + pendentes.join(' | ')
        : 'MODO BORRADOR · todas las secciones están completas.';
      palco.prepend(el('p', 'rascunho-aviso', texto));
      if (!CTA.link) palco.prepend(el('p', 'rascunho-aviso', 'MODO BORRADOR · el CTA no tiene enlace, los botones no aparecen.'));
    }
  }

  fetch('dados/pagina.json?v=' + Date.now())
    .then(r => { if (!r.ok) throw new Error('pagina.json (' + r.status + ')'); return r.json(); })
    .then(montar)
    .catch(err => {
      console.error(err);
      palco.appendChild(el('p', 'rascunho-aviso', 'Error al cargar el contenido: ' + err.message));
    });

})();
