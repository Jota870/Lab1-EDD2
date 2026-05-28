// AttackerController.js
// GameController's alternate version used for configuring the attacker panel.
// HAS: initial setup, network event binding, attack triggering, timer management, and session handling - EJ

class AttackerController {

    constructor() {
        this.ui = new AttackerUI();
        this.attacks = new AttackManager();

        this.state = null;
        this.sessionId = null;  // currently infiltrated session

        // All known sessions, kept in sync with SESSION_LIST updates, used by next-session cycling
        this._sessionRegistry = [];
        this._sessionRegistryIndex = 0;

        // 2 minute timer
        this.TIMER_DURATION = 3 * 60 * 1000;
        this.timerRemaining = null;
        this._timerEnd = null;
        this._timerInterval = null;
        this._uiTickInterval = null;
    }

    // ─────────────────────────────────────────
    // BOOT

    init() {
        this.ui.show();
        this.ui.showLobby();
        this._bindUIButtons();
        this._bindNetworkEvents();
        this._connect();
    }

    // ─────────────────────────────────────────
    // STATE MACHINE

    transition(newState) {
        console.log(`[AttackerController] ${this.state} → ${newState}`);
        this.state = newState;

        switch (newState) {
            case 'CONNECTING': return this._handleConnecting();
            case 'LOBBY': return this._handleLobby();
            case 'IN_SESSION': return this._handleInSession();
            case 'KICKED': return this._handleKicked();
            case 'ATTACKER_WIN': return this._handleAttackerWin();
            default:
                console.warn(`[AttackerController] Unknown state: ${newState}`);
        }
    }

    // ─────────────────────────────────────────
    // STATE HANDLERS

    _handleConnecting() {
        this.ui.showLobby();
        this.ui.showConnecting();
    }

    _handleLobby() {
        this.sessionId = null;
        this.attacks.reset();
        this._stopTimer();
        this._stopUITick();

        this.ui.showLobby();
        this.ui.setSessionLabel(null);
        this.ui.updateTimer(this.TIMER_DURATION);
        this.ui.log('Conectado. Esperando sesiones activas...', 'info');

        NetworkManager.registerAttacker();
    }

    _handleInSession() {
        this.ui.showSessionView();          // Show the canvas snapshot view
        this.ui.setSessionLabel(this.sessionId);
        this.ui.log(`Infiltrado en ${this.sessionId}`, 'attack');

        this.ui.renderAttackGrid(           // Render attack grid in left sidebar
            this.attacks.getAllStatus(),
            (attackKey) => this._onAttackSelected(attackKey)
        );

        this._startTimer(this.timerRemaining);
        this._startUITick();
    }

    _handleKicked() {
        this._stopTimer();
        this._stopUITick();
        this.ui.log('El detective completó las misiones. Expulsado de la sesión.', 'warn');

        setTimeout(() => {
            NetworkManager.registerAttacker();
            this.transition('LOBBY');
        }, 2000);
    }

    _handleAttackerWin() {
        this._stopTimer();
        this._stopUITick();
        this.ui.log('¡Tiempo agotado! El detective fue eliminado.', 'attack');

        setTimeout(() => {
            this.transition('LOBBY');
        }, 3000);
    }

    // ─────────────────────────────────────────
    // NETWORK EVENT BINDINGS

    _bindNetworkEvents() {
        // Updated session list from server
        NetworkManager.on('SESSION_LIST', (msg) => {
            this._sessionRegistry = msg.sessions || [];  // Always keep registry in sync regardless of state

            if (this.state !== 'LOBBY') return;
            this.ui.renderSessionList(
                this._sessionRegistry,
                (sessionId) => this._onJoinSession(sessionId)
            );
        });

        // Join confirmed
        NetworkManager.on('JOIN_CONFIRMED', (msg) => {
            this.sessionId = msg.sessionId;
            this.timerRemaining = msg.timerRemaining;
            this.transition('IN_SESSION');
        });

        // Join rejected
        NetworkManager.on('JOIN_REJECTED', (msg) => {
            this.ui.log(`Join rechazado: ${msg.reason}`, 'warn');
        });

        // Returned to lobby
        NetworkManager.on('RETURNED_TO_LOBBY', () => {
            this.transition('LOBBY');
        });

        // Detective won, attacker kicked
        NetworkManager.on('KICKED', () => {
            this.transition('KICKED');
        });

        // Detective disconnected
        NetworkManager.on('SESSION_CLOSED', () => {
            this.ui.log('La sesión del detective se cerró.', 'warn');
            this.transition('LOBBY');
        });

        // SNAPSHOT,
        // Server relays a canvas snapshot from the detective, triggered on: mission complete or incoming attack received.

        NetworkManager.on('SESSION_SNAPSHOT', (msg) => {
            const { sessionId, snapshot, missionIndex, missionTitle } = msg;

            // Update the card in lobby
            this.ui.updateSessionCard(sessionId, snapshot, missionIndex);

            // If this snapshot is from our current session, update the full view too
            if (this.state === 'IN_SESSION' && sessionId === this.sessionId) {
                this.ui.updateSnapshot(snapshot, missionIndex, missionTitle);
            }
        });

        // Game event log from detective
        NetworkManager.on('GAME_EVENT', (msg) => {
            if (msg.payload && msg.payload.event) {
                this.ui.log(`Detective: ${msg.payload.event}`, 'info');
            }
        });

        // Server disconnected
        NetworkManager.on('DISCONNECTED', () => {
            this.ui.log('Conexión perdida con el servidor.', 'warn');
            this.ui.showConnectionError();
        });
    }

