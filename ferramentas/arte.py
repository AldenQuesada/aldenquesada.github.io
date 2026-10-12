#!/usr/bin/env python3
"""Gera toda a arte da pagina a partir das fotos do Dr. Quesada.

As fotos da sessao profissional (11 a 15) substituem as de celular onde
ele nao aparece com livro na mao. Onde aparece, a de celular fica: e ela
que mostra a capa.

Nao usar 11.png com a capa legivel: nela os livros sairam com o texto
corrompido ("QUESSADA" com dois S, "De invisivel" sem acento, pilha da
esquerda espelhada). So o gesto de autografar se aproveita.
"""
import sys, os
from PIL import Image, ImageFilter, ImageEnhance, ImageDraw

ORIG = "/private/tmp/claude-501/-Users-drquesada/1aea2121-26b4-45a4-9936-e8a2d1834c55/images"
DEST = sys.argv[1]
FUNDO = (14, 11, 8)


def abrir(nome):
    return Image.open(os.path.join(ORIG, nome)).convert("RGB")


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


def salvar(im, caminho, larg, alt, q=86):
    os.makedirs(os.path.dirname(caminho), exist_ok=True)
    im.resize((larg, alt), Image.LANCZOS).save(
        caminho, "JPEG", quality=q, optimize=True, progressive=True)
    print(f"  {os.path.relpath(caminho, DEST):30s} {larg}x{alt}  {os.path.getsize(caminho)//1024} KB")


def figura(nome, razao, fy, fx, zoom, alt_px):
    im = recorte(abrir(nome), razao, fy, fx, zoom)
    return im.resize((int(im.width * alt_px / im.height), alt_px), Image.LANCZOS)


def mascara_dissolve(tam, borda):
    """Apaga a borda indicada, para a figura nascer da escuridao."""
    m = Image.new("L", tam, 255)
    d = ImageDraw.Draw(m)
    faixa = int(tam[0] * 0.5)
    for x in range(faixa):
        v = int(255 * (x / faixa) ** 1.4)
        col = x if borda == "esquerda" else tam[0] - 1 - x
        d.line([(col, 0), (col, tam[1])], fill=v)
    return m


# ---------------------------------------------------------------- cenario
# No modelo da referencia: ele sentado de um lado, em pe do outro, e o
# meio escuro e vazio, porque e por ali que a coluna de cards desce.
print("cenario:")
W, H = 1920, 1200
cen = Image.new("RGB", (W, H), FUNDO)

sentado = figura("15.png", 0.74, 0.46, 0.50, 1.00, H)
empe    = figura("12.png", 0.68, 0.42, 0.50, 1.00, H)

# A borda que encosta no centro e a que dissolve.
cen.paste(sentado, (-int(sentado.width * 0.12), 0), mascara_dissolve(sentado.size, "direita"))
cen.paste(empe, (W - empe.width + int(empe.width * 0.12), 0), mascara_dissolve(empe.size, "esquerda"))

cen = ImageEnhance.Brightness(cen).enhance(0.50)
cen = ImageEnhance.Color(cen).enhance(0.74)

# Fecha o centro: e ali que a coluna de cards passa por cima.
veu = Image.new("L", (W, H), 0)
dv = ImageDraw.Draw(veu)
for x in range(W):
    t = abs(x - W / 2) / (W / 2)      # 0 no centro, 1 nas bordas
    dv.line([(x, 0), (x, H)], fill=int(232 * max(0.0, 1 - t * 1.75)))
cen.paste(Image.new("RGB", (W, H), FUNDO), (0, 0), veu)
salvar(cen, os.path.join(DEST, "fondo/cenario-ancho.jpg"), W, H, 76)

# No celular quase so se ve a faixa central: basta textura escura.
cenm = recorte(abrir("15.png"), 0.75, 0.44, 0.50)
cenm = cenm.filter(ImageFilter.GaussianBlur(30))
cenm = ImageEnhance.Brightness(cenm).enhance(0.30)
cenm = ImageEnhance.Color(cenm).enhance(0.66)
salvar(cenm, os.path.join(DEST, "fondo/cenario.jpg"), 1200, 1600, 74)


