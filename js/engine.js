// Four-Handed Chess II - Game Engine
// Based on rules from https://greenchess.net/rules.php?v=four-handed-2

const PLAYERS = ['yellow', 'green', 'red', 'blue'];
const TURN_ORDER = ['yellow', 'green', 'red', 'blue'];

const PLAYER_CONFIG = {
    yellow: { 
        team: 'yellow-red', 
        backRank: 2, 
        pawnRank: 3, 
        pawnDir: 1,
        pawnDirC: 0,
        promoRank: 9,
        color: '#FFD700',
        kingStart: [2, 5]
    },
    green: { 
        team: 'green-blue', 
        backRank: 9, 
        pawnRank: 8, 
        pawnDir: -1,
        pawnDirC: 0,
        promoRank: 2,
        color: '#228B22',
        kingStart: [9, 5]
    },
    red: { 
        team: 'yellow-red', 
        backRank: 9, 
        pawnRank: 8, 
        pawnDir: 0,
        pawnDirC: -1,
        promoRank: 2,
        color: '#FF4444',
        kingStart: [5, 9]
    },
    blue: { 
        team: 'green-blue', 
        backRank: 2, 
        pawnRank: 3, 
        pawnDir: 0,
        pawnDirC: 1,
        promoRank: 9,
        color: '#4169E1',
        kingStart: [5, 2]
    }
};

const PIECE_SYMBOLS = {
    yellow: { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
    green: { king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟' },
    red: { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
    blue: { king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟' }
};

const PIECE_TYPES = ['king', 'queen', 'rook', 'bishop', 'knight', 'pawn'];

class Board {
    constructor() {
        this.size = 12;
        this.grid = Array(this.size).fill(null).map(() => Array(this.size).fill(null));
    }

    inBounds(r, c) {
        return r >= 0 && r < this.size && c >= 0 && c < this.size;
    }

    get(r, c) {
        if (!this.inBounds(r, c)) return null;
        return this.grid[r][c];
    }

    set(r, c, piece) {
        if (!this.inBounds(r, c)) return;
        this.grid[r][c] = piece;
    }

    clone() {
        const newBoard = new Board();
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c]) {
                    newBoard.grid[r][c] = { ...this.grid[r][c] };
                }
            }
        }
        return newBoard;
    }

    findKing(player) {
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const piece = this.grid[r][c];
                if (piece && piece.player === player && piece.type === 'king') {
                    return [r, c];
                }
            }
        }
        return null;
    }

    isSquareAttacked(r, c, byPlayer) {
        for (let rr = 0; rr < this.size; rr++) {
            for (let cc = 0; cc < this.size; cc++) {
                const piece = this.grid[rr][cc];
                if (piece && piece.player === byPlayer) {
                    const moves = this.getRawMovesForPiece(piece, rr, cc, false);
                    if (moves.some(([tr, tc]) => tr === r && tc === c)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    getRawMovesForPiece(piece, r, c, checkSafety = true) {
        const { type, player } = piece;
        const config = PLAYER_CONFIG[player];
        const moves = [];

        switch (type) {
            case 'king':
                this.addKingMoves(moves, r, c, player);
                break;
            case 'queen':
                this.addSlidingMoves(moves, r, c, player, [
                    [-1, 0], [1, 0], [0, -1], [0, 1],
                    [-1, -1], [-1, 1], [1, -1], [1, 1]
                ]);
                break;
            case 'rook':
                this.addSlidingMoves(moves, r, c, player, [
                    [-1, 0], [1, 0], [0, -1], [0, 1]
                ]);
                break;
            case 'bishop':
                this.addSlidingMoves(moves, r, c, player, [
                    [-1, -1], [-1, 1], [1, -1], [1, 1]
                ]);
                break;
            case 'knight':
                this.addKnightMoves(moves, r, c, player);
                break;
            case 'pawn':
                this.addPawnMoves(moves, r, c, player, config);
                break;
        }

        if (!checkSafety) return moves;

        return moves.filter(([tr, tc]) => {
            const savedBoard = this.grid.map(row => row.map(p => p ? { ...p } : null));
            const movingPiece = this.get(r, c);
            this.set(tr, tc, movingPiece);
            this.set(r, c, null);

            const kingPos = this.findKing(player);
            const safe = kingPos && !this.isSquareAttacked(kingPos[0], kingPos[1], this.getOpponentTeam(player));

            this.grid = savedBoard;
            return safe;
        });
    }

    addKingMoves(moves, r, c, player) {
        const dirs = [
            [-1, 0], [1, 0], [0, -1], [0, 1],
            [-1, -1], [-1, 1], [1, -1], [1, 1]
        ];
        for (const [dr, dc] of dirs) {
            const nr = r + dr, nc = c + dc;
            if (this.inBounds(nr, nc)) {
                const target = this.get(nr, nc);
                if (!target || target.player !== player) {
                    moves.push([nr, nc]);
                }
            }
        }
    }

    addSlidingMoves(moves, r, c, player, directions) {
        for (const [dr, dc] of directions) {
            let nr = r + dr, nc = c + dc;
            while (this.inBounds(nr, nc)) {
                const target = this.get(nr, nc);
                if (target) {
                    if (target.player !== player) {
                        moves.push([nr, nc]);
                    }
                    break;
                }
                moves.push([nr, nc]);
                nr += dr; nc += dc;
            }
        }
    }

    addKnightMoves(moves, r, c, player) {
        const knightMoves = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        for (const [dr, dc] of knightMoves) {
            const nr = r + dr, nc = c + dc;
            if (this.inBounds(nr, nc)) {
                const target = this.get(nr, nc);
                if (!target || target.player !== player) {
                    moves.push([nr, nc]);
                }
            }
        }
    }

    addPawnMoves(moves, r, c, player, config) {
        const dirR = config.pawnDir;
        const dirC = config.pawnDirC || 0;
        const forwardR = r + dirR;
        const forwardC = c + dirC;
        
        if (this.inBounds(forwardR, forwardC) && !this.get(forwardR, forwardC)) {
            moves.push([forwardR, forwardC]);
            
            const doubleForwardR = r + 2 * dirR;
            const doubleForwardC = c + 2 * dirC;
            const isStartingRank = r === config.pawnRank;
            if (isStartingRank && this.inBounds(doubleForwardR, doubleForwardC) && 
                !this.get(doubleForwardR, doubleForwardC) && !this.get(forwardR, forwardC)) {
                moves.push([doubleForwardR, doubleForwardC]);
            }
        }

        if (dirR !== 0) {
            for (const dc of [-1, 1]) {
                const capR = r + dirR, capC = c + dc;
                if (this.inBounds(capR, capC)) {
                    const target = this.get(capR, capC);
                    if (target && target.player !== player && !this.isTeammate(player, target.player)) {
                        moves.push([capR, capC]);
                    }
                }
            }
        } else {
            for (const dr of [-1, 1]) {
                const capR = r + dr, capC = c + dirC;
                if (this.inBounds(capR, capC)) {
                    const target = this.get(capR, capC);
                    if (target && target.player !== player && !this.isTeammate(player, target.player)) {
                        moves.push([capR, capC]);
                    }
                }
            }
        }
    }

    getOpponentTeam(player) {
        return PLAYER_CONFIG[player].team === 'yellow-red' ? 'green-blue' : 'yellow-red';
    }

    isTeammate(p1, p2) {
        return PLAYER_CONFIG[p1].team === PLAYER_CONFIG[p2].team;
    }
}

class Game {
    constructor() {
        this.board = new Board();
        this.currentPlayerIndex = 0;
        this.moveLog = [];
        this.capturedPieces = { yellow: [], green: [], red: [], blue: [] };
        this.gameOver = false;
        this.winner = null;
        this.winningTeam = null;
        this.pendingPromotion = null;
        this.lastMove = null;
        this.moveCount = 0;
        this.initializeBoard();
    }

    get currentPlayer() {
        return TURN_ORDER[this.currentPlayerIndex];
    }

    initializeBoard() {
        this.board = new Board();

        this.setupPlayerPiecesStandard();
    }

    setupPlayerPiecesStandard() {
        const backRankPieces = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];

        for (let i = 0; i < 8; i++) {
            const col = 2 + i;
            this.board.set(2, col, { type: backRankPieces[i], player: 'yellow', hasMoved: false });
            this.board.set(3, col, { type: 'pawn', player: 'yellow', hasMoved: false });
        }

        for (let i = 0; i < 8; i++) {
            const col = 2 + i;
            this.board.set(9, col, { type: backRankPieces[i], player: 'green', hasMoved: false });
            this.board.set(8, col, { type: 'pawn', player: 'green', hasMoved: false });
        }

        for (let i = 0; i < 8; i++) {
            const row = 2 + i;
            this.board.set(row, 2, { type: backRankPieces[i], player: 'blue', hasMoved: false });
            this.board.set(row, 3, { type: 'pawn', player: 'blue', hasMoved: false });
        }

        for (let i = 0; i < 8; i++) {
            const row = 2 + i;
            this.board.set(row, 9, { type: backRankPieces[i], player: 'red', hasMoved: false });
            this.board.set(row, 8, { type: 'pawn', player: 'red', hasMoved: false });
        }
    }

    getPieceAt(r, c) {
        return this.board.get(r, c);
    }

    getValidMoves(r, c) {
        const piece = this.board.get(r, c);
        if (!piece || piece.player !== this.currentPlayer) return [];
        return this.board.getRawMovesForPiece(piece, r, c, true);
    }

    move(fromR, fromC, toR, toC, promotionType = null) {
        if (this.gameOver) return false;

        const piece = this.board.get(fromR, fromC);
        if (!piece || piece.player !== this.currentPlayer) return false;

        const validMoves = this.getValidMoves(fromR, fromC);
        const moveValid = validMoves.some(([r, c]) => r === toR && c === toC);
        if (!moveValid) return false;

        const config = PLAYER_CONFIG[this.currentPlayer];
        const isPawnPromotion = piece.type === 'pawn' && toR === config.promoRank;

        if (isPawnPromotion && !promotionType) {
            this.pendingPromotion = { fromR, fromC, toR, toC, piece };
            return 'promotion';
        }

        const captured = this.board.get(toR, toC);
        const notation = this.createNotation(piece, fromR, fromC, toR, toC, captured, promotionType);

        this.board.set(toR, toC, { ...piece, hasMoved: true });
        this.board.set(fromR, fromC, null);

        if (captured) {
            this.capturedPieces[this.currentPlayer].push({ ...captured });
        }

        if (promotionType) {
            this.board.set(toR, toC, { type: promotionType, player: this.currentPlayer, hasMoved: true });
            this.pendingPromotion = null;
        }

        this.moveLog.push({
            player: this.currentPlayer,
            notation,
            from: [fromR, fromC],
            to: [toR, toC],
            captured: captured ? { ...captured } : null,
            promotion: promotionType
        });

        this.lastMove = { from: [fromR, fromC], to: [toR, toC] };
        this.moveCount++;

        const nextPlayer = this.getNextPlayer();
        const checkState = this.getCheckState(nextPlayer);
        
        if (checkState === 'checkmate') {
            this.gameOver = true;
            this.winner = this.currentPlayer;
            this.winningTeam = PLAYER_CONFIG[this.currentPlayer].team;
        }

        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % 4;
        
        return true;
    }

    createNotation(piece, fromR, fromC, toR, toC, captured, promotionType) {
        const files = 'abcdefghijkl';
        const ranks = '123456789ABC'.split('');
        const pieceLetter = piece.type === 'pawn' ? '' : piece.type[0].toUpperCase();
        const capture = captured ? 'x' : '-';
        const promo = promotionType ? '=' + promotionType[0].toUpperCase() : '';
        return `${pieceLetter}${files[fromC]}${ranks[fromR]}${capture}${files[toC]}${ranks[toR]}${promo}`;
    }

    getNextPlayer() {
        return TURN_ORDER[(this.currentPlayerIndex + 1) % 4];
    }

    getCheckState(player) {
        const kingPos = this.board.findKing(player);
        if (!kingPos) return 'no-king';

        const opponentTeam = this.board.getOpponentTeam(player);
        const inCheck = this.board.isSquareAttacked(kingPos[0], kingPos[1], opponentTeam);

        let hasLegalMove = false;
        for (let r = 0; r < 12 && !hasLegalMove; r++) {
            for (let c = 0; c < 12 && !hasLegalMove; c++) {
                const piece = this.board.get(r, c);
                if (piece && piece.player === player) {
                    const moves = this.board.getRawMovesForPiece(piece, r, c, true);
                    if (moves.length > 0) {
                        hasLegalMove = true;
                    }
                }
            }
        }

        if (inCheck && !hasLegalMove) return 'checkmate';
        if (inCheck) return 'check';
        if (!hasLegalMove) return 'stalemate';
        return 'none';
    }

    undo() {
        if (this.moveLog.length === 0 || this.gameOver) return false;

        const lastMove = this.moveLog.pop();
        const piece = this.board.get(lastMove.to[0], lastMove.to[1]);
        
        this.board.set(lastMove.from[0], lastMove.from[1], { ...piece, hasMoved: false });
        
        if (lastMove.captured) {
            this.board.set(lastMove.to[0], lastMove.to[1], lastMove.captured);
            const idx = this.capturedPieces[this.currentPlayer].findIndex(p => 
                p.type === lastMove.captured.type && p.player === lastMove.captured.player
            );
            if (idx !== -1) this.capturedPieces[this.currentPlayer].splice(idx, 1);
        } else {
            this.board.set(lastMove.to[0], lastMove.to[1], null);
        }

        if (lastMove.promotion) {
            this.board.set(lastMove.from[0], lastMove.from[1], { type: 'pawn', player: lastMove.player, hasMoved: false });
        }

        this.currentPlayerIndex = (this.currentPlayerIndex - 1 + 4) % 4;
        this.moveCount--;
        this.gameOver = false;
        this.winner = null;
        this.winningTeam = null;

        return true;
    }

    newGame() {
        this.board = new Board();
        this.currentPlayerIndex = 0;
        this.moveLog = [];
        this.capturedPieces = { yellow: [], green: [], red: [], blue: [] };
        this.gameOver = false;
        this.winner = null;
        this.winningTeam = null;
        this.pendingPromotion = null;
        this.lastMove = null;
        this.moveCount = 0;
        this.initializeBoard();
    }

    completePromotion(promotionType) {
        if (!this.pendingPromotion) return false;
        
        const { fromR, fromC, toR, toC, piece } = this.pendingPromotion;
        return this.move(fromR, fromC, toR, toC, promotionType);
    }
}

window._game = new Game();