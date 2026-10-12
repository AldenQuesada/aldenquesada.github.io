#!/usr/bin/env python3
"""Gera as imagens da pagina de mentoria.

A referencia tem foto em quase toda secao, e e isso que da peso a
pagina. Texto sobre preto puro fica leve demais para uma oferta de
acompanhamento.
"""
import sys, os
from PIL import Image, ImageFilter, ImageEnhance

ORIG = "/private/tmp/claude-501/-Users-drquesada/1aea2121-26b4-45a4-9936-e8a2d1834c55/images"
DEST = sys.argv[1]


def abrir(n):
    return Image.open(os.path.join(ORIG, n)).convert("RGB")


def recorte(im, razao, fy, fx, zoom=1.0):
    w, h = im.size
    if w / h > razao:
        ch, cw = h, int(h * razao)
    else:
        cw, ch = w, int(w / razao)
    cw, ch = int(cw * zoom), int(ch * zoom)
    cx = max(0, min(int(w * fx) - cw // 2, w - cw))
    cy = max(0, min(int(h * fy) - ch // 2, h - ch))
    return im.crop((cx, cy, cx + cw, cy + ch))


def salvar(im, nome, larg, alt, q=82):
    caminho = os.path.join(DEST, nome)
    os.makedirs(os.path.dirname(caminho), exist_ok=True)
    im.resize((larg, alt), Image.LANCZOS).save(
        caminho, "JPEG", quality=q, optimize=True, progressive=True)
    print(f"  {nome:22s} {larg}x{alt}  {os.path.getsize(caminho)//1024} KB")


print("mentoria:")

# Hero: ele no palco. Entra atras do texto, escurecido, por isso o
# brilho baixo: o titulo precisa ganhar da foto.
hero = recorte(abrir("13.png"), 1.9, 0.44, 0.52, 1.00)
hero = ImageEnhance.Brightness(hero).enhance(0.80)
salvar(hero, "hero.jpg", 1800, 947)

# Historia: autografando. A capa fica fora do quadro, cortada pela
# esquerda, porque nessa foto os livros sairam com o texto corrompido.
hist = recorte(abrir("11.png"), 0.84, 0.40, 0.52, 0.86)
salvar(hist, "historia.jpg", 900, 1071)

# Sobre: retrato de poltrona, o mais proximo de "mentor sentado".
sobre = recorte(abrir("15.png"), 0.84, 0.44, 0.50, 0.94)
salvar(sobre, "sobre.jpg", 900, 1071)

# Consultorio: ele atendendo, para a secao do que o mentorado recebe.
cons = recorte(abrir("14.png"), 1.9, 0.46, 0.52, 0.96)
cons = ImageEnhance.Brightness(cons).enhance(0.62)
salvar(cons, "consultorio.jpg", 1800, 947)

# Fundo de secao: palco desfocado, so textura.
fundo = recorte(abrir("13.png"), 1.9, 0.44, 0.50, 1.00)
fundo = fundo.filter(ImageFilter.GaussianBlur(18))
fundo = ImageEnhance.Brightness(fundo).enhance(0.42)
salvar(fundo, "fundo-secao.jpg", 1600, 842, 74)
