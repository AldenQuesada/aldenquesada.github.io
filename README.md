# Link de la bio · Dr. Alden J. Quesada

Página de destino do link da bio do Instagram. Site estático, sem build, sem dependência.
Publicado no GitHub Pages.

## Como mexer no conteúdo

Nenhuma copy, nenhum link e nenhuma cor vivem no HTML. Tudo sai de dois arquivos:

| Arquivo | O que controla |
|---|---|
| `dados/perfil.json` | topo (assinatura, avatar, nome, credencial) e rodapé (redes) |
| `dados/cards.json` | os cards: ordem, título, sobretítulo, link, foto, cor |

Trocar um título, ligar e desligar um produto, reordenar a vitrine: tudo é edição de JSON.
Não é preciso abrir CSS nem JavaScript.

### Campos de um card

```json
{
  "id": "diabetes-es",
  "ordem": 4,
  "ativo": true,
  "titulo": "Diabetes Mellitus",
  "sobretitulo": "Libro · Español",
  "descricao": "El método para controlar la diabetes mellitus [[de forma rápida y segura.]]",
  "lado_da_foto": "direita",
  "foto": "img/card/diabetes-es.jpg",
  "cor": "#3a120c",
  "acento": "#e07a42",
  "link": "https://..."
}
```

- `ordem` menor fica em cima. A ordem é comercial: o que vende caro no topo.
- `ativo: false` tira o card do ar sem apagar nada.
- `link` vazio: o card **não aparece** na página pública.
- `titulo` sai em caixa alta. **Não escreva o ponto final**: ele entra sozinho,
  na cor do acento. É a assinatura do formato.
- `descricao` aceita `[[colchetes duplos]]` para realçar um trecho na cor do
  acento, com fundo. Pode realçar mais de um trecho.
- `lado_da_foto` alterna entre `esquerda` e `direita` para a pilha não ficar monótona.
- `cor` é o fundo sólido do card. `acento` sem valor usa o dourado.

**Tamanho da descrição:** o card corta em 4 linhas. Título de uma linha aguenta
uns 95 caracteres de descrição; título de duas linhas, uns 80. Passar disso
corta a frase no meio.


### O selo de verificado

`perfil.verificado` vem como `false`. O selo desenhado é o mesmo azul do
Instagram: só ligue se a conta for mesmo verificada, senão a página afirma
visualmente uma coisa que não é verdade.


## Modo borrador

Abra a página com `?rascunho=1` no fim da URL. Os blocos sem link aparecem
marcados com o selo PENDIENTE e um aviso dizendo quantos faltam.
Sem esse parâmetro, a página pública segue limpa.

## As imagens

Três tipos, todos gerados por `ferramentas/arte.py` a partir das fotos:

| Tipo | Arquivo | Formato |
|---|---|---|
| Cenário de fundo | `img/fondo/cenario.jpg` e `cenario-ancho.jpg` | 3:4 e 16:10 |
| Avatar do topo | `img/dr/avatar.jpg` | 1:1 |
| Busto de cada card | `img/card/<id>.jpg` | 3:4, fechado no peito |

O busto precisa ser fechado: no card ele aparece com 126 pixels de altura e se
dissolve na borda. Plano aberto vira borrão.

Rodar: `python3 ferramentas/arte.py img`, ajustando o foco e o zoom de cada
corte no topo do arquivo.

Para gerar as definitivas no Nano Banana, os prompts estão em
`ferramentas/prompts-imagens.md`.


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

## Prévia do compartilhamento

`ferramentas/social.py` gera `img/social/og.jpg` (1200x630), a imagem que
WhatsApp, Instagram e Facebook mostram quando o link é colado, mais os ícones
de aba e de atalho na tela inicial.

As URLs nas metatags `og:` são **absolutas**. Essas plataformas não resolvem
caminho relativo: com `img/social/og.jpg` a prévia sai em branco.

