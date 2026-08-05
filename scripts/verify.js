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
assert(!html.includes("return 'green-zone'"), 'Squares near green pieces should use the normal chess pattern');
assert(!html.includes("return 'yellow-zone'"), 'Squares near yellow pieces should use the normal chess pattern');
assert(!html.includes("return 'red-zone'"), 'Squares near red pieces should use the normal chess pattern');
assert(!html.includes("return 'blue-zone'"), 'Squares near blue pieces should use the normal chess pattern');
assert(html.includes('background: transparent;'), 'Pieces should not have round/token backgrounds');
assert(html.includes('color: var(--piece-color);'), 'Piece silhouettes should be colored directly per player');
assert(html.includes('const ICONS ='), 'Reference-style pieces should use custom SVG icon shapes, not only font glyphs');
assert(html.includes('M192-32c66.3'), 'Reference-style pieces should use Font Awesome pawn silhouette path');
assert(html.includes('<svg class="piece-icon" viewBox="0 -32 ${i.w} ${i.h}"'), 'Reference-style pieces should render inline SVG icons');
assert(html.includes('piece.innerHTML=iconFor(p.type)'), 'Board pieces should render the SVG icon for each type');
assert(html.includes('id="fullscreen-btn"'), 'Missing full screen button');
assert(html.includes('requestFullscreen()'), 'Full screen button should call requestFullscreen');
assert(html.includes('.board-container:fullscreen'), 'Full screen layout should target only the board container');
assert(!html.includes('.game-container:fullscreen'), 'Full screen should not include the full game/header/sidebar container');
assert(html.includes('document.querySelector(\'.board-container\')'), 'Full screen button should open only the board container');
assert(html.includes('const AI_DELAY = 950'), 'AI turns should have a visible delay between each chance');
assert(html.includes('id="sound-btn"'), 'Missing sound effects toggle button');
assert(html.includes('function playSound'), 'Missing sound effects helper');
assert(html.includes('AudioContext||window.webkitAudioContext'), 'Sound effects should use browser WebAudio');
assert(html.includes('playSound(this.gameOver||this.checkmatePlayer'), 'Moves should trigger sound effects after game state updates');
assert(html.includes('id="host-room-btn"'), 'Missing host room button');
assert(html.includes('id="join-room-code"'), 'Missing join room code input');
assert(html.includes('PEERJS_CDN'), 'Room hosting should load PeerJS for WebRTC rooms');
assert(html.includes('function serializeGame()'), 'Room hosting should serialize the authoritative game state');
assert(html.includes('function broadcastState()'), 'Room hosting should broadcast host state to guests');
assert(html.includes('sendMoveRequest'), 'Guests should send move requests to the host');
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
      value: '',
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
    setTimeout(fn) { fn(); return 0; },
    document: createFakeDocument(),
    window: {},
    location: { search: '' },
    navigator: { clipboard: { writeText() {} } },
    URLSearchParams
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

function assertSinglePlayerAiControlsOtherPlayers(){
  const app = loadGameForBehaviorTests();
  const beforeLog = app.game.log.length;
  const aiMove = app.chooseAiMove('yellow');
  assert(aiMove && aiMove.from && aiMove.to, 'AI should be able to choose a legal move for an active player');
  app.setSinglePlayerMode('single','red');
  assert(app.game.log.length > beforeLog, 'When human is red, yellow AI should automatically move first in single player');
  assert(app.game.current === 'red', 'After AI yellow moves, turn should pass to the human red player');
}

assertSinglePlayerAiControlsOtherPlayers();

function assertRoomStateSerializationRoundTrip(){
  const app = loadGameForBehaviorTests();
  const state = app.serializeGame();
  assert(state.board && state.board.length === 14, 'Room state should include the board');
  app.game.eliminated.add('red');
  app.applyRemoteState({...state, eliminated:['blue'], turn:3});
  assert(app.game.current === 'blue', 'Remote room state should update current turn');
  assert(app.game.eliminated.has('blue'), 'Remote room state should restore eliminated players');
}

assertRoomStateSerializationRoundTrip();

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
  'const ICONS =',
  'iconFor(type)',
  'piece.innerHTML=iconFor(p.type)',
  'captured-piece piece-${p.player}',
  'toggleFullscreen()',
  'fullscreenchange',
  'game-mode-select',
  'human-player-select',
  'chooseAiMove(player)',
  'performAiTurn()',
  'setSinglePlayerMode',
  'AI_DELAY',
  'sound-btn',
  'playSound(kind',
  'toggleSound()',
  'unlockAudio()',
  'AudioContext',
  'host-room-btn',
  'join-room-code',
  'copy-room-btn',
  'PEERJS_CDN',
  'serializeGame()',
  'applyRemoteState',
  'hostRoom()',
  'joinRoom',
  'broadcastState()',
  'sendMoveRequest',
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
