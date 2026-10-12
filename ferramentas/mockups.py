#!/usr/bin/env python3
"""Encaixa os mockups de livro nos quadros do card.

Os arquivos vem quadrados, com alfa e muita margem vazia. Aqui a margem
e cortada pelo conteudo real, o mockup e encaixado na proporcao do card
(1,15:1) sobre a cor daquele card, e ganha uma sombra suave por baixo.
"""
import sys, os
from PIL import Image, ImageFilter

DEST = sys.argv[1]
LARG, ALT = 560, 487
RAZAO = LARG / ALT


def hexrgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def encaixar(origem, destino, cor_fundo, ocupacao=0.86, deslocamento=0.0):
    """ocupacao = quanto da altura do quadro o mockup ocupa."""
    im = Image.open(origem).convert("RGBA")

    # Corta a margem transparente: o que importa e o objeto, nao o arquivo.
    caixa = im.getbbox()
    if caixa:
        im = im.crop(caixa)

    alvo_h = int(ALT * ocupacao)
    alvo_w = int(im.width * alvo_h / im.height)
    if alvo_w > LARG * 0.94:                      # mockup largo: limita pela largura
        alvo_w = int(LARG * 0.94)
        alvo_h = int(im.height * alvo_w / im.width)
    im = im.resize((alvo_w, alvo_h), Image.LANCZOS)

    fundo = Image.new("RGB", (LARG, ALT), hexrgb(cor_fundo))
    x = (LARG - alvo_w) // 2
    y = int((ALT - alvo_h) / 2 + ALT * deslocamento)

    # Sombra: a silhueta do proprio mockup, borrada e deslocada.
    sombra = Image.new("RGBA", (LARG, ALT), (0, 0, 0, 0))
    sombra.paste(Image.new("RGBA", im.size, (0, 0, 0, 150)), (x, y + 10), im)
    sombra = sombra.filter(ImageFilter.GaussianBlur(14))
    fundo.paste(Image.new("RGB", (LARG, ALT), (0, 0, 0)), (0, 0), sombra.split()[3])

    fundo.paste(im, (x, y), im)

    os.makedirs(os.path.dirname(destino), exist_ok=True)
    fundo.save(destino, "JPEG", quality=88, optimize=True, progressive=True)
    print(f"  {os.path.relpath(destino, DEST):28s} {LARG}x{ALT}  {os.path.getsize(destino)//1024} KB")


ORIG = "/private/tmp/claude-501/-Users-drquesada/1aea2121-26b4-45a4-9936-e8a2d1834c55/scratchpad/mockups-mujer"
COR = "#13251a"          # verde escuro, puxado da capa

print("Mujer Delgada & Saludable:")
# 03.png fica de fora: e pagina de texto corrido. Em 207 pixels de
# largura vira mancha cinza, e quadro ilegivel so atrapalha.
encaixar(f"{ORIG}/01.png", f"{DEST}/card/mujer-delgada.jpg",   COR, 0.92)
encaixar(f"{ORIG}/02.png", f"{DEST}/card/mujer-delgada-2.jpg", COR, 0.80)
encaixar(f"{ORIG}/04.png", f"{DEST}/card/mujer-delgada-3.jpg", COR, 0.80)


ORIG2 = "/private/tmp/claude-501/-Users-drquesada/1aea2121-26b4-45a4-9936-e8a2d1834c55/scratchpad/mockups-findm"
COR2 = "#0d2138"          # azul profundo, puxado da capa

print("El fin de la Diabetes Mellitus:")
# Dos oito, entram tres. Fora ficaram:
#   08  capa em perspectiva: em 207 pixels a lombada vira borrao
#   01, 06  paginas de texto corrido, viram mancha
#   04, 05  aberturas boas, mas 02 ja cumpre o papel
encaixar(f"{ORIG2}/mockup elfindelaDM_07.png", f"{DEST}/card/fin-diabetes.jpg",   COR2, 0.92)
encaixar(f"{ORIG2}/mockup elfindelaDM_02.png", f"{DEST}/card/fin-diabetes-2.jpg", COR2, 0.80)
encaixar(f"{ORIG2}/mockup elfindelaDM_03.png", f"{DEST}/card/fin-diabetes-3.jpg", COR2, 0.80)


ORIG3 = "/private/tmp/claude-501/-Users-drquesada/1aea2121-26b4-45a4-9936-e8a2d1834c55/scratchpad/mockups-dm"
COR3 = "#241812"          # marrom profundo, para a capa clara saltar

print("Diabetes Mellitus: El fin de las complicaciones:")
# Por enquanto so a capa. Os demais mockups vem na proxima rodada: ate
# la o card fica com um quadro so, em vez de misturar mockup limpo com
# foto de celular no mesmo carrossel.
# Dos quatro miolos entraram dois. O criterio e sempre o mesmo: o que
# se le com 207 pixels de largura.
#   18 Licuado    foto grande do suco verde, cor forte, le na hora
#   19 Tabla de Control  a grade dourada vira padrao listrado, e le
#   20 Diagnostico       as setas aparecem, mas cercadas de texto cinza
#   21 Procedimiento     texto corrido, vira mancha
# Escolhido olhando os quatro renderizados a 207x180, o tamanho de tela.
encaixar(f"{ORIG3}/capa.png", f"{DEST}/card/diabetes-es.jpg",   COR3, 0.94)
encaixar(f"{ORIG3}/18.png",   f"{DEST}/card/diabetes-es-2.jpg", COR3, 0.80)
encaixar(f"{ORIG3}/19.png",   f"{DEST}/card/diabetes-es-3.jpg", COR3, 0.80)
