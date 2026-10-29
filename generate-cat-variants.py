from pathlib import Path
from xml.etree import ElementTree as ET
from PIL import Image,ImageDraw,ImageFont
import cairosvg,json
from io import BytesIO
from copy import deepcopy
R=Path(__file__).resolve().parent; OUT=R/'jazz-cat-assets'; OUT.mkdir(exist_ok=True)
BASE={
 'luna':dict(name='Luna',coat='Calico',personality='Curious & cozy',age='Adult',build='Medium',shape='medium',body='#f5e8d0',head='#fff0d5',ears='#ca8355',patch='#b96537',accent='#fff6e8',eye='#354035',collar='#76a48c'),
 'milo':dict(name='Milo',coat='Tuxedo',personality='Quiet & thoughtful',age='Adult',build='Slim',shape='slim',body='#353943',head='#303642',ears='#555665',patch='#f5f0e6',accent='#f5f0e6',eye='#e2c881',collar='#7896bf'),
 'maple':dict(name='Maple',coat='Ginger tabby',personality='Playful & energetic',age='Young adult',build='Lean',shape='young',body='#d98a43',head='#e9a455',ears='#ac663e',patch='#a65b30',accent='#ffd6a0',eye='#3a4536',collar='#6eab99'),
 'mochi':dict(name='Mochi',coat='Cream',personality='Gentle & sleepy',age='Kitten',build='Tiny',shape='kitten',body='#f4e6d7',head='#f7e9df',ears='#d9aeae',patch='#dcc2b2',accent='#fffaf0',eye='#665359',collar='#d6a6bb'),
 'pepper':dict(name='Pepper',coat='Dark charcoal gray',personality='Wise & mellow',age='Senior',build='Fluffy',shape='senior',body='#373742',head='#42414b',ears='#66616e',patch='#5c5965',accent='#686874',eye='#ebce96',collar='#bb8bb9'),
 'patches':dict(name='Patches',coat='Gray and white',personality='Friendly & goofy',age='Adult',build='Chubby',shape='chubby',body='#8b979e',head='#e0e6df',ears='#8a9194',patch='#68747d',accent='#f5f1e7',eye='#425453',collar='#efb09a'),
 'chai':dict(name='Chai',coat='Siamese',personality='Elegant & vocal',age='Adult',build='Slender',shape='long',body='#dcc8ab',head='#ead9c1',ears='#69564b',patch='#6f574d',accent='#e5d0af',eye='#74a2d9',collar='#8bac94'),
 'biscuit':dict(name='Biscuit',coat='Brown tabby',personality='Adventurous & cozy',age='Adult',build='Large',shape='large',body='#ab795c',head='#bc8668',ears='#825948',patch='#745346',accent='#e0b899',eye='#36513f',collar='#dda16f'),
}
# (body width, head width, head top, body top, body base, paw size, ear height, tail type)
SHAPES={
 'medium':(35,30,18,35,55,7,10,'curved'),
 'slim':(27,26,16,32,55,5,11,'slim'),
 'young':(31,28,18,35,55,6,11,'upright'),
 'kitten':(23,27,23,39,55,5,11,'tiny'),
 'senior':(43,34,17,34,55,7,9,'bushy'),
 'chubby':(44,33,19,35,55,8,9,'short'),
 'long':(28,27,16,32,55,5,13,'slim'),
 'large':(46,34,20,36,55,8,10,'thick'),
}
STROKE='#56473f'
def p(v):return f'{v:g}'
def svg_for(id,c):
 width,hw,hy,bt,base,paw,eh,tt=SHAPES[c['shape']]
 # kitten intentionally has the biggest head/body ratio; senor + chubby have rounder bodies
 cx=32; bl=cx-width/2; br=cx+width/2; hl=cx-hw/2; hr=cx+hw/2
 hbottom=hy+(23 if c['shape']!='kitten' else 22)
 bl,br,hl,hr=[round(x,1) for x in [bl,br,hl,hr]]
 body=f'M {p(bl+4)} {p(bt)} H {p(br-5)} V {p(bt+3)} H {p(br-2)} V 49 H {p(br)} V 55 H {p(bl)} V 50 H {p(bl+2)} V {p(bt+4)} H {p(bl+4)} Z'
 head=f'M {p(hl+3)} {hy} H {p(hr-3)} V {hy+2} H {p(hr)} V {hy+17} H {p(hr-2)} V {p(hbottom-2)} H {p(hl+2)} V {p(hbottom-3)} H {p(hl)} V {hy+3} H {p(hl+3)} Z'
 ears_left=f'M {p(hl+3)} {hy+5} V {hy-eh} H {p(hl+8)} L {p(hl+14)} {hy+3} Z'
 ears_right=f'M {p(hr-14)} {hy+3} L {p(hr-8)} {hy-eh} H {p(hr-3)} V {hy+5} Z'
 if tt in ('slim','upright'):
  tail=f'M {p(br-2)} 49 H {p(br+5)} V {p(bt-10)} H {p(br+8)} V {p(bt-16)} H {p(br+11)} V {p(bt-5)} H {p(br+8)} V 53 H {p(br-2)} Z'
 elif tt in ('bushy','thick'):
  x1=min(br+2,57);x2=min(br+6,60);x3=min(br+9,62)
  tail=f'M {p(br-4)} 49 H {p(x1)} V 45 H {p(x2)} V {p(bt-6)} H {p(x3)} V {p(bt-16)} H 63 V {p(bt-4)} H {p(x3)} V 52 H {p(br-4)} Z'
 elif tt=='short':
  tail=f'M {p(br-4)} 46 H {p(br+3)} V 38 H {p(br+8)} V 48 H {p(br+4)} V 53 H {p(br-4)} Z'
 elif tt=='tiny':
  tail=f'M {p(br-2)} 48 H {p(br+4)} V 43 H {p(br+7)} V 51 H {p(br+2)} V 55 H {p(br-2)} Z'
 else:
  tail=f'M {p(br-3)} 49 H {p(br+5)} V {p(bt-7)} H {p(br+9)} V {p(bt-13)} H {p(br+12)} V {p(bt-2)} H {p(br+9)} V 53 H {p(br-3)} Z'
 # two rear paws at extreme edges, two fore paws in center. Exactly 4 visible shapes.
 pw=paw; xs=[bl+2,br-2-pw,26-pw/2,34-pw/2]
 paws=''.join(f'<rect data-anatomy="paw" x="{p(x)}" y="{54 if i<2 else 53}" width="{pw}" height="{6 if i<2 else 7}" rx="1" fill="{c["body"] if i<2 else c["accent"]}" stroke="{STROKE}" stroke-width="1.2" />' for i,x in enumerate(xs))
 # symmetrical anchored face; nose, mouth and eyes move as a single group. No asymmetrical AI face drift.
 ey=hy+12; ny=hy+18; iris=c['eye']; eyeh=2 if c['shape'] in ['senior','kitten'] else 3
 eyes=f'<rect data-face="eye" x="{p(cx-7)}" y="{ey}" width="2.5" height="{eyeh}" fill="{iris}"/><rect data-face="eye" x="{p(cx+4.5)}" y="{ey}" width="2.5" height="{eyeh}" fill="{iris}"/>'
 if c['shape']=='kitten':
  eyes=f'<rect data-face="eye" x="{p(cx-7)}" y="{ey}" width="3" height="3" rx="0.5" fill="{iris}"/><rect data-face="eye" x="{p(cx+4)}" y="{ey}" width="3" height="3" rx="0.5" fill="{iris}"/>'
 # Face patches behind eyes; texture never overlaps nose/mouth. Calico asymmetry only in coat patterns.
 headpatch=''
 if id=='luna':headpatch=f'<path d="M {p(hl+2)} {hy+5} H {p(hl+10)} V {hy+11} H {p(hl+2)} Z M {p(hr-9)} {hy+3} H {p(hr-2)} V {hy+9} H {p(hr-9)} Z" fill="{c["patch"]}"/>'
 if id=='milo':headpatch=f'<path d="M {p(hl+9)} {hy+10} H {p(hr-9)} V {hy+19} H {p(hl+9)} Z" fill="{c["patch"]}" opacity=".85"/>'
 if id=='patches':headpatch=f'<path d="M {p(hl+2)} {hy+4} H {p(hl+12)} V {hy+12} H {p(hl+2)} Z M {p(hr-8)} {hy+2} H {p(hr-2)} V {hy+7} H {p(hr-8)} Z" fill="{c["patch"]}"/>'
 if id=='chai':headpatch=f'<path d="M {p(cx-9)} {hy+10} H {p(cx+9)} V {hy+20} H {p(cx-9)} Z" fill="{c["patch"]}"/>'
 if id=='pepper':headpatch=f'<path d="M {p(hl+2)} {hy+20} H {p(hr-2)} V {p(hbottom-3)} H {p(hl+2)} Z" fill="{c["accent"]}" opacity=".45"/>'
 marks=''
 if id in ['maple','biscuit']:
  marks=f'<g fill="{c["patch"]}"><rect x="{p(cx-4)}" y="{hy+2}" width="2" height="5"/><rect x="{p(cx+2)}" y="{hy+2}" width="2" height="5"/><rect x="{p(cx-1)}" y="{hy+2}" width="2" height="3"/></g>'
 # Siamese face eyes should be on top of mask, symmetrical by coordinate.
 muzzle=f'<path d="M {p(cx-8)} {ny-2} H {p(cx+8)} V {ny+3} H {p(cx-8)} Z" fill="{c["accent"]}" opacity=".85"/>' if id not in ['chai','milo'] else ''
 # 3 pixel symmetric center nose and downturned curves.
 face=f'''{eyes}<path d="M {p(cx-1.5)} {ny} h3 v2 h-3 z" fill="#c87c78"/><path d="M {cx} {ny+2} v2 m0 0 h-3 m3 0 h3" fill="none" stroke="{STROKE}" stroke-width="1"/><path d="M {p(hl+2)} {ny+1} H {p(hl+8)} M {p(hl+3)} {ny+4} H {p(hl+8)} M {p(hr-8)} {ny+1} H {p(hr-2)} M {p(hr-8)} {ny+4} H {p(hr-3)}" stroke="{STROKE}" stroke-width=".75"/>'''
 # Accessory: soft small collar that does not create an extra mouth
 accessories=f'<path d="M 29 {p(hbottom+1)} L 32 {p(hbottom+4)} L 35 {p(hbottom+1)} L 32 {p(hbottom-1)} Z" fill="{c["collar"]}" stroke="{STROKE}" stroke-width=".6"/>'
 # fur collar to make senior fluffy; no extra limbs or extra ear paths
 fluff=''
 if c['shape']=='senior':fluff=f'<path d="M {p(hl-1)} {hy+17} h-3 v4 h3 v3 h3 M {p(hr+1)} {hy+17} h3 v4 h-3 v3 h-3" fill="none" stroke="{c["head"]}" stroke-width="3"/>'
 striping=''
 if id in ['maple','biscuit']:
  striping=f'<g stroke="{c["patch"]}" stroke-width="2.8"><path d="M {p(bl+4)} 39 h7 M {p(br-10)} 39 h7 M {p(bl+4)} 44 h6 M {p(br-10)} 44 h7"/></g>'
 # isolated structural SVG groups make anatomy validation explicit and reliable.
 return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="256" height="256" role="img" aria-label="{c['name']}, {c['age'].lower()}, {c['build'].lower()} {c['coat'].lower()} cat" shape-rendering="crispEdges">
