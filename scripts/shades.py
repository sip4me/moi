"""Beauty shade dictionary: shade words -> colour (sRGB hex), converted to CIELAB + undertone.
Writes src/lib/routine/shades.json (app) and /tmp/shade_words.sql (database seed)."""
import json, math
S = {
# reds / berries / wines
'red':'#C0262D','true red':'#C41E3A','classic red':'#BE1E2D','blue red':'#B0103A','orange red':'#D7372A','cherry':'#9E1B32','cherry red':'#B5172E','scarlet':'#D0312D','crimson':'#A51C30','ruby':'#9B111E','poppy':'#D8413A','fire':'#C8312A','brick':'#9C3B2E','brick red':'#963A2F','rust':'#A3472A','cola':'#5A2A27','cherry cola':'#5C1F24','wine':'#6B1E2E','merlot':'#6A1F2B','burgundy':'#6D1A29','bordeaux':'#5E1824','oxblood':'#4E1520','garnet':'#7B1C2A','raisin':'#5A2A33','plum':'#6E2F4F','berry':'#8E2552','raspberry':'#B0305C','cranberry':'#8C1F3D','fuchsia':'#C8337E','magenta':'#B5236E','hot pink':'#E0457B','sangria':'#7E1F3B','currant':'#5E1A2C','blackberry':'#3F1B2C','fig':'#6B3A4A','grape':'#5B2C5E','vampy':'#3C0F1E',
# pinks / roses / mauves
'pink':'#E8A0B4','baby pink':'#F2BCC8','ballet pink':'#EDC1C8','ballet':'#EDC1C8','bubblegum':'#F08AB0','flamingo':'#EE7F95','petal':'#E9A9B4','blush':'#E2A0A2','rose':'#C96F7E','dusty rose':'#B57A80','rosewood':'#9E5A5E','rose gold':'#D19A8A','tea rose':'#D69C97','mauve':'#A8737E','dusty mauve':'#9C6E76','lilac':'#C3A2C8','lavender':'#B9A7D6','orchid':'#B66FA6','candy':'#E46F95','strawberry':'#D9475A','watermelon':'#E8636E','pink nude':'#C98E86','nude pink':'#C98E86','sheer pink':'#EFB9C0','peony':'#E07A93','primrose':'#EBB8C2',
# corals / peaches / oranges
'coral':'#F07E6E','peach':'#F4A98A','apricot':'#F3A577','salmon':'#F08B7A','papaya':'#F2905C','tangerine':'#F28C3A','orange':'#E8762C','terracotta':'#B9563A','sienna':'#A0522D','persimmon':'#E2612F','melon':'#F3A08B','sunset':'#E8735A','copper':'#B8733A','cinnamon':'#9C5A35','spice':'#93513A','amber':'#C17E2C','marigold':'#E8A035',
# nudes / browns / neutrals
'nude':'#C9977E','bare':'#D2A88F','natural':'#C99C82','beige':'#D8B794','buff':'#D9B391','sand':'#D4B18A','vanilla':'#EFD9BC','cream':'#EFDDC2','ivory':'#F1E3CD','porcelain':'#F2DCCB','fair':'#EED3BE','light':'#E5C3A6','light medium':'#D9AE8C','medium':'#C99572','tan':'#B9845C','golden':'#C99A5E','honey':'#C68E52','caramel':'#B47A47','toffee':'#A76C3E','latte':'#B98B6A','mocha':'#8A5E45','cocoa':'#6F4A35','chocolate':'#5C3A26','espresso':'#3E2A20','chestnut':'#7A4A32','walnut':'#6B4A33','hazelnut':'#A27352','almond':'#C7A07E','biscuit':'#D3AE85','taupe':'#8E7A6E','mushroom':'#9A8478','greige':'#A39A8E','brown':'#7B5139','soft brown':'#8C6450','warm brown':'#8A5A3B','cool brown':'#6E5A52','dark brown':'#4A3226','deep':'#7A4E35','rich':'#5E3A27','deep rich':'#4B2E20','ebony':'#3A2A22','bronze':'#A0693A','bronzed':'#A0693A','sun kissed':'#C68B5C','sunkissed':'#C68B5C','tanned':'#B07A50','terra':'#A55C3C','clay':'#B07259','brick nude':'#A65E4C','nude brown':'#9C6B57','rosy brown':'#A36E68',
# eye shades
'black':'#1C1A1D','jet':'#141214','jet black':'#141214','onyx':'#1B1A1C','carbon':'#232226','noir':'#16151A','ink':'#1E2230','blackest black':'#0F0E10','charcoal':'#3A3A3E','smoke':'#5A5860','smoky':'#4E4B52','slate':'#5A6470','grey':'#8C8C90','gray':'#8C8C90','silver':'#BFC1C6','gunmetal':'#53565C','pewter':'#8A8C8E','navy':'#1F2A50','midnight':'#1E2340','cobalt':'#2A4BA8','sapphire':'#2B4A8C','blue':'#3A5FB0','teal':'#1F7A7A','turquoise':'#3EB8B0','emerald':'#1F7A4D','green':'#3E7A4A','olive':'#6B6B3A','khaki':'#9A8F5E','sage':'#9AAA8A','forest':'#2E4B33','violet':'#6A3E9A','purple':'#5E3485','amethyst':'#8A5CA8','aubergine':'#3E2038','eggplant':'#3E2038',
# metallics / highlight
'gold':'#D4AF37','champagne':'#E8D2A8','pearl':'#EEE6DC','opal':'#E9E1E8','moonstone':'#DCD8E3','glow':'#F0D9B5','shimmer':'#E8D6C0','glitter':'#D8C6B0','bronze gold':'#B8873A','rose quartz':'#E8B9C0','starlight':'#F1E6D6','sunbeam':'#F2D58C',
# clear / white
'clear':'#F3EEF0','crystal':'#F1EEF3','transparent':'#F3EEF0','white':'#F4F2EE','snow':'#F6F4F0','translucent':'#EFE7E0',
}
FINISH = {'matte':'matte','velvet':'matte','blur':'matte','soft matte':'matte','satin':'satin','cream':'satin','creme':'satin','gloss':'gloss','glossy':'gloss','shine':'gloss','lacquer':'gloss','vinyl':'gloss','shimmer':'shimmer','metallic':'metallic','foil':'metallic','glitter':'shimmer','pearl':'shimmer','dewy':'dewy','radiant':'dewy','luminous':'dewy','glow':'dewy','sheer':'sheer','tint':'sheer','balm':'sheer','stain':'sheer'}

