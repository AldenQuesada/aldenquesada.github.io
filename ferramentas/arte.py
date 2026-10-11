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
# A imagem do card ocupa 47% da largura por toda a altura: fica quase
# quadrada (207x180 = 1.15). Enquadramento de meio-corpo.
print("bustos dos cards:")
BUSTOS = [
    # arquivo, nome, fy, fx, zoom
    #
    # 6.jpg ficou de fora: nela ele esta de olhos baixos, lendo. Em card
    # de venda o olhar precisa estar na camera.
    #
    # 3, 4, 5 e 10 sao quase a mesma foto (sentado, segurando livros), e
    # 8 e 9 tambem (mao no queixo). Onde elas se repetem, quem separa os
    # cards e o enquadramento: um fecha no rosto, o outro abre e pega a
    # mesa. Por isso 1.jpg aparece duas vezes, com planos diferentes.
    ("9.jpg",  "consulta",      0.42, 0.50, 0.70),  # fechado, atencioso
    ("4.jpg",  "mentoria",      0.47, 0.50, 0.86),
    ("1.jpg",  "conferencia",   0.46, 0.52, 1.00),  # plano aberto, em pe
    ("10.jpg", "diabetes-es",   0.50, 0.52, 0.86),  # capa ES legivel
    ("5.jpg",  "fin-diabetes",  0.525, 0.455, 0.80),  # puxa para a capa azul
    ("3.jpg",  "detox",         0.47, 0.50, 0.86),
    ("7.jpg",  "diabetes-en",   0.47, 0.50, 0.86),  # de perfil, quebra a serie
    ("8.jpg",  "diabetes-pt",   0.52, 0.52, 0.98),  # aberto, pega a mesa
    ("2.jpg",  "autoridade90",  0.40, 0.56, 0.86),
    ("1.jpg",  "contacto",      0.33, 0.57, 0.62),  # fechado no rosto
]
for arquivo, nome, fy, fx, zoom in BUSTOS:
    im = Image.open(os.path.join(ORIG, arquivo)).convert("RGB")
    salvar(recorte(im, 1.15, fy, fx, zoom), os.path.join(DEST, f"card/{nome}.jpg"), 560, 487)
