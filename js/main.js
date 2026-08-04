// Four-Handed Chess II - Main Entry Point

function initGame() {
    // Initialize game
    window._game = new Game();
    
    // Initial render
    renderAll(window._game);
    
    // Event listeners for controls
    document.getElementById('new-game-btn').addEventListener('click', () => {
        window._game.newGame();
        selectedSquare = null;
        validMoveTargets = [];
        hideGameOverModal();
        hidePromotionModal();
        renderAll(window._game);
    });
    
    document.getElementById('undo-btn').addEventListener('click', () => {
        window._game.undo();
        selectedSquare = null;
        validMoveTargets = [];
        renderAll(window._game);
    });
    
    document.getElementById('modal-close').addEventListener('click', () => {
        window._game.newGame();
        selectedSquare = null;
        validMoveTargets = [];
        hideGameOverModal();
        hidePromotionModal();
        renderAll(window._game);
    });
    
    // Close modals on overlay click
    document.getElementById('game-over-modal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            hideGameOverModal();
        }
    });
    
    document.getElementById('promotion-modal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            hidePromotionModal();
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (!document.getElementById('game-over-modal').classList.contains('hidden')) {
                hideGameOverModal();
            }
            if (!document.getElementById('promotion-modal').classList.contains('hidden')) {
                hidePromotionModal();
            }
            selectedSquare = null;
            validMoveTargets = [];
            renderBoard(window._game);
        }
        if (e.key === 'u' || e.key === 'U') {
            if (!document.getElementById('undo-btn').disabled) {
                window._game.undo();
                selectedSquare = null;
                validMoveTargets = [];
                renderAll(window._game);
            }
        }
        if (e.key === 'n' || e.key === 'N') {
            window._game.newGame();
            selectedSquare = null;
            validMoveTargets = [];
            hideGameOverModal();
            hidePromotionModal();
            renderAll(window._game);
        }
    });
    
    // Expose game for debugging
    window.game = window._game;
    console.log('Four-Handed Chess II initialized!');
    console.log('Controls:');
    console.log('  Click piece to select, click target to move');
    console.log('  U - Undo move');
    console.log('  N - New game');
    console.log('  Escape - Deselect / Close modals');
    console.log('Access game state via window.game or window._game');
}

// Run on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}