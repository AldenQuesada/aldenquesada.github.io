#!/usr/bin/env python3
"""Gera posteres 2:3 (estilo Netflix) a partir das fotos do Dr. Quesada.

fy/fx = centro do recorte, de 0 a 1.
zoom  = 1.0 usa o maior recorte 2:3 possivel; abaixo disso fecha o enquadramento.
        Fechar varia o plano entre os cards, para a fileira nao parecer
        o mesmo card repetido seis vezes.
"""
import sys, os
from PIL import Image

ORIG = "/private/tmp/claude-501/-Users-drquesada/1aea2121-26b4-45a4-9936-e8a2d1834c55/images"
SAIDA = sys.argv[1]
LARG, ALT = 800, 1200
RAZAO = LARG / ALT

#  arquivo,  nome,            fy,    fx,   zoom
PLANO = [
    ("1.jpg",  "autoridade",   0.46, 0.50, 1.00),  # billboard: plano inteiro
    ("2.jpg",  "autoridade90", 0.46, 0.52, 0.94),
    ("10.jpg", "diabetes-es",  0.52, 0.54, 0.74),  # fecha no livro branco
    ("6.jpg",  "fin-diabetes", 0.47, 0.46, 0.92),  # plano aberto
    ("7.jpg",  "diabetes-en",  0.55, 0.50, 0.80),  # fecha nos livros
    ("8.jpg",  "diabetes-pt",  0.44, 0.52, 0.96),  # plano aberto, bracos cruzados
    ("5.jpg",  "detox",        0.40, 0.38, 0.86),  # puxa para a estante da esquerda
    ("9.jpg",  "consulta",     0.42, 0.50, 0.98),
    ("3.jpg",  "mentoria",     0.44, 0.50, 0.90),
    ("4.jpg",  "conferencia",  0.42, 0.52, 0.94),
]

os.makedirs(SAIDA, exist_ok=True)

for arquivo, nome, fy, fx, zoom in PLANO:
    im = Image.open(os.path.join(ORIG, arquivo)).convert("RGB")
    w, h = im.size

    if w / h > RAZAO:
        ch, cw = h, int(h * RAZAO)
    else:
        cw, ch = w, int(w / RAZAO)

    cw, ch = int(cw * zoom), int(ch * zoom)

    cx = max(0, min(int(w * fx) - cw // 2, w - cw))
    cy = max(0, min(int(h * fy) - ch // 2, h - ch))

    corte = im.crop((cx, cy, cx + cw, cy + ch)).resize((LARG, ALT), Image.LANCZOS)
    destino = os.path.join(SAIDA, nome + ".jpg")
    corte.save(destino, "JPEG", quality=86, optimize=True, progressive=True)
    print(f"{nome:14s} <- {arquivo:7s} {cw}x{ch} em ({cx},{cy})  {os.path.getsize(destino)//1024} KB")
