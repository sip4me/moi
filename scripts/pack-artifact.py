"""Copy the web export into a folder the artifact host accepts.
The host reserves names starting with "_", so Expo's _expo/ folder and
_layout/__common chunks are renamed and every reference is rewritten."""
import os, shutil, sys, json
src, dst = sys.argv[1], sys.argv[2]
if os.path.exists(dst):
    sys.exit(f'{dst} already exists; pass a new folder name')
os.makedirs(dst)
keep_fonts = ('400Regular/', '500Medium/', '600SemiBold/', '700Bold/')
files = []
for root, _, names in os.walk(src):
    for n in names:
        rel = os.path.relpath(os.path.join(root, n), src)
        if rel.endswith('.html') and rel != 'index.html': continue
        if rel.startswith('_expo/.routes') or 'expo-router/assets' in rel or rel == 'favicon.ico': continue
        if 'expo-google-fonts/inter' in rel and not any(k in rel for k in keep_fonts): continue
        files.append(rel)
ren = {}
def newname(rel):
    parts = rel.split('/')
    if parts[0] == '_expo': parts[0] = 'expo-static'
    base = parts[-1]
    for a, b in (('__', 'x'), ('_', 'x'), ('+', 'x'), ('[', 'x')):
        if base.startswith(a): base = b + base[len(a):]; break
    base = base.replace(']', '')
    if base != parts[-1]: ren[parts[-1]] = base
    parts[-1] = base
    return '/'.join(parts)
out = []
for rel in files:
    nr = newname(rel); os.makedirs(os.path.dirname(os.path.join(dst, nr)) or dst, exist_ok=True)
    shutil.copy(os.path.join(src, rel), os.path.join(dst, nr)); out.append(nr)
for nr in out:
    if nr.endswith(('.js', '.html')):
        p = os.path.join(dst, nr); s = open(p, encoding='utf-8').read(); o = s
        s = s.replace('/_expo/', '/expo-static/').replace('"_expo/', '"expo-static/')
        for a, b in ren.items(): s = s.replace(a, b)
        if s != o: open(p, 'w', encoding='utf-8').write(s)
out.sort(key=lambda r: (r != 'index.html', r))
print(json.dumps([{'as': r, 'path': os.path.abspath(os.path.join(dst, r))} for r in out]))