Depois de trocar a imagem, o WhatsApp guarda a antiga em cache por um tempo.
Para forçar, mude o nome do arquivo ou acrescente `?v=2` na URL da metatag.

## Carrossel no card

Um card com o campo `fotos` (lista) troca os quadros sozinho, por fade, a cada
3,4 segundos. Com `foto` só, fica estático.

```json
"fotos": [
  "img/card/diabetes-es.jpg",
  "img/card/diabetes-es-2.jpg",
  "img/card/diabetes-es-3.jpg"
]
```

**Sem seta e sem arrastar, de propósito.** O card inteiro é um link: qualquer
gesto dentro dele competiria com o toque que leva ao checkout, e no celular o
arrasto lateral ainda brigaria com a rolagem da página.

O carrossel só gira quando o card está na tela e a aba está visível, e fica
parado para quem tem `prefers-reduced-motion` ligado no sistema.

**Limite de tamanho:** a imagem do card tem 207 por 180 pixels na tela. Capa de
livro, lombada e pilha se leem bem nesse espaço. Página interna de livro, com
texto corrido, não: vira mancha cinza. Para mostrar o miolo, o lugar é a página
de vendas, não o card.

## Mockups de livro

`ferramentas/mockups.py` encaixa os PNG de mockup nos quadros do card: corta a
margem transparente pelo conteúdo real, redimensiona na proporção do card,
centraliza sobre a cor daquele card e desenha uma sombra suave por baixo.

```bash
python3 ferramentas/mockups.py img
```

O caminho dos arquivos de origem está no fim do script. Para um livro novo,
acrescente uma linha `encaixar(...)` apontando para o PNG e para o destino.

**Prefira PNG com transparência.** Com fundo branco chapado o mockup fica com
um retângulo claro em volta, que destoa do card escuro.

**Qual página vira quadro:** capa, livro aberto com foto, tabela colorida. Página
de texto corrido não, porque em 207 pixels de largura vira mancha cinza.

## Card de canal

Um card com `"estilo": "canal"` não divide o espaço em duas metades: a imagem
ocupa o card inteiro, o texto pousa por cima com um botão de play ao lado, e
somem o sobretítulo, a descrição e os anéis.

```json
{
  "estilo": "canal",
  "selo": "Canal",
  "titulo": "Dr. Alden J. Quesada",
  "marca": "youtube",
  "marca_cor": "#ff0033",
  "foto": "img/card/canal.jpg"
}
```

A imagem é preto e branco de propósito: é o contraste com a pilha colorida que
avisa, antes de qualquer leitura, que ali é outra coisa.

`marca` aceita instagram, youtube, whatsapp, tiktok, facebook e telegram. O play
e o ícone são SVG desenhados pelo render, não estão na imagem, então ficam
nítidos em qualquer tela.

## A copy dos cards de livro segue a capa

Regra, não gosto pessoal:

- `titulo` é o título **exato** da capa, inteiro. Não encurtar.
- `sobretitulo` é o **subtítulo do livro**, o que vem logo abaixo do título na
  capa, ou a faixa de promessa. Não serve para dizer o idioma: a página inteira
  é em espanhol.
- `descricao` usa as palavras da própria capa, não uma reescrita.

## A assinatura do topo

Três peças, todas em `dados/perfil.json`:

- `assinatura` é o nome em fonte manuscrita, atrás do avatar.
- `assinatura_titulo` é o **"Dr." pequeno**, que entra acima e à esquerda da
  primeira inicial, como em assinatura de próprio punho.
- A inicial de cada palavra sai a 1,9 vez o tamanho do resto, com a haste
  descendo. É o que faz a assinatura virar monograma em vez de palavra escrita.

## O fio de luz na borda do card

`.card__inner::before` desenha uma borda de 1 pixel em degradê, forte no alto e
sumindo para baixo, como se a luz da sala viesse do teto. É o que dá relevo de
placa ao card sem nenhum enfeite.

