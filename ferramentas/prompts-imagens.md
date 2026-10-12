# Prompts para gerar as imagens no Nano Banana

Desde 11/10/2026 a página usa a sessão de fotos profissionais (11 a 15).
O que ainda pode melhorar com geração:

| O que | Arquivo | Estado |
|---|---|---|
| Fundo da página | `img/fondo/cenario-ancho.jpg` | composto aqui, funciona |
| Capa do livro de adelgazamiento | `img/card/adelgazamiento.jpg` | **provisório**, sem a capa |
| Mockups dos livros | ainda não existem | aguardando as capas |

## O problema da foto do autógrafo (11.png)

Ampliei as capas nela e estão corrompidas: **"ALDEN J. QUESSADA"** com dois S,
"De invisivel" sem acento, o subtítulo virou letra sem sentido e a pilha da
esquerda está com o texto espelhado ("DNII ERDES" é "DANI MENDES" ao contrário).

Por isso ela entra na página só no card de adelgazamiento, **cortada no gesto de
autografar, com a capa fora do quadro**. Se um dia você quiser usá-la inteira,
as capas precisam ser refeitas.

Para regerar essa foto com as capas certas:

```
Use a foto do Dr. Quesada autografando o livro.
Mantenha tudo igual: a pose, o terno azul de três peças, a mesa de mármore, a estante iluminada ao fundo.
Substitua as capas dos livros pelas capas reais que estou anexando, sem alterar o texto delas.
Nenhuma letra pode aparecer espelhada, trocada ou ilegível.
O nome do autor é ALDEN J. QUESADA, com um S só.
Formato vertical, 1120x1400 pixels.
```

## Capa e mockup do livro de adelgazamiento

Quando a capa estiver em mãos, o card fica assim:

```
Use a foto do Dr. Quesada de jaleco branco.
Ele segurando o livro de capa <descrever a capa> junto ao peito, capa voltada para a câmera e totalmente legível.
Fundo de consultório desfocado em tom escuro.
Formato quase quadrado, 1120x974 pixels (proporção 1,15:1).
Enquadramento de meio-corpo, figura centralizada e com folga nas bordas.
Mantenha o rosto, a barba, os óculos e o tom de pele exatamente como na foto original.
```

## Fundo alternativo, se quiser trocar o composto

Hoje o fundo é você sentado à esquerda e em pé à direita, com o meio escuro. Se
preferir o caminho da gabifarias, que usa uma pintura clássica:

```
Pintura a óleo clássica, estilo século XIX, de um estudo anatômico do coração humano sobre mesa de madeira escura, com instrumentos e um caderno de anotações.
Tons escuros e quentes, luz dramática lateral, pinceladas visíveis.
O centro do quadro fica vazio e escuro: é por ali que a coluna de cards desce.
Formato 16:10, 1920x1200 pixels. Nada de texto, assinatura ou marca d'água.
```

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