    // ─────────────────────────────────────────
    // UI BUTTON BINDINGS

    _bindUIButtons() {
        if (this.ui.backBtn) {
            this.ui.backBtn.addEventListener('click', () => this._onLeaveSession());
        }

        if (this.ui.nextSessionBtn) {
            this.ui.nextSessionBtn.addEventListener('click', () => this._onNextSession());
        }

        if (this.ui.helpBtn) {
            this.ui.helpBtn.addEventListener('click', () => {
                // Pass attack definitions to help modal
                this.ui.showAttackHelp(this.attacks.getAllStatus().map(s => ({
                    label: s.label,
                    desc: s.desc,
                    color: s.color,
                    maxUses: s.maxUses,
                    cooldown: this.attacks.ATTACKS[s.key].cooldown
                })));
            });
        }
    }

    // ─────────────────────────────────────────
    // USER ACTIONS

    _onJoinSession(sessionId) {
        if (this.state !== 'LOBBY') return;
        this.ui.log(`Intentando infiltrar ${sessionId}...`, 'info');
        NetworkManager.joinSession(sessionId);
    }

    _onLeaveSession() {
        if (this.state !== 'IN_SESSION') return;
        this._stopTimer();
        this._stopUITick();
        NetworkManager.leaveSession();
        this.ui.log('Saliendo de la sesión...', 'info');
        // Transition fires when server confirms RETURNED_TO_LOBBY
    }

    // Cycles to the next available session in the registry, as you leave the current session and join the next one. 
    _onNextSession() {
        if (this.state !== 'IN_SESSION') return;
        if (this._sessionRegistry.length < 2) {
            this.ui.log('No hay otras sesiones disponibles.', 'warn');
            return;
        }

        // Find next session that isn't the current one and isn't finished
        const available = this._sessionRegistry.filter(
            s => s.sessionId !== this.sessionId && s.status !== 'FINISHED'
        );
        if (available.length === 0) {
            this.ui.log('No hay otras sesiones activas.', 'warn');
            return;
        }

        // Pick the next one cyclically
        this._sessionRegistryIndex = (this._sessionRegistryIndex + 1) % available.length;
        const next = available[this._sessionRegistryIndex];
        this.ui.log(`Cambiando a ${next.sessionId}...`, 'info');

        // Leave current, then join next on RETURNED_TO_LOBBY
        this._pendingJoin = next.sessionId;
        NetworkManager.leaveSession();

        // Override RETURNED_TO_LOBBY just for this transition
        const _onReturn = () => {
            NetworkManager.off('RETURNED_TO_LOBBY', _onReturn);
            this._pendingJoin = null;
            NetworkManager.joinSession(next.sessionId);
        };
        NetworkManager.on('RETURNED_TO_LOBBY', _onReturn);
    }

    _onAttackSelected(attackKey) {
        if (this.state !== 'IN_SESSION') return;

        if (!this.attacks.canUse(attackKey)) {
            this.ui.log(`${attackKey} en cooldown.`, 'warn');
            return;
        }

        this.attacks.registerUse(attackKey);
        NetworkManager.sendAttack(attackKey, {});
        this.ui.log(`Ataque enviado: ${attackKey}`, 'attack');

        // Refresh grid immediately to show new cooldown state
        this.ui.renderAttackGrid(
            this.attacks.getAllStatus(),
            (key) => this._onAttackSelected(key)
        );
    }

    // ─────────────────────────────────────────
    // TIMER

    _startTimer(duration = this.TIMER_DURATION) {
        this._timerEnd = Date.now() + duration;

        this._timerInterval = setInterval(() => {
            const remaining = this._timerEnd - Date.now();

            if (remaining <= 0) {
                this._stopTimer();
                NetworkManager.notifyAttackerWin();
                this.transition('ATTACKER_WIN');
                return;
            }

            this.ui.updateTimer(remaining);
        }, 250);
    }

    _stopTimer() {
        if (this._timerInterval) {
            clearInterval(this._timerInterval);
            this._timerInterval = null;
        }
    }

    // ─────────────────────────────────────────
    // UI TICK, cooldown bar updates

    _startUITick() {
        this._uiTickInterval = setInterval(() => {
            if (this.state !== 'IN_SESSION') return;
            this.attacks.getAllStatus().forEach(s => this.ui.updateAttackCard(s.key, s));
        }, 500);
    }

    _stopUITick() {
        if (this._uiTickInterval) {
            clearInterval(this._uiTickInterval);
            this._uiTickInterval = null;
        }
    }

    // ─────────────────────────────────────────
    // CONNECTION

    _connect() {
        this.transition('CONNECTING');
        const serverUrl = `ws://${GAME_CONFIG.serverHost}:${GAME_CONFIG.serverPort}`;

        NetworkManager.connect(serverUrl)
            .then(() => this.transition('LOBBY'))
            .catch(() => {
                this.ui.showConnectionError();
                this.ui.log('No se pudo conectar al servidor.', 'warn');
            });
    }
}