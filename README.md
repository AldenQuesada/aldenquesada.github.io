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