<title>{c['name']} the jazz cat, {c['age'].lower()} and {c['build'].lower()}</title>
<g id="tail" data-anatomy="tail"><path d="{tail}" fill="{c['body']}" stroke="{STROKE}" stroke-width="1.4" stroke-linejoin="miter" /></g>
<g id="body" data-anatomy="body"><path d="{body}" fill="{c['body']}" stroke="{STROKE}" stroke-width="1.5" stroke-linejoin="miter"/>{striping}<path d="M {p(bl+8)} 50 H {p(br-8)} V 54 H {p(bl+8)} Z" fill="{c['accent']}" opacity=".3"/></g>
<g id="hind-paws">{paws[:paws.find('<rect data-anatomy="paw"',10)] if False else ''}</g>
<g id="ears"><path data-anatomy="ear" d="{ears_left}" fill="{c['ears']}" stroke="{STROKE}" stroke-width="1.5"/><path data-anatomy="ear" d="{ears_right}" fill="{c['ears']}" stroke="{STROKE}" stroke-width="1.5"/><path d="M {p(hl+5)} {hy+1} V {hy-eh+5} L {p(hl+9)} {hy+1} Z M {p(hr-9)} {hy+1} L {p(hr-5)} {hy-eh+5} V {hy+1} Z" fill="#dda9a9"/></g>
<g id="head" data-anatomy="head"><path d="{head}" fill="{c['head']}" stroke="{STROKE}" stroke-width="1.5" stroke-linejoin="miter"/>{headpatch}{marks}{fluff}</g>
<g id="muzzle">{muzzle}</g><g id="face">{face}</g>
<g id="paws">{paws}</g><g id="collar">{accessories}</g>
</svg>'''

out=[]
for id,c in BASE.items():
 svg=svg_for(id,c);file=OUT/f'{id}.svg';file.write_text(svg)
 rr=ET.fromstring(svg); ns={'s':'http://www.w3.org/2000/svg'}
 checks={n:len(rr.findall(f'.//*[@data-anatomy="{n}"]')) for n in ['head','ear','paw','tail']};checks['eye']=len(rr.findall('.//*[@data-face="eye"]'))
 assert checks=={'head':1,'ear':2,'paw':4,'tail':1,'eye':2},(id,checks)
 (OUT/f'{id}.png').write_bytes(cairosvg.svg2png(bytestring=svg.encode(),output_width=256,output_height=256))
 out.append(dict(id=id,name=c['name'],coat=c['coat'],character=c['personality'],age=c['age'],build=c['build'],shape=c['shape']))
(OUT/'cats.json').write_text(json.dumps(out,indent=2))
# Card sheet 4 columns x 2 rows, each card large enough for review.
w,h=1200,690; im=Image.new('RGB',(w,h),'#faf7ef'); d=ImageDraw.Draw(im)
try:
 hfont=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',30)
 nfont=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',22)
 sfont=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',15)
except: hfont=nfont=sfont=ImageFont.load_default()
d.text((28,15),'Choose your jazz cat · different builds & ages',font=hfont,fill='#254f3d')
for i,(id,c) in enumerate(BASE.items()):
 col=i%4;row=i//4;x=18+col*300;y=65+row*312
 d.rounded_rectangle((x,y,x+284,y+296),radius=17,fill='#fffdf8',outline='#d6d8ce',width=2)
 img=Image.open(OUT/f'{id}.png').convert('RGBA').resize((218,218),Image.Resampling.NEAREST)
 im.paste(img,(x+33,y+0),img)
 d.text((x+18,y+210),c['name'],font=nfont,fill='#25503d')
 d.text((x+18,y+243),c['age']+' · '+c['build'],font=sfont,fill='#576a5b')
 d.text((x+18,y+267),c['personality'],font=sfont,fill='#657267')
im.save(R/'jazz-cat-collection.png')
print('PASS',[(x['id'],x['age'],x['build']) for x in out])
