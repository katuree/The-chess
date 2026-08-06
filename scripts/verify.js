const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const landingPath = path.join(root, 'index.html');
const fourPlayerPath = path.join(root, 'four-player.html');
const normalPath = path.join(root, 'normal-chess.html');
const landingHtml = fs.readFileSync(landingPath, 'utf8');
const html = fs.readFileSync(fourPlayerPath, 'utf8');
const normalHtml = fs.readFileSync(normalPath, 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(landingHtml.includes('id="four-player-link"') && landingHtml.includes('./four-player.html'), 'Landing page should link to 4 Player Chess page');
assert(landingHtml.includes('id="normal-chess-link"') && landingHtml.includes('./normal-chess.html'), 'Landing page should link to Normal Chess page');
assert(landingHtml.includes('Choose which chess webpage'), 'Site root should open a game choice page');
assert(html.includes('href="./index.html"') && html.includes('href="./normal-chess.html"'), '4-player chess page should link back to chooser and normal chess page');
assert(html.includes('id="four-player-mode-menu"'), '4-player chess should open with a minimal mode menu before the board');
assert(html.includes('id="four-player-vs-ai-btn"') && html.includes('Player vs AI'), '4-player chess menu should have a Player vs AI button');
assert(html.includes('id="four-local-4-player-btn"') && html.includes('Local 4 Player'), '4-player chess menu should have a Local 4 Player button');
assert(html.includes('id="four-quick-match-btn"') && html.includes('Quick Match'), '4-player chess menu should have a Quick Match button');
assert(html.includes('id="four-room-btn"') && html.includes('Room'), '4-player chess menu should have a Room button');
assert(html.includes('id="four-player-game-screen"') && html.includes('class="game-container hidden"'), '4-player chess game screen should be hidden until mode selection');
assert(html.includes('startFourPlayerGame') && html.includes('showFourPlayerModeMenu'), '4-player chess should have mode-menu start/change functions');
assert(!html.includes('Start Single Player') && !html.includes('Start Multiple Player'), '4-player chess mode menu should stay minimal with buttons only');
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
const normalScripts = [...normalHtml.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(match => match[1]);
assert(normalHtml.includes('id="normal-board"'), 'Normal chess page should have its own board');
assert(normalHtml.includes('[Normal Chess] boot ok'), 'Normal chess page should have boot marker');
assert(normalHtml.includes('id="normal-mode-menu"'), 'Normal chess should open with a minimal mode menu before the board');
assert(normalHtml.includes('id="normal-player-vs-ai-btn"') && normalHtml.includes('Player vs AI'), 'Normal chess menu should have a Player vs AI button');
assert(normalHtml.includes('id="normal-local-pvp-btn"') && normalHtml.includes('Local PvP'), 'Normal chess menu should have a Local PvP button');
assert(normalHtml.includes('id="normal-quick-match-btn"') && normalHtml.includes('Quick Match'), 'Normal chess menu should have a Quick Match button');
assert(normalHtml.includes('id="normal-room-btn"') && normalHtml.includes('Room'), 'Normal chess menu should have a Room button');
assert(!normalHtml.includes('Choose how you want to play') && !normalHtml.includes('Start Single Player') && !normalHtml.includes('Start Multiple Player'), 'Normal chess mode menu should stay minimal with buttons only');
assert(normalHtml.includes('id="normal-game-screen"') && normalHtml.includes('class="game-container hidden"'), 'Normal chess game screen should be hidden until mode selection');
assert(normalHtml.includes('startNormalGame') && normalHtml.includes('chooseNormalAiMove') && normalHtml.includes('NORMAL_AI_DELAY'), 'Normal chess single player should start from menu and include AI opponent');
assert(normalHtml.includes('id="normal-host-room-btn"') && normalHtml.includes('id="normal-join-room-code"'), 'Normal chess should expose room hosting controls');
assert(normalHtml.includes('NORMAL_PEERJS_CDN') && normalHtml.includes('NORMAL_QUICK_MATCH_ROOM'), 'Normal chess should load PeerJS and define a quick match room');
assert(normalHtml.includes('serializeNormalGame') && normalHtml.includes('applyNormalRemoteState') && normalHtml.includes('broadcastNormalState') && normalHtml.includes('sendNormalMoveRequest'), 'Normal chess should support authoritative room state sync');
assert(normalHtml.includes('class NormalChessGame'), 'Normal chess page should have a separate normal chess game engine');
assert(normalHtml.includes('background:#f0d9b5') && normalHtml.includes('background:#b58863'), 'Normal chess board should use cleaner classic tile colors');
assert(normalHtml.includes('data-label'), 'Normal chess board should show coordinate labels on edge tiles');
assert(normalHtml.includes('paint-order:stroke fill'), 'Normal chess pieces should have readable outlined silhouettes');
assert(normalHtml.includes('href="./index.html"') && normalHtml.includes('href="./four-player.html"'), 'Normal chess page should link back to chooser and 4-player page');
assert(normalScripts.length === 1, 'Expected one normal chess script block');

new vm.Script(scripts[0], { filename: 'four-player-inline-script.js' });
new vm.Script(normalScripts[0], { filename: 'normal-chess-inline-script.js' });

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
