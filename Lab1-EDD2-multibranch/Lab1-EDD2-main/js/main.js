// main.js
// Built from the older main_v3 used after pulling out all the unnecessary and uncategorized UI buttons.
// HAS: Program execution for the DOM (basically the pane for the game).

document.addEventListener('DOMContentLoaded', () => {
    const game = new GameController();
    game.init();
});