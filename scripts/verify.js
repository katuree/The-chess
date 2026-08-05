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
assert(!html.includes('.yellow-zone { background: linear-gradient'), 'Board zones should not use player-colored yellow backgrounds');
assert(!html.includes('.green-zone { background: linear-gradient'), 'Board zones should not use player-colored green backgrounds');
assert(!html.includes('.red-zone { background: linear-gradient'), 'Board zones should not use player-colored red backgrounds');
assert(!html.includes('.blue-zone { background: linear-gradient'), 'Board zones should not use player-colored blue backgrounds');
assert((html.match(/<script\b/g) || []).length === 1, 'Expected exactly one inline script to avoid redeclaration bugs');
assert((html.match(/const TURN_ORDER/g) || []).length === 0, 'TURN_ORDER const should not be duplicated/redeclared');

const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(match => match[1]);
assert(scripts.length === 1, 'Expected one executable script block');

new vm.Script(scripts[0], { filename: 'index-inline-script.js' });

function createFakeDocument() {
  const allSquares = [];
  const elements = new Map();
  function makeElement(id = '') {
    return {
      id,
      innerHTML: '',
      textContent: '',
      className: '',
      style: {},
      dataset: {},
      title: '',
      disabled: false,
      children: [],
      classList: {
        add() {},
        remove() {},
        contains() { return false; }
      },
      appendChild(child) { this.children.push(child); if (child.className && child.className.includes('square')) allSquares.push(child); },
      addEventListener() {}
    };
  }
  return {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, makeElement(id));
      return elements.get(id);
    },
    createElement(tag) { return makeElement(tag); },
    addEventListener() {},
    querySelectorAll(selector) { return selector === '.square' ? allSquares : []; }
  };
}

function loadGameForBehaviorTests() {
  const sandbox = {
    console: { log() {}, error() {}, warn() {} },
    document: createFakeDocument(),
    window: {}
  };
  sandbox.window.document = sandbox.document;
  vm.createContext(sandbox);
  vm.runInContext(scripts[0], sandbox, { filename: 'index-inline-script.js' });
  return sandbox.window.FourHandedChess;
}

function assertCheckmatedPlayerIsEliminatedWithoutStoppingGame() {
  const { Game } = loadGameForBehaviorTests();
  const game = new Game();
  game.board = Array.from({ length: 14 }, () => Array(14).fill(null));
  game.turn = 1; // red to move/check-state target
  game.set(7, 7, { player: 'red', type: 'king', moved: false });
  game.set(7, 6, { player: 'yellow', type: 'queen', moved: false });
  game.set(8, 6, { player: 'yellow', type: 'queen', moved: false });
  game.set(8, 7, { player: 'yellow', type: 'queen', moved: false });
  game.set(8, 8, { player: 'yellow', type: 'queen', moved: false });
  game.set(7, 8, { player: 'yellow', type: 'queen', moved: false });
  game.set(6, 8, { player: 'yellow', type: 'queen', moved: false });
  game.set(6, 7, { player: 'yellow', type: 'queen', moved: false });
  game.set(6, 6, { player: 'yellow', type: 'queen', moved: false });

  assert(game.inCheck('red'), 'Regression setup must put red in check');
  assert(game.legalMovesFor('red').length === 0, 'Regression setup must be red checkmate');
  game.updateCheckState();

  assert(!game.gameOver, 'One checkmate should not stop the whole 4-player game');
  assert(game.eliminated && game.eliminated.has('red'), 'Checkmated player should be marked eliminated/disqualified');
  assert(game.current === 'green', 'Turn should skip the eliminated red player and continue with green');
}

assertCheckmatedPlayerIsEliminatedWithoutStoppingGame();

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
  'eliminated = new Set()',
  'advanceTurn()',
  'eliminated-piece',
  'is disqualified',
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
