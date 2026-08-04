const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const htmlPath = path.join(root, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(html.includes('id="board"'), 'Missing #board element');
assert(html.includes('class Game'), 'Missing Game class');
assert(html.includes('[Four-Handed Chess II] boot ok'), 'Missing boot verification log');
assert((html.match(/<script\b/g) || []).length === 1, 'Expected exactly one inline script to avoid redeclaration bugs');
assert((html.match(/const TURN_ORDER/g) || []).length === 0, 'TURN_ORDER const should not be duplicated/redeclared');

const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(match => match[1]);
assert(scripts.length === 1, 'Expected one executable script block');

new vm.Script(scripts[0], { filename: 'index-inline-script.js' });

const requiredSnippets = [
  'const PLAYERS',
  'const SYMBOLS',
  'class Game',
  'setup(){',
  'function render',
  'document.getElementById(\'board\')',
  'querySelectorAll(\'.square\')',
  'castleInfo',
  'castle:true',
  "text:'O-O'",
  'kingTo',
  'rookTo',
  'travel>=6',
  'updateCheckState',
  'inCheck(player)',
  'legalMovesFor(player)',
  'checkmatePlayer',
  'status-check',
  'status-mate',
  'pendingPromotion={fr,fc,tr,tc,travel}',
  "promo?'=",
  'showPromotion()'
];
for (const snippet of requiredSnippets) {
  assert(scripts[0].includes(snippet), `Missing script snippet: ${snippet}`);
}

console.log('Static verification passed: index.html has one valid script, boot marker, board, game engine, renderer, and no duplicate top-level TURN_ORDER const.');
