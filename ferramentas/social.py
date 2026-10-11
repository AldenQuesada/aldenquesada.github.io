#!/usr/bin/env python3
"""Gera a previa de compartilhamento (Open Graph) e os icones.

A previa e o que aparece quando o link e colado no WhatsApp, no
Instagram ou no Facebook. Sem ela, o compartilhamento mostra um quadrado
cinza ou o avatar esticado.
"""
import sys, os
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance, ImageFont

ORIG = "/private/tmp/claude-501/-Users-drquesada/1aea2121-26b4-45a4-9936-e8a2d1834c55/images"
DEST = sys.argv[1]

GEORGIA      = "/System/Library/Fonts/Supplemental/Georgia.ttf"
GEORGIA_NEG  = "/System/Library/Fonts/Supplemental/Georgia Bold.ttf"

FUNDO  = (14, 11, 8)
TEXTO  = (240, 222, 208)
OURO   = (201, 162, 39)


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


# ------------------------------------------------------- previa Open Graph
# 1200x630 e a medida que WhatsApp, Facebook e LinkedIn esperam.
W, H = 1200, 630
og = Image.new("RGB", (W, H), FUNDO)

# Ambiente ao fundo, desfocado, para a arte nao ficar chapada.
amb = Image.open(os.path.join(ORIG, "3.jpg")).convert("RGB")
amb = recorte(amb, W / H, 0.42, 0.50).resize((W, H), Image.LANCZOS)
amb = amb.filter(ImageFilter.GaussianBlur(26))
amb = ImageEnhance.Brightness(amb).enhance(0.30)
og.paste(amb, (0, 0))

# Ele de corpo, nitido, a direita.
fig = Image.open(os.path.join(ORIG, "1.jpg")).convert("RGB")
fig = recorte(fig, 0.72, 0.44, 0.56, 1.00)
fh = H
fw = int(fig.width * fh / fig.height)
fig = fig.resize((fw, fh), Image.LANCZOS)

# A figura e colada com a borda esquerda dissolvida. Sem isso fica uma
# linha vertical dura na emenda com o texto.
mascara = Image.new("L", (fw, fh), 255)
dm = ImageDraw.Draw(mascara)
dissolve = int(fw * 0.42)
for x in range(dissolve):
    dm.line([(x, 0), (x, fh)], fill=int(255 * (x / dissolve) ** 1.6))
og.paste(fig, (W - fw + 40, 0), mascara)

# Veu da esquerda, para o texto ter onde pousar.
veu = Image.new("L", (W, H), 0)
dv = ImageDraw.Draw(veu)
for x in range(W):
    t = x / W
    dv.line([(x, 0), (x, H)], fill=int(255 * max(0.0, min(1.0, 1.15 - t * 1.55))))
og.paste(Image.new("RGB", (W, H), FUNDO), (0, 0), veu)

d = ImageDraw.Draw(og)
f_nome = ImageFont.truetype(GEORGIA, 62)
f_cred = ImageFont.truetype(GEORGIA, 26)
f_itens = ImageFont.truetype(GEORGIA, 24)

x0, y0 = 72, 196
d.text((x0, y0), "Dr. Alden J.", font=f_nome, fill=TEXTO)
d.text((x0, y0 + 74), "Quesada", font=f_nome, fill=TEXTO)
d.line([(x0, y0 + 168), (x0 + 96, y0 + 168)], fill=OURO, width=2)
d.text((x0, y0 + 192), "Especialista en Cardiología", font=f_cred, fill=TEXTO)
d.text((x0, y0 + 226), "y Naturópata", font=f_cred, fill=TEXTO)
d.text((x0, y0 + 286), "Libros · Consultas · Mentorías", font=f_itens, fill=(163, 144, 127))

os.makedirs(os.path.join(DEST, "social"), exist_ok=True)
caminho = os.path.join(DEST, "social/og.jpg")
og.save(caminho, "JPEG", quality=88, optimize=True, progressive=True)
print(f"  social/og.jpg               {W}x{H}  {os.path.getsize(caminho)//1024} KB")


# ------------------------------------------------------------------ icones
av = Image.open(os.path.join(DEST, "dr/avatar.jpg")).convert("RGB")
for lado, nome in [(180, "apple-touch-icon.png"), (64, "favicon.png")]:
    ic = av.resize((lado, lado), Image.LANCZOS)
    p = os.path.join(DEST, "social", nome)
    ic.save(p, "PNG", optimize=True)
    print(f"  social/{nome:22s} {lado}x{lado}  {os.path.getsize(p)//1024} KB")
