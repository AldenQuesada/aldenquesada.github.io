# Link de la bio · Dr. Alden J. Quesada

Página de destino do link da bio do Instagram. Site estático, sem build, sem dependência.
Publicado no GitHub Pages.

## Como mexer no conteúdo

Nenhuma copy, nenhum link e nenhuma cor vivem no HTML. Tudo sai de dois arquivos:

| Arquivo | O que controla |
|---|---|
| `dados/perfil.json` | nome, credencial, foto do topo, redes e rodapé |
| `dados/blocos.json` | os cards da vitrine: ordem, texto, botão, link, foto, cor |

Trocar um título, ligar e desligar um produto, reordenar a vitrine: tudo é edição de JSON.
Não é preciso abrir CSS nem JavaScript.

### Campos de um bloco

```json
{
  "id": "consulta",
  "ordem": 3,
  "ativo": true,
  "sobretitulo": "Consulta",
  "titulo": "Quiero mi consulta con el Dr. Quesada",
  "subtitulo": "Cardiología y naturopatía en una sola evaluación.",
  "botao": "Agendar consulta",
  "botao_cor": "verde",
  "link": "https://...",
  "foto": "img/dr/consulta.png",
  "lado_da_foto": "direita",
  "cores": { "a": "#0d3a2c", "b": "#041710" }
}
```

- `ordem` menor fica em cima.
- `ativo: false` tira o bloco do ar sem apagar nada.
- `link` vazio: o bloco **não aparece** na página pública.
- `botao_cor: "verde"` para o que é clínico. Sem o campo, o botão é dourado.

## Modo borrador

Abra a página com `?rascunho=1` no fim da URL. Os blocos sem link aparecem
marcados com o selo PENDIENTE e um aviso dizendo quantos faltam.
Sem esse parâmetro, a página pública segue limpa.

## As fotos

Cada card leva uma foto do Dr. Quesada recortada. É a assinatura visual da página.

- Formato: **PNG com fundo transparente** (ou WebP com alfa).
- Enquadramento: do joelho ou da cintura para cima, corpo inteiro no quadro.
- Altura recomendada: 900px ou mais. A página reduz, não amplia.
- Alinhamento: a figura precisa encostar na **borda de baixo** do arquivo, sem
  margem. O card corta por baixo, então pé ou barra do jaleco tocando o limite.
- Nomes esperados em `img/dr/`: `libros.png`, `pdf.png`, `consulta.png`,
  `mentoria.png`, `conferencia.png`, e `perfil.jpg` para o topo.

Enquanto uma foto não existe, entra uma silhueta de reserva e o layout não quebra.

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
