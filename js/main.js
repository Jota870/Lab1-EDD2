// main.js
// Built from the older main_v3 used after pulling out all the unnecessary and uncategorized UI buttons.
// HAS: Program execution for the DOM (basically the pane for the game), as well as the execution to switch the type of detective/attacker window..

const GAME_CONFIG = {
    mode: 'multiplayer', // 'singleplayer' | 'multiplayer'
    serverHost: window.location.hostname || 'localhost',  // dynamic host
    serverPort: 8080,
    passphrase: 'REDACTED'          // backdoor trigger word
};

document.addEventListener('DOMContentLoaded', () => {
    const game = new GameController();
    game.init();

    // Only wire the backdoor in multiplayer mode
    if (GAME_CONFIG.mode === 'multiplayer') {
        _initBackdoor(game);
    }
});


// ─────────────────────────────────────────
// BACKDOOR — hidden passphrase entry
// Triggered by pressing 'K' on the main menu.
// Typing the correct passphrase forks into the attacker pathway

function _initBackdoor(gameController) {
    let inputVisible = false;
    let inputEl = null;

    document.addEventListener('keydown', (e) => {
        if (e.target && e.target.id === 'backdoor-input') return;

        const mainMenu = document.getElementById('main-menu');
        if (!mainMenu || mainMenu.classList.contains('hidden')) return;

        if (e.key === 'k' || e.key === 'K') {
            if (!inputVisible) {
                _showPassphraseInput(gameController, (el) => {
                    inputEl = el;
                    inputVisible = true;
                });
            } else {
                _hidePassphraseInput(inputEl);
                inputVisible = false;
                inputEl = null;
            }
        }
    });
}

function _showPassphraseInput(gameController, onCreate) {
    const wrapper = document.createElement('div');
    wrapper.id = 'backdoor-input-wrapper';
    wrapper.innerHTML = `
        <div id="backdoor-terminal">
            <span id="backdoor-prompt">root@casefile:~$ </span>
            <input
                id="backdoor-input"
                type="password"
                autocomplete="off"
                spellcheck="false"
                maxlength="32"
                placeholder=""
            />
        </div>
    `;

    document.getElementById('main-menu').appendChild(wrapper);

    const input = wrapper.querySelector('#backdoor-input');
    input.focus();

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const value = input.value.trim().toUpperCase();
            if (value === GAME_CONFIG.passphrase) {
                _hidePassphraseInput(wrapper);
                _launchAttacker();
            } else {
                input.style.color = '#ff3c3c';
                input.value = '';
                setTimeout(() => { input.style.color = ''; }, 600);
            }
        }
        if (e.key === 'Escape') {
            _hidePassphraseInput(wrapper);
        }
    });

    onCreate(wrapper);
}

function _hidePassphraseInput(wrapper) {
    if (wrapper && wrapper.parentNode) {
        wrapper.parentNode.removeChild(wrapper);
    }
}

function _launchAttacker() {
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('game-container').classList.add('hidden');
    document.getElementById('attacker-container').classList.remove('hidden');

    window.attacker = new AttackerController();
    window.attacker.init();
}
