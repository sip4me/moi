// Adds the home-screen (PWA) tags to every exported page. Run after `npx expo export -p web`.
const fs = require('fs'), path = require('path');
const TAGS = [
  '<link rel="manifest" href="/manifest.json"/>',
  '<link rel="apple-touch-icon" href="/apple-touch-icon.png"/>',
  '<meta name="apple-mobile-web-app-title" content="Moi"/>',
  '<meta name="apple-mobile-web-app-capable" content="yes"/>',
  '<meta name="mobile-web-app-capable" content="yes"/>',
  '<meta name="theme-color" content="#FFFFFF"/>',
].join('');
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.html') ? [path.join(d, e.name)] : []));
let n = 0;
for (const f of walk(path.join(__dirname, '..', 'dist'))) {
  let h = fs.readFileSync(f, 'utf8');
  if (h.includes('rel="manifest"')) continue;
  h = h.replace('</head>', TAGS + '</head>').replace(/<title>[^<]*<\/title>/, '<title>Moi — your hair analyst</title>');
  if (!h.includes('<title>')) h = h.replace('</head>', '<title>Moi — your hair analyst</title></head>');
  h = h.replace('content="width=device-width, initial-scale=1, shrink-to-fit=no"', 'content="width=device-width, initial-scale=1, viewport-fit=cover"');
  fs.writeFileSync(f, h); n++;
}
console.log(`PWA tags added to ${n} pages`);
