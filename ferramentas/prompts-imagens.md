# Prompts para gerar as imagens no Nano Banana

As imagens que estão no ar hoje foram recortadas das fotos de celular enviadas em
11/10/2026. Seguram a página de pé, mas são todas da mesma sessão: você sentado
na mesma cadeira, no mesmo escritório. Estes prompts geram as definitivas.

A página precisa de três tipos de imagem:

| Tipo | Arquivo | Formato | Onde aparece |
|---|---|---|---|
| Cenário | `img/fondo/cenario.jpg` e `cenario-ancho.jpg` | 3:4 e 16:10 | fundo fixo de tudo |
| Avatar | `img/dr/avatar.jpg` | 1:1 | círculo do topo |
| Imagem do card | `img/card/<id>.jpg` | 1,15:1 | metade de cada card |

Os nomes importam: são eles que estão escritos nos JSON. Gerou a imagem nova,
salva com o mesmo nome, troca o arquivo e pronto, sem mexer em código.

---

## 1. Cenário de fundo

É a peça que mais muda o nível da página. Na referência, o cenário é um salão
clássico escuro, com o médico aparecendo duas vezes, sentado à esquerda e em pé
à direita, e a coluna de cards passando no meio por cima.

**Importante:** a coluna ocupa os 500 pixels do centro. Tudo que estiver no meio
da imagem fica tapado. As figuras precisam ficar nas laterais.

### `cenario-ancho.jpg` (desktop, 1920x1200)

```
Monte um cenário cinematográfico horizontal com o Dr. Quesada aparecendo duas vezes na mesma cena.
À esquerda, ele sentado em uma poltrona de couro escuro, de terno escuro, pernas cruzadas, olhando para a câmera.
À direita, ele em pé ao lado de uma janela alta, de terno escuro, mãos à frente do corpo, olhando para a câmera.
O centro do quadro fica vazio e escuro: só o ambiente, sem pessoa e sem objeto, porque o site escreve por cima dessa faixa.
Ambiente: biblioteca ou consultório clássico, madeira escura, estante de livros, luz quente e baixa vindo de abajures, atmosfera noturna.
Mantenha o rosto, a barba e o tom de pele exatamente como nas fotos originais.
Imagem escura e de baixo contraste geral, como um cenário de fundo, não como um retrato.
Formato 16:10, 1920x1200 pixels. Nada de texto, logotipo ou marca d'água.
```

### `cenario.jpg` (celular, 1200x1600)

```
O mesmo cenário acima, recomposto em formato vertical 3:4, 1200x1600 pixels.
No celular quase só se vê a faixa do meio, então deixe o centro vazio e escuro e as duas figuras bem nas bordas, parcialmente cortadas.
Imagem escura, atmosférica, sem foco de leitura.
```

---

## 2. Avatar

```
Use a foto do Dr. Quesada de terno cinza.
Recorte quadrado 1:1, 640x640 pixels, fechado no rosto e nos ombros, rosto centralizado, olhando para a câmera.
Fundo desfocado em tom quente e escuro.
Iluminação suave e limpa, nível de retrato profissional.
Mantenha o rosto, a barba e o tom de pele exatamente como na foto original, sem retoque de feição.
```

Nome do arquivo: `avatar.jpg`.

---

## 3. Imagem de cada card

Regra comum. Cole as quatro linhas no fim de qualquer prompt desta seção:

```
Formato quase quadrado, 1120x974 pixels (proporção 1,15:1).
Enquadramento de meio-corpo: da cintura para cima, figura centralizada e com folga nas bordas.
A imagem ocupa metade do card e é cortada reta na emenda com o texto: não deixe nada importante colado nas bordas.
Mantenha o rosto, a barba, os óculos e o tom de pele exatamente como na foto original, sem retoque de feição.
```

**Por que quase quadrada:** a imagem ocupa 47% da largura do card por toda a
altura. Foto vertical demais fica cortada nas laterais; horizontal demais perde
a cabeça.