def lab(hexs):
    r,g,b=[int(hexs[i:i+2],16)/255 for i in (1,3,5)]
    f=lambda c: ((c+0.055)/1.055)**2.4 if c>0.04045 else c/12.92
    r,g,b=f(r),f(g),f(b)
    x=(r*0.4124+g*0.3576+b*0.1805)/0.95047; y=r*0.2126+g*0.7152+b*0.0722; z=(r*0.0193+g*0.1192+b*0.9505)/1.08883
    h=lambda t: t**(1/3) if t>0.008856 else 7.787*t+16/116
    fx,fy,fz=h(x),h(y),h(z)
    return round(116*fy-16,2), round(500*(fx-fy),2), round(200*(fy-fz),2)
def tone(L,a,b):
    # Undertone by how yellow a colour leans against how red/pink it leans (b*/a*).
    if abs(a)<4 and abs(b)<4: return 'neutral'
    if a<=2: return 'cool' if b<-8 else 'warm' if b>15 else 'neutral'
    r=b/a
    return 'cool' if r<0.5 else 'warm' if r>0.65 else 'neutral'
rows=[]
for w,hx in S.items():
    L,a,b=lab(hx); rows.append({'w':w,'hex':hx,'lab':[L,a,b],'tone':tone(L,a,b)})
json.dump({'shades':rows,'finish':FINISH},open('src/lib/routine/shades.json','w'),separators=(',',':'))
sql=["create table if not exists public.shade_words (word text primary key, hex text not null, lab_l real, lab_a real, lab_b real, undertone text);","truncate public.shade_words;"]
sql.append("insert into public.shade_words values "+",".join(f"('{r['w']}','{r['hex']}',{r['lab'][0]},{r['lab'][1]},{r['lab'][2]},'{r['tone']}')" for r in rows)+";")
open('/tmp/shade_words.sql','w').write("\n".join(sql))
print(len(rows),'shades')
