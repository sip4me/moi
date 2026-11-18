// Copies the on-device readers into the web build, so label scanning never depends on a third-party CDN:
// the barcode decoder (zxing) and text recognition (Tesseract: worker, LSTM cores, English model).
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), out = path.join(root, 'dist');
const nm = p => path.join(root, 'node_modules', p);
const copy = (from, to) => { fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(from, to); };

copy(nm('zxing-wasm/dist/reader/zxing_reader.wasm'), path.join(out, 'zxing_reader.wasm'));
copy(nm('tesseract.js/dist/worker.min.js'), path.join(out, 'ocr/worker.min.js'));
for (const f of ['tesseract-core-lstm.wasm.js', 'tesseract-core-simd-lstm.wasm.js', 'tesseract-core-relaxedsimd-lstm.wasm.js'])
  copy(nm(`tesseract.js-core/${f}`), path.join(out, 'ocr', f));
copy(nm('@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz'), path.join(out, 'ocr/eng.traineddata.gz'));
console.log('on-device readers copied');
