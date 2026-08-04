// Four-Handed Chess II - Renderer

const PLAYER_COLORS = {
    yellow: '#FFD700',
    green: '#228B22',
    red: '#FF4444',
    blue: '#4169E1'
};

const PIECE_SYMBOLS = {
    yellow: { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
    green: { king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟' },
    red: { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
    blue: { king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟' }
};

const PLAYER_CONFIG = {
    yellow: { team: 'yellow-red', backRank: 2, pawnRank: 3, pawnDir: 1, pawnDirC: 0, promoRank: 9, color: '#FFD700', kingStart: [2, 5] },
    green: { team: 'green-blue', backRank: 9, pawnRank: 8, pawnDir: -1, pawnDirC: 0, promoRank: 2, color: '#228B22', kingStart: [9, 5] },
    red: { team: 'yellow-red', backRank: 9, pawnRank: 8, pawnDir: 0, pawnDirC: -1, promoRank: 2, color: '#FF4444', kingStart: [5, 9] },
    blue: { team: 'green-blue', backRank: 2, pawnRank: 3, pawnDir: 0, pawnDirC: 1, promoRank: 9, color: '#4169E1', kingStart: [5, 2] }
};

let selectedSquare = null;
let validMoveTargets = [];

function renderAll(game) {
    renderBoard(game);
    renderTurnIndicator(game);
    renderCapturedPieces(game);
    renderMoveLog(game);
    renderGameStatus(game);
    updateButtonStates(game);
}

function renderBoard(game) {
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';

    for (let r = 0; r < 12; r++) {
        for (let c = 0; c < 12; c++) {
            const square = document.createElement('div');
            square.className = 'square';
            square.dataset.row = r;
            square.dataset.col = c;

            const isInner = r >= 2 && r <= 9 && c >= 2 && c <= 9;
            const isYellowBorder = r === 0 || r === 1;
            const isGreenBorder = r === 10 || r === 11;
            const isRedBorder = c === 10 || c === 11;
            const isBlueBorder = c === 0 || c === 1;

            if (isInner) {
                square.classList.add('inner-board');
                if ((r + c) % 2 === 1) {
                    square.style.background = '#353550';
                } else {
                    square.style.background = '#2d2d44';
                }
            } else if (isYellowBorder) {
                square.classList.add('border-yellow');
            } else if (isGreenBorder) {
                square.classList.add('border-green');
            } else if (isRedBorder) {
                square.classList.add('border-red');
            } else if (isBlueBorder) {
                square.classList.add('border-blue');
            }

            const piece = game.board.get(r, c);
            if (piece) {
                const symbol = PIECE_SYMBOLS[piece.player][piece.type];
                square.textContent = symbol;
                square.style.color = PLAYER_COLORS[piece.player];
            }

            if (game.lastMove) {
                const [lfr, lfc] = game.lastMove.from;
                const [ltr, ltc] = game.lastMove.to;
                if ((r === lfr && c === lfc) || (r === ltr && c === ltc)) {
                    square.classList.add('last-move');
                }
            }

            if (selectedSquare && selectedSquare.r === r && selectedSquare.c === c) {
                square.classList.add('selected');
            }

            if (validMoveTargets.some(([tr, tc]) => tr === r && tc === c)) {
                const targetPiece = game.board.get(r, c);
                if (targetPiece && targetPiece.player !== game.currentPlayer) {
                    square.classList.add('capture-highlight');
                } else {
                    square.classList.add('highlight');
                }
            }

            if (piece && piece.type === 'king') {
                const checkState = game.getCheckState(piece.player);
                if (checkState === 'check' || checkState === 'checkmate') {
                    square.style.boxShadow = 'inset 0 0 0 4px #ff4444';
                }
            }

            square.addEventListener('click', () => handleSquareClick(game, r, c));
            boardEl.appendChild(square);
        }
    }
}

function handleSquareClick(game, r, c) {
    if (game.gameOver || game.pendingPromotion) return;

    const piece = game.board.get(r, c);

    if (selectedSquare) {
        if (selectedSquare.r === r && selectedSquare.c === c) {
            selectedSquare = null;
            validMoveTargets = [];
            renderBoard(game);
            return;
        }

        const isValidTarget = validMoveTargets.some(([tr, tc]) => tr === r && tc === c);
        if (isValidTarget) {
            const result = game.move(selectedSquare.r, selectedSquare.c, r, c);
            
            if (result === 'promotion') {
                showPromotionModal(game, selectedSquare.r, selectedSquare.c, r, c);
            } else if (result) {
                selectedSquare = null;
                validMoveTargets = [];
                renderAll(game);
            }
            return;
        }

        if (piece && piece.player === game.currentPlayer) {
            selectedSquare = { r, c };
            validMoveTargets = game.getValidMoves(r, c);
            renderBoard(game);
            return;
        }

        selectedSquare = null;
        validMoveTargets = [];
        renderBoard(game);
    } else {
        if (piece && piece.player === game.currentPlayer) {
            selectedSquare = { r, c };
            validMoveTargets = game.getValidMoves(r, c);
            renderBoard(game);
        }
    }
}

function renderTurnIndicator(game) {
    const nameEl = document.getElementById('current-player-name');
    const counterEl = document.getElementById('turn-counter');
    
    nameEl.textContent = capitalize(game.currentPlayer);
    nameEl.className = game.currentPlayer;
    counterEl.textContent = `Move: ${Math.floor(game.moveCount / 4) + 1}`;
}

function renderCapturedPieces(game) {
    const players = ['yellow', 'green', 'red', 'blue'];
    
    players.forEach(player => {
        const container = document.getElementById(`captured-${player}`);
        if (!container) return;
        
        container.innerHTML = '';
        const captured = game.capturedPieces[player] || [];
        
        captured.forEach(p => {
            const el = document.createElement('span');
            el.className = 'captured-piece';
            el.textContent = PIECE_SYMBOLS[p.player][p.type];
            el.style.color = PLAYER_COLORS[p.player];
            container.appendChild(el);
        });
    });
}

function renderMoveLog(game) {
    const logEl = document.getElementById('move-log');
    logEl.innerHTML = '';

    game.moveLog.forEach((move, index) => {
        const entry = document.createElement('div');
        entry.className = 'move-log-entry';
        
        const moveNumber = Math.floor(index / 4) + 1;
        const playerInRound = index % 4;
        const player = TURN_ORDER[playerInRound];
        
        entry.innerHTML = `
            <span class="move-number">${moveNumber}.</span>
            <span class="move-player ${player}">${capitalize(player)}</span>
            <span class="move-notation">${move.notation}</span>
        `;
        
        logEl.appendChild(entry);
    });
    
    logEl.scrollTop = logEl.scrollHeight;
}

function renderGameStatus(game) {
    const statusEl = document.getElementById('game-status');
    
    if (game.gameOver) {
        const teamNames = {
            'yellow-red': 'Team Yellow & Red',
            'green-blue': 'Team Green & Blue'
        };
        statusEl.innerHTML = `
            <strong style="color: ${PLAYER_COLORS[game.winner]}">${capitalize(game.winner)}</strong> delivers checkmate!<br>
            <strong>${teamNames[game.winningTeam]}</strong> wins!
        `;
        showGameOverModal(game);
    } else {
        const checkState = game.getCheckState(game.currentPlayer);
        if (checkState === 'check') {
            statusEl.innerHTML = `<span style="color: #ff4444">⚠ ${capitalize(game.currentPlayer)} is in CHECK!</span>`;
        } else {
            statusEl.textContent = 'Game in progress...';
        }
    }
}

function updateButtonStates(game) {
    const undoBtn = document.getElementById('undo-btn');
    undoBtn.disabled = game.moveLog.length === 0 || game.gameOver || game.pendingPromotion;
}

function showGameOverModal(game) {
    const modal = document.getElementById('game-over-modal');
    const titleEl = document.getElementById('modal-title');
    const messageEl = document.getElementById('modal-message');
    
    const teamNames = {
        'yellow-red': 'Team Yellow & Red',
        'green-blue': 'Team Green & Blue'
    };
    
    titleEl.textContent = 'Checkmate!';
    messageEl.innerHTML = `
        <span style="color: ${PLAYER_COLORS[game.winner]}">${capitalize(game.winner)}</span> delivers checkmate!<br>
        <strong>${teamNames[game.winningTeam]}</strong> wins the game!
    `;
    
    modal.classList.remove('hidden');
}

function hideGameOverModal() {
    document.getElementById('game-over-modal').classList.add('hidden');
}

function showPromotionModal(game, fromR, fromC, toR, toC) {
    const modal = document.getElementById('promotion-modal');
    const choicesEl = document.getElementById('promotion-choices');
    
    choicesEl.innerHTML = '';
    const promotionOptions = ['queen', 'rook', 'bishop', 'knight'];
    
    promotionOptions.forEach(type => {
        const choice = document.createElement('div');
        choice.className = 'promotion-choice';
        choice.textContent = PIECE_SYMBOLS[game.currentPlayer][type];
        choice.style.color = PLAYER_COLORS[game.currentPlayer];
        choice.addEventListener('click', () => {
            game.completePromotion(type);
            hidePromotionModal();
            selectedSquare = null;
            validMoveTargets = [];
            renderAll(game);
        });
        choicesEl.appendChild(choice);
    });
    
    modal.classList.remove('hidden');
}

function hidePromotionModal() {
    document.getElementById('promotion-modal').classList.add('hidden');
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

const TURN_ORDER = ['yellow', 'green', 'red', 'blue'];

window.renderAll = renderAll;