from PIL import Image

PAL = {
 '.': None,            # transparent
 'g': (106,190,48),    # grass light
 'G': (75,153,40),     # grass dark
 'f': (255,235,90),    # flower yellow
 'w': (255,255,255),   # white
 'd': (122,82,48),     # soil
 'D': (92,60,34),      # soil dark
 'k': (150,104,62),    # soil light ridge
 'o': (245,140,40),    # carrot orange
 'O': (210,105,25),    # carrot dark
 'l': (75,153,40),     # leaf
 'L': (106,190,48),    # leaf light
 'b': (60,120,200),    # water
 'B': (40,90,170),     # water dark
 's': (120,200,255),   # water shine
}

def spr(grid):
    h=len(grid); w=len(grid[0])
    img=Image.new("RGBA",(w,h),(0,0,0,0))
    px=img.load()
    for y,row in enumerate(grid):
        for x,c in enumerate(row):
            col=PAL.get(c)
            if col: px[x,y]=col+(255,)
    return img

grass=[
"gggggggggggggggg","gGgggggfgggggggg","ggggggwfwggggggg","gggGgggfggggggGg",
"ggggggggggggggGg","ggGggggggggggggg","gggggggggGgggggg","gggggggggggggggg",
"gggggggggggggggg","gggGgggggggfgggg","ggggggggggwfwggg","gGggggggggGfgggg",
"ggggggGggggggggg","gggggggggggggGgg","gGgggggggggggggg","gggggggggggggggg"]

soil=[
"dddddddddddddddd","dkkdkkdkkdkkdkkd","dDDdDDdDDdDDdDDd","dddddddddddddddd",
"dkkdkkdkkdkkdkkd","dDDdDDdDDdDDdDDd","dddddddddddddddd","dkkdkkdkkdkkdkkd",
"dDDdDDdDDdDDdDDd","dddddddddddddddd","dkkdkkdkkdkkdkkd","dDDdDDdDDdDDdDDd",
"dddddddddddddddd","dkkdkkdkkdkkdkkd","dDDdDDdDDdDDdDDd","dddddddddddddddd"]

sprout=[
"................",".......l........","......lLl.......",".......l........",
"......lLl.......",".......l........","................","......d.d.......",
".....dddd d.....","....dkkdkkd.....","....dDDdDDd.....","....dddddddd....",
"................","................","................","................"]

mid=[
".......l........","......lLl.......",".....l l l......","......lLl.......",
".....l l l......","......lll.......",".......o........","......ooo.......",
"......oOo.......",".....dddd d.....","....dkkdkkd.....","....dDDdDDd.....",
"....dddddddd....","................","................","................"]

carrot=[
"......l.l.......",".....lLlLl......","....l lLl l.....",".....lLlLl......",
"......lll.......",".....ooooo......","....ooooooo.....","....oOoooOo.....",
".....ooooo......",".....oOoOo......","......ooo.......",".......o.......",
"................","................","................","................"]

water=[
"bbbbbbbbbbbbbbbb","bBbbbbbbbbbbbBbb","bbbbsbbbbbbbbbbb","bbbbbbbbbbbsbbbb",
"bbbbbbbbbbbbbbbb","bBbbbbbbbBbbbbbb","bbbbbbbbbbbbbbbb","bbbssbbbbbbbbbbb",
"bbbbbbbbbbbbbBbb","bbbbbbbbbbbbbbbb","bBbbbbbbbbbbbbbb","bbbbbbbbsbbbbbbb",
"bbbbbbbbbbbbbbbb","bbbbbBbbbbbbbbbb","bbbbbbbbbbbbbbbb","bbbbbbbbbbbBbbbb"]

sprites=[("grass",grass),("soil",soil),("sprout",sprout),("growing",mid),("carrot",carrot),("water",water)]
S=14; pad=10; lbl=18
sheet=Image.new("RGBA",(len(sprites)*(16*S+pad)+pad, 16*S+pad*2+lbl),(34,40,49,255))
x=pad
for name,g in sprites:
    im=spr(g).resize((16*S,16*S),Image.NEAREST)
    sheet.paste(im,(x,pad),im)
    x+=16*S+pad
sheet.save("scratch/pixel/farm-demo.png")
print("saved farm-demo.png", sheet.size)
