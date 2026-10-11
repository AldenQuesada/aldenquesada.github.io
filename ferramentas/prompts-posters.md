# Prompts para gerar os pôsteres no Nano Banana

Os pôsteres que estão no ar hoje são recortes das fotos de celular enviadas em
11/10/2026. Funcionam, mas os seis cards de livro saíram da mesma sessão de
fotos, então a fileira parece o mesmo card repetido. Estes prompts resolvem isso.

## Regras que valem para todos

Cole estas quatro linhas no fim de qualquer prompt da lista:

```
Formato vertical 2:3, 800x1200 pixels.
Mantenha o rosto, a barba, os óculos e o tom de pele exatamente como na foto original, sem retoque de feição.
A terça parte de baixo da imagem deve ficar escura e vazia, sem objeto nem texto importante, porque o site escreve o título ali por cima.
Nada de texto inventado, logotipo ou marca d'água na imagem.
```

**Por que a parte de baixo vazia:** o site escurece a base do pôster e coloca o
título e o subtítulo lá. Se tiver mão, livro ou mesa nessa faixa, o texto briga
com a imagem.

**Como entregar:** salve cada arquivo com o nome exato indicado, em JPG, e me
mande. Eu coloco em `img/poster/` e troco no JSON. O nome importa: é ele que
está escrito em `dados/fileiras.json`.

---

## Fileira "Libros"

### 1. `diabetes-es.jpg` · Diabetes Mellitus: El fin de las complicaciones

```
Use a foto do Dr. Quesada sentado à mesa de mármore segurando os livros.
Recomponha como um cartaz de cinema vertical: ele na metade de cima, em meio-corpo, olhando para a câmera com expressão serena e confiante.
Na metade do meio, o livro de capa branca "Diabetes Mellitus: El fin de las complicaciones" segurado com as duas mãos, de frente para a câmera, grande e com a capa totalmente legível, sem reflexo e sem corte.
Deixe só esse livro em cena: remova os outros exemplares da mesa.
Fundo de consultório moderno desfocado, em tom quente e escuro, com um facho de luz suave vindo de cima à esquerda.
Iluminação cinematográfica, contraste alto, profundidade de campo rasa.
```

### 2. `fin-diabetes.jpg` · El fin de la Diabetes Mellitus

```
Use a foto do Dr. Quesada sentado à mesa de mármore.
Recomponha como cartaz vertical: ele na metade de cima, em plano um pouco mais aberto que o anterior, de braços apoiados na mesa, olhando para a câmera.
Na metade do meio, o livro de capa azul-escura "el fin de la DIABETES MELLITUS" em pé sobre a mesa, de frente para a câmera, grande e com a capa legível.
Deixe só esse livro em cena.
Fundo escuro em azul profundo, desfocado, com luz fria vindo da direita, contrastando com a cena quente do outro pôster.
Iluminação cinematográfica, contraste alto.
```

### 3. `diabetes-en.jpg` · The End of Diabetes Mellitus

```
Use a foto do Dr. Quesada sentado à mesa de mármore.
Recomponha como cartaz vertical: ele na metade de cima, de perfil de três quartos, olhando para o livro que segura.
Na metade do meio, o livro de capa escura com letras laranja "the end of DIABETES MELLITUS" aberto nas mãos dele ou em pé sobre a mesa, grande e com a capa legível.
Deixe só esse livro em cena.
Fundo escuro neutro, desfocado, com luz lateral dourada marcando o contorno do ombro.
Iluminação cinematográfica, clima de estúdio.
```

### 4. `diabetes-pt.jpg` · O fim da Diabetes Mellitus

```
Use a foto do Dr. Quesada sentado à mesa de mármore de braços cruzados.
Recomponha como cartaz vertical: ele na metade de cima, braços cruzados, postura de autoridade, sorriso contido, olhando para a câmera.
Na metade do meio, o livro de capa escura "o fim da DIABETES MELLITUS" em pé sobre a mesa, bem à frente dele, grande e com a capa legível.
Deixe só esse livro em cena.
Fundo de escritório de madeira clara desfocado, com luz quente atrás.
Iluminação cinematográfica, contraste alto.
```

### 5. `detox.jpg` · Detox Foods Anti-Diabetes

```
Use a foto do Dr. Quesada no escritório.
Recomponha como cartaz vertical: ele na metade de cima, em pé ou sentado, de jaleco branco ou terno escuro, olhando para a câmera.
Na metade do meio, o livro "Detox Foods ANTI-DIABETES" segurado de frente para a câmera, grande e com a capa legível.
Ao redor do livro, discretamente desfocados, alguns alimentos frescos em tons verdes: folhas, limão, abacate.
Fundo escuro e limpo, com um leve tom verde na luz, para este pôster se distinguir dos outros da fileira.
Iluminação cinematográfica, profundidade de campo rasa.
```

### 6. `autoridade90.jpg` · De invisível a autoridade em 90 dias

```
Use a foto do Dr. Quesada com a Dani Mendes segurando o livro.
Recomponha como cartaz vertical: os dois lado a lado, em meio-corpo, ocupando a metade de cima, olhando para a câmera.
Na metade do meio, um único exemplar do livro "De invisível a AUTORIDADE em 90 dias" segurado entre os dois, de frente para a câmera, grande e com a capa legível.
Mantenha o rosto dos dois exatamente como na foto original.
Fundo de palco escuro com pilares dourados desfocados e fumaça leve, como está na foto.
Iluminação de palco, contraste alto.
```

---

## Fileira "Trabaja conmigo"

Esta fileira usa cards 3:4, não 2:3. Troque a primeira linha das regras comuns
por: `Formato vertical 3:4, 900x1200 pixels.`

### 7. `consulta.jpg` · Consulta

```
Use a foto do Dr. Quesada no consultório.
Recomponha como cartaz vertical 3:4: ele em meio-corpo, de jaleco branco sobre roupa escura, estetoscópio no pescoço, postura acolhedora, olhando para a câmera.
Sem nenhum livro em cena.
Ao fundo, um consultório moderno desfocado em tons de verde profundo e madeira.
Iluminação suave e limpa, clima de confiança clínica.
```

### 8. `mentoria.jpg` · Mentoría

```
Use a foto do Dr. Quesada de terno.
Recomponha como cartaz vertical 3:4: ele em pé, meio-corpo, de terno, braços cruzados ou uma mão no bolso, postura de mentor, olhando para a câmera.
Sem nenhum livro em cena.
Ao fundo, desfocado, um ambiente de escritório executivo com luz quente e dourada.
Iluminação cinematográfica, contraste alto, ar de autoridade.
```

### 9. `conferencia.jpg` · Conferencias

```
Use a foto do Dr. Quesada de terno.
Recomponha como cartaz vertical 3:4: ele em um palco, em meio-corpo, com microfone de headset, gesticulando enquanto fala, olhar dirigido à plateia.
Ao fundo, desfocado, o palco escuro com luzes de refletor e silhuetas de plateia.
Iluminação de palco, facho de luz atrás dele criando contorno.
Clima de congresso, não de consultório.
```

---

## Billboard (a capa de abertura)

Este é o único que não é pôster de card. É a imagem grande do topo.

```
Use a foto do Dr. Quesada de terno cinza na estante.
Recomponha em formato vertical 3:4, 1200x1600 pixels: ele em corpo inteiro ou três quartos, ocupando o lado direito do quadro, olhando para a câmera.
Deixe o lado esquerdo do quadro livre e escuro: é onde o site escreve o nome e a credencial.
Fundo de biblioteca ou consultório com luz quente e dourada, desfocado.
Iluminação cinematográfica, contraste alto.
Mantenha o rosto exatamente como na foto original.
```

Nome do arquivo: `autoridade.jpg`.

---

## Depois que as imagens chegarem

Nenhuma mudança de código é necessária. Basta substituir o arquivo em
`img/poster/` mantendo o mesmo nome, e subir o número do `?v=` em `index.html`
para o navegador largar a versão antiga.