### `consulta.jpg`

```
Use a foto do Dr. Quesada no consultório.
Ele de jaleco branco sobre roupa escura, estetoscópio no pescoço, expressão acolhedora, olhando para a câmera, sentado à mesa do consultório.
Ambiente de consultório moderno levemente desfocado, em tons de verde profundo e madeira.
```

### `mentoria.jpg`

```
Use a foto do Dr. Quesada de terno.
Ele de terno escuro, postura de mentor, braços cruzados, expressão firme, olhando para a câmera.
Fundo de escritório executivo desfocado, em tom azul profundo e luz fria.
```

### `conferencia.jpg`

```
Use a foto do Dr. Quesada de terno.
Ele em um palco, com microfone de headset, boca entreaberta falando, gesto de mão em movimento.
Fundo de palco escuro desfocado, com refletores e silhuetas de plateia.
```

### `diabetes-es.jpg`

```
Use a foto do Dr. Quesada sentado à mesa.
Ele segurando o livro de capa branca "Diabetes Mellitus: El fin de las complicaciones" junto ao peito, capa voltada para a câmera e legível.
Fundo de escritório desfocado em tom quente e dourado.
```

### `fin-diabetes.jpg`

```
Use a foto do Dr. Quesada sentado à mesa.
Ele segurando o livro de capa azul-escura "el fin de la DIABETES MELLITUS" junto ao peito, capa voltada para a câmera e legível.
Fundo desfocado em azul profundo, com luz fria.
```

### `detox.jpg`

```
Use a foto do Dr. Quesada.
Ele de jaleco branco segurando o livro "Detox Foods ANTI-DIABETES" junto ao peito, capa voltada para a câmera e legível.
Fundo desfocado em tom verde escuro.
```

### `diabetes-en.jpg`

```
Use a foto do Dr. Quesada sentado à mesa.
Ele segurando o livro de capa escura com letras laranja "the end of DIABETES MELLITUS" junto ao peito, capa voltada para a câmera e legível.
Fundo desfocado em marrom escuro e âmbar.
```

### `diabetes-pt.jpg`

```
Use a foto do Dr. Quesada sentado à mesa.
Ele segurando o livro "o fim da DIABETES MELLITUS" junto ao peito, capa voltada para a câmera e legível.
Fundo desfocado em tom roxo escuro.
```

### `autoridade90.jpg`

```
Use a foto do Dr. Quesada com a Dani Mendes.
Os dois lado a lado, do peito para cima, segurando entre eles um exemplar do livro "De invisível a AUTORIDADE em 90 dias", capa voltada para a câmera e legível.
Mantenha o rosto dos dois exatamente como na foto original.
Fundo de palco escuro desfocado com pilares dourados.
```

### `contacto.jpg`

```
Use a foto do Dr. Quesada de terno cinza.
Ele do peito para cima, sorriso leve e aberto, expressão de quem recebe bem, olhando para a câmera.
Fundo desfocado em verde escuro.
```

---

## Uma ideia que a gabifarias usa e vale copiar

Um dos cards dela não traz foto dela: traz uma **pintura clássica** (uma cena de
cirurgia antiga) como ilustração. Quebra a repetição de ver a mesma pessoa em
todo card, e dá ar de autoridade.

Para os cards de livro isso funcionaria bem: no lugar da sua foto, uma
ilustração do tema. O prompt seria este, e o resto do card não muda:

```
Pintura a óleo clássica, estilo século XIX, representando <tema: um médico examinando um paciente / alimentos frescos sobre uma mesa de madeira / um coração anatômico em estudo>.
Tons escuros e quentes, luz dramática lateral, pinceladas visíveis.
Formato quase quadrado, 1120x974 pixels.
Nada de texto, assinatura ou marca d'água.
```

---

## Depois que as imagens chegarem

Nenhuma mudança de código. Substitua o arquivo em `img/` mantendo o mesmo nome e
suba o número do `?v=` em `index.html` para o navegador largar a versão antiga.
