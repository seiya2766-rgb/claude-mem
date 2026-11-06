// Turns the browser prototype into a standalone page for the desktop app.
// The prototype is written for the artifact viewer, which adds the <html>/<head> wrapper itself, so we add it here.
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..');
const out = path.join(__dirname, 'app');
fs.mkdirSync(out, { recursive: true });

const body = fs.readFileSync(path.join(src, 'prototype.html'), 'utf8');
const html = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>html, body { margin: 0; } [hidden] { display: none !important; }</style>
</head>
<body>
${body}
</body>
</html>
`;
fs.writeFileSync(path.join(out, 'index.html'), html);
fs.copyFileSync(path.join(src, 'i18n.js'), path.join(out, 'i18n.js'));
console.log('Wrote', path.relative(process.cwd(), path.join(out, 'index.html')));