# ---------------------------------------------------------------- avatar
print("avatar:")
salvar(recorte(abrir("12.png"), 1.0, 0.27, 0.50, 0.42),
       os.path.join(DEST, "dr/avatar.jpg"), 400, 400, 90)


# ----------------------------------------------------------------- cards
# A imagem do card e quase quadrada: 47% da largura por toda a altura.
print("cards:")
CARDS = [
    # arquivo,   nome,             fy,    fx,    zoom
    ("14.png", "consulta",       0.46,  0.52,  0.94),  # jaleco, paciente
    ("15.png", "mentoria",       0.46,  0.50,  0.90),  # poltrona
    ("13.png", "conferencia",    0.46,  0.58,  0.92),  # palco
    ("10.jpg", "diabetes-es",    0.50,  0.52,  0.86),  # capa ES na mao
    ("5.jpg",  "fin-diabetes",   0.525, 0.455, 0.80),  # capa azul na mao
    ("11.png", "adelgazamiento", 0.62,  0.46,  0.56),  # gesto de autografar
    ("12.png", "contacto",       0.44,  0.50,  0.88),  # retrato que convida
]
for arquivo, nome, fy, fx, zoom in CARDS:
    salvar(recorte(abrir(arquivo), 1.15, fy, fx, zoom),
           os.path.join(DEST, f"card/{nome}.jpg"), 560, 487)


# ----------------------------------------------------- slides do carrossel
# Segundo e terceiro quadro dos cards de livro. Enquanto os mockups nao
# chegam, saem das mesmas fotos, mas enquadrados no LIVRO, nao no rosto:
# o carrossel existe para mostrar o produto, nao para repetir a pessoa.
print("slides:")
SLIDES = [
    # So capa em espanhol pode aparecer: os livros em ingles e portugues
    # sairam da pagina, e mostra-los num slide desmente a propria vitrine.
    ("10.jpg", "diabetes-es-2",    0.615, 0.565, 0.40),  # capa branca ES
    ("3.jpg",  "diabetes-es-3",    0.600, 0.520, 0.44),  # as duas capas ES
    ("5.jpg",  "fin-diabetes-2",   0.620, 0.430, 0.42),  # capa azul ES
    ("6.jpg",  "fin-diabetes-3",   0.610, 0.520, 0.44),  # capa azul na mao
    ("11.png", "adelgazamiento-2", 0.560, 0.520, 0.42),  # caneta e assinatura
]
for arquivo, nome, fy, fx, zoom in SLIDES:
    salvar(recorte(abrir(arquivo), 1.15, fy, fx, zoom),
           os.path.join(DEST, f"card/{nome}.jpg"), 560, 487)


# ------------------------------------------------------- card do canal
# Ele dos dois lados, ambiente no meio, tudo em preto e branco. O P&B e
# o que separa esse card da pilha colorida: antes de ler, ja se percebe
# que ali e outra coisa. O play e o icone do YouTube sao desenhados em
# SVG pelo render, nao ficam na imagem.
print("canal:")
LC, AC = 1200, 492                      # 2,44:1, a proporcao do card
canal = Image.new("RGB", (LC, AC), FUNDO)

esq = figura("15.png", 0.80, 0.42, 0.50, 1.00, AC)
dir = figura("12.png", 0.72, 0.40, 0.50, 1.00, AC)

canal.paste(esq, (-int(esq.width * 0.18), 0), mascara_dissolve(esq.size, "direita"))
canal.paste(dir, (LC - dir.width + int(dir.width * 0.18), 0), mascara_dissolve(dir.size, "esquerda"))

canal = ImageEnhance.Color(canal).enhance(0.0)      # preto e branco
canal = ImageEnhance.Brightness(canal).enhance(0.74)
canal = ImageEnhance.Contrast(canal).enhance(1.12)

# Escurece o meio, onde entram o play e o nome do canal.
veu = Image.new("L", (LC, AC), 0)
dv = ImageDraw.Draw(veu)
for x in range(LC):
    t = abs(x - LC / 2) / (LC / 2)
    dv.line([(x, 0), (x, AC)], fill=int(150 * max(0.0, 1 - t * 1.25)))
canal.paste(Image.new("RGB", (LC, AC), (0, 0, 0)), (0, 0), veu)

salvar(canal, os.path.join(DEST, "card/canal.jpg"), LC, AC, 82)
