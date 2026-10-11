#!/usr/bin/env python3
"""Gera a arte da pagina no modelo Dr. Alexandre Duarte.

 - cenario de fundo: foto do escritorio desfocada e escurecida
 - bustos 3:4 para a faixa de cada card
 - avatar quadrado para o circulo do topo
"""
import sys, os
from PIL import Image, ImageFilter, ImageEnhance

ORIG = "/private/tmp/claude-501/-Users-drquesada/1aea2121-26b4-45a4-9936-e8a2d1834c55/images"
DEST = sys.argv[1]


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


def salvar(im, caminho, larg, alt, q=84):
    os.makedirs(os.path.dirname(caminho), exist_ok=True)
    im.resize((larg, alt), Image.LANCZOS).save(
        caminho, "JPEG", quality=q, optimize=True, progressive=True)
    print(f"  {os.path.relpath(caminho, DEST):28s} {larg}x{alt}  {os.path.getsize(caminho)//1024} KB")


# ---------------------------------------------------------------- cenario
# A foto do escritorio vira ambiente: desfocada, escura, sem leitura de
# detalhe. Ela existe para dar profundidade atras da coluna, nada mais.
print("cenario:")
base = Image.open(os.path.join(ORIG, "3.jpg")).convert("RGB")
cen = recorte(base, 0.75, 0.42, 0.50)                       # 3:4, vertical
cen = cen.filter(ImageFilter.GaussianBlur(radius=28))
cen = ImageEnhance.Brightness(cen).enhance(0.34)
cen = ImageEnhance.Color(cen).enhance(0.62)
salvar(cen, os.path.join(DEST, "fondo/cenario.jpg"), 1200, 1600, 72)

# Versao larga, para desktop.
cenw = recorte(base, 1.6, 0.40, 0.50)
cenw = cenw.filter(ImageFilter.GaussianBlur(radius=30))
cenw = ImageEnhance.Brightness(cenw).enhance(0.32)
cenw = ImageEnhance.Color(cenw).enhance(0.62)
salvar(cenw, os.path.join(DEST, "fondo/cenario-ancho.jpg"), 1920, 1200, 72)


# ---------------------------------------------------------------- avatar
print("avatar:")
av = Image.open(os.path.join(ORIG, "1.jpg")).convert("RGB")
salvar(recorte(av, 1.0, 0.31, 0.575, 0.46), os.path.join(DEST, "dr/avatar.jpg"), 320, 320, 88)


# ---------------------------------------------------------------- bustos
# Faixa vertical 3:4 de cada card. Fechado no busto, porque no card ela
# aparece com 126px de altura: plano aberto nao le.
print("bustos dos cards:")
BUSTOS = [
    #  arquivo,  nome,            fy,   fx,  zoom
    ("10.jpg", "diabetes-es",   0.46, 0.52, 0.60),
    ("6.jpg",  "fin-diabetes",  0.44, 0.48, 0.60),
    ("7.jpg",  "diabetes-en",   0.47, 0.50, 0.60),
    ("8.jpg",  "diabetes-pt",   0.43, 0.52, 0.60),
    ("5.jpg",  "detox",         0.44, 0.50, 0.60),
    ("2.jpg",  "autoridade90",  0.34, 0.62, 0.56),
    ("9.jpg",  "consulta",      0.42, 0.50, 0.58),
    ("3.jpg",  "mentoria",      0.44, 0.50, 0.60),
    ("4.jpg",  "conferencia",   0.42, 0.52, 0.58),
    ("1.jpg",  "contacto",      0.40, 0.55, 0.66),
]
for arquivo, nome, fy, fx, zoom in BUSTOS:
    im = Image.open(os.path.join(ORIG, arquivo)).convert("RGB")
    salvar(recorte(im, 0.75, fy, fx, zoom), os.path.join(DEST, f"card/{nome}.jpg"), 420, 560)
