# Link de la bio · Dr. Alden J. Quesada

Página de destino do link da bio do Instagram. Site estático, sem build, sem dependência.
Publicado no GitHub Pages.

## Como mexer no conteúdo

Nenhuma copy, nenhum link e nenhuma cor vivem no HTML. Tudo sai de dois arquivos:

| Arquivo | O que controla |
|---|---|
| `dados/perfil.json` | billboard do topo (nome, credencial, frase, botões) e rodapé |
| `dados/fileiras.json` | as fileiras e seus cards: ordem, título, etiqueta, link, pôster |

Trocar um título, ligar e desligar um produto, reordenar a vitrine: tudo é edição de JSON.
Não é preciso abrir CSS nem JavaScript.

### Campos de um card

```json
{
  "id": "consulta",
  "ordem": 1,
  "ativo": true,
  "titulo": "Consulta con el Dr. Quesada",
  "subtitulo": "Cardiología y naturopatía en una sola evaluación",
  "etiqueta": "Agenda",
  "etiqueta_cor": "verde",
  "foto": "img/poster/consulta.jpg",
  "link": "https://..."
}
```

- `ordem` menor fica à esquerda dentro da fileira.
- `ativo: false` tira do ar sem apagar nada. Vale para card e para fileira inteira.
- `link` vazio: o card **não aparece** na página pública.
- `etiqueta` é o selo do canto: idioma, formato, "nuevo".
- `etiqueta_cor: "verde"` para o que é clínico. Sem o campo, é dourado.
- Uma fileira com `"formato": "largo"` usa cards 3:4 em vez de 2:3.
- O título é cortado em 3 linhas e o subtítulo em 2. Títulos curtos rendem mais.

## Modo borrador

Abra a página com `?rascunho=1` no fim da URL. Os blocos sem link aparecem
marcados com o selo PENDIENTE e um aviso dizendo quantos faltam.
Sem esse parâmetro, a página pública segue limpa.

## Os pôsteres

Cada card é um pôster vertical, como cartaz de cinema. O formato Netflix
dispensa recorte de fundo: a foto entra inteira, retangular.

- Formato: **JPG 800x1200** (proporção 2:3), em `img/poster/`.
- O que precisa aparecer: o rosto na metade de cima e, nos cards de livro,
  a capa do livro grande e legível na metade de baixo.
- A base do pôster escurece por CSS, então deixe a parte inferior sem
  nada importante: é onde entram o título e o subtítulo.
- O billboard do topo usa um pôster também, com enquadramento mais aberto.

O script que gerou os pôsteres atuais a partir das fotos de celular está em
`ferramentas/posters.py`. Rodar: `python3 ferramentas/posters.py <pasta-de-saida>`,
ajustando o PLANO (foco vertical, horizontal e zoom de cada corte).


## Rastreamento

`js/utm.js` captura todos os parâmetros da URL de chegada (`utm_source=bio-ig`,
`fbclid` e o que mais vier) e repassa a cada link de saída. Assim a venda no
checkout aparece creditada à bio, e não como tráfego direto.

O rastro é guardado na sessão: se a pessoa voltar pelo botão do navegador e a URL
perder os parâmetros, o rastreamento continua de pé.

## Medição por bloco (fase 2)

Cada clique dispara um evento `bloco:clique` no documento, com `id`, `titulo` e
`link`. Ninguém escuta ainda. A contagem por bloco entra depois, no mesmo padrão
do painel do quiz.

## Rodar local

```bash
cd ~/link-bio
python3 -m http.server 8111
```

Abrir `http://localhost:8111` e `http://localhost:8111/?rascunho=1`.

Servidor é obrigatório: os JSON são lidos por `fetch` e abrir o `index.html`
direto pelo Finder não funciona.

## Cache

CSS e JS são carregados com `?v=N` no `index.html`. Ao mexer nesses arquivos,
suba o número, senão o navegador de quem já visitou continua servindo a versão
velha. Os JSON não precisam disso: já são lidos com cache-bust automático.
