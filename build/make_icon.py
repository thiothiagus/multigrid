from PIL import Image, ImageDraw

SIZE = 256
img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
d = ImageDraw.Draw(img)

# Fundo: quadrado arredondado escuro
bg = (20, 22, 26, 255)
d.rounded_rectangle([0, 0, SIZE - 1, SIZE - 1], radius=48, fill=bg)

# Grade 2x2 de quadrados coloridos (representa os "paineis")
pad = 28
gap = 14
cell = (SIZE - 2 * pad - gap) // 2
colors = [(79, 140, 255, 255), (255, 138, 101, 255), (108, 217, 168, 255), (255, 209, 102, 255)]
positions = [
    (pad, pad),
    (pad + cell + gap, pad),
    (pad, pad + cell + gap),
    (pad + cell + gap, pad + cell + gap),
]
for (x, y), c in zip(positions, colors):
    d.rounded_rectangle([x, y, x + cell, y + cell], radius=18, fill=c)

img.save("/home/claude/multiconta/build/icon.png")

# .ico multi-resolucao (Windows) a partir do mesmo desenho
sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)]
img.save("/home/claude/multiconta/build/icon.ico", sizes=sizes)

print("icones gerados")