A técnica é a borda em degradê: o fundo pinta a moldura inteira e duas máscaras
recortam o miolo, deixando só a espessura do padding. Para mudar a intensidade,
mexa no primeiro valor do `linear-gradient`.

## Quem é dono de qual arquivo

Dois scripts escrevem em `img/card/`, e **não podem gerar o mesmo nome**:

| Script | Gera |
|---|---|
| `ferramentas/arte.py` | cards com foto: consulta, mentoria, conferencia, diabetes-es*, contacto, canal |
| `ferramentas/mockups.py` | cards com mockup: fin-diabetes*, mujer-delgada* |

Se um nome aparecer nas duas listas, rodar o `arte.py` **apaga o mockup em
silêncio**: o arquivo continua existindo e respondendo 200, e a regressão só é
vista a olho. Foi o que aconteceu em 12/10 com o `fin-diabetes`.

Por isso, conferir mockup é **abrir a imagem**, não checar o JSON nem o código
HTTP. Os dois passam mesmo com o conteúdo errado.

## Cache das imagens

`js/render.js` tem no topo a constante `VERSAO_IMAGENS`. Ela entra como `?a=N`
em toda imagem da página.

**Ao trocar qualquer arquivo dentro de `img/`, suba esse número.**

Sem isso, quem já visitou a página continua vendo a imagem velha: o arquivo
mudou de conteúdo mas manteve o nome, e o navegador serve o que tem em cache.
Foi o que aconteceu em 12/10, quando os mockups já estavam corretos no servidor
e a página ainda mostrava as fotos antigas.

Vale também para a prévia do WhatsApp: ali o cache é do WhatsApp, e a saída é
mudar o nome do arquivo ou o `?v=` dentro da metatag `og:image`.

## Páginas internas

`/mentoria/` é a primeira. Mesma lógica do link da bio: HTML vazio, CSS em
tokens, e `dados/pagina.json` com a página inteira.

**O JSON é uma lista de seções.** Cada uma tem `tipo`, que decide como ela é
desenhada, e `ativo`. Tipos disponíveis: hero, desejos, historia, metodo,
entrega, sobre, prova, perfil, aviso, investimento, garantia, faq, contato.

**Seção sem o conteúdo que ela precisa não é desenhada**, mesmo com
`ativo: true`. A de prova sem casos não aparece, a de FAQ sem perguntas não
aparece. Página pela metade no ar é pior que seção ausente.

Com `?rascunho=1` a página lista quais seções estão fora do ar e por quê.

### O que veio da referência e o que não veio

Da `imersaofmh.avgcollege.com.br/vsl-a` vieram os tokens: fundo `#070707`,
superfícies `#0d0d0d`, texto `#d6d6d6`, Montserrat nos títulos, DM Sans no
corpo, botão com raio de 4px e fio de luz branco por dentro.

**Não veio a cor do acento.** Lá o acento é amarelo `#ffcc02` e o botão é azul;
aqui os dois são o dourado da marca. O que importa não é a cor em si: é que o
botão tenha uma cor que **não aparece em nenhum outro lugar da página**. É isso
que faz o olho ir direto nele, não o tamanho.

**Não veio a urgência.** Lá a barra diz que o lote vira em 7 dias, porque é um
evento com data. Aqui diz que a agenda é limitada e pede para consultar
disponibilidade, que é verdade o ano inteiro. Urgência inventada estraga a
página no dia em que o prazo passa e nada acontece.

## Card sem link

Um card sem `link` **aparece na página**, só não é clicável. O que tira um card
do ar é o campo `ativo`.

Isso mudou em 12/10. Antes, card sem link não era desenhado, e essa regra era
decisão minha, não dele. Ela acabou escondendo os três livros, que já tinham
mockup, copy e cor prontos, só porque faltava o endereço do checkout. Produto
pronto fica na vitrine; quem decide o que sai da vitrine é ele.
