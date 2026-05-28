// AttackerUI.js
// Owns all DOM updates for the attacker side.
// Rewritten to match the new HTML structure from Step 1.
// HAS: + show/hide, + render functions, + event bindings - EJ

/*  UI Layout:
 *  Left sidebar (#attacker-hud):
 *    - #attacker-attacks-panel  → attack buttons (top)
 *    - #attacker-info-panel     → timer + session label + log (middle)
 *    - #attacker-controls-panel → back / next / help buttons (bottom)
 *  Right main (#attacker-main):
 *    - #attacker-lobby-view     → session card grid (default)
 *    - #attacker-session-view   → canvas snapshot + progress bar (when in session)
 */

class AttackerUI {
    constructor() {
        // Container
        this.container = document.getElementById('attacker-container');

        // Left sidebar elements
        this.attackGrid = document.getElementById('attacker-attack-grid');
        this.timerDisplay = document.getElementById('attacker-timer');
        this.sessionLabel = document.getElementById('attacker-session-label');
        this.logPanel = document.getElementById('attacker-log');
        this.backBtn = document.getElementById('attacker-back-btn');
        this.nextSessionBtn = document.getElementById('attacker-next-session-btn');
        this.helpBtn = document.getElementById('attacker-help-btn');

        // Right main elements
        this.lobbyView = document.getElementById('attacker-lobby-view');
        this.sessionView = document.getElementById('attacker-session-view');
        this.sessionList = document.getElementById('attacker-session-list');
        this.canvasSnapshot = document.getElementById('attacker-canvas-snapshot');
        this.progressFill = document.getElementById('attacker-progress-fill');
        this.missionOverlay = document.getElementById('attacker-mission-overlay');

        // Mission progress, 5 missions = 20% per step
        this._missionProgress = 0;
    }

    // ─────────────────────────────────────────
    // VISIBILITY

    show() {
        if (this.container) this.container.classList.remove('hidden');
    }

    hide() {
        if (this.container) this.container.classList.add('hidden');
    }

    // Show lobby card grid, hide session view
    showLobby() {
        if (this.lobbyView) this.lobbyView.classList.remove('hidden');
        if (this.sessionView) this.sessionView.classList.add('hidden');
        this._missionProgress = 0;
        this._updateProgressBar();
    }

    // Show active session canvas view, hide lobby
    showSessionView() {
        if (this.lobbyView) this.lobbyView.classList.add('hidden');
        if (this.sessionView) this.sessionView.classList.remove('hidden');
    }

    // ─────────────────────────────────────────
    // LOBBY — SESSION CARD GRID

    // Renders session cards in the lobby grid.
    // Each card has: left color stripe, snapshot thumbnail area, label + port below.
    // Clicking anywhere on the card triggers onJoin.

    renderSessionList(sessions, onJoin) {
        if (!this.sessionList) return;
        this.sessionList.innerHTML = '';

        if (sessions.length === 0) {
            this.sessionList.innerHTML = `
                <div class="attacker-empty">
                    <p>Sin sesiones activas.</p>
                    <p style="font-size:0.75rem; margin-top:6px;">Esperando detectives...</p>
                </div>
            `;
            return;
        }

        sessions.forEach((s, index) => {
            const card = document.createElement('div');
            card.className = 'session-card';
            card.dataset.sid = s.sessionId;

            // Progress as percentage (0-100) based on missionIndex stored on session
            const progressPct = (s.missionIndex || 0) * 20;

            card.innerHTML = `
                <div class="session-card-inner">
                    <!-- Left stripe — status color indicator -->
                    <div class="session-card-stripe ${s.status === 'IN_PROGRESS' ? 'active' : ''}"></div>

                    <!-- Snapshot area — shows detective canvas or placeholder -->
                    <div class="session-card-preview">
                        ${s.snapshot
                    ? `<img src="${s.snapshot}" alt="Session preview" class="session-snapshot-img" />`
                    : `<div class="session-snapshot-placeholder"></div>`
                }
                        <!-- Progress bar overlay on card -->
                        <div class="session-card-progress">
                            <div class="session-card-progress-fill" style="width:${progressPct}%"></div>
                        </div>
                    </div>
                </div>
                <!-- Label below card -->
                <div class="session-card-label">
                    <span class="session-id">${s.sessionId} · AGENTE ${index + 1}</span>
                    <span class="session-port">PORT ${s.port}</span>
                </div>
            `;

            card.addEventListener('click', () => onJoin(s.sessionId));
            this.sessionList.appendChild(card);
        });
    }

    // Updates a single session card's snapshot and progress bar.
    // Called when SESSION_SNAPSHOT arrives from server.

    updateSessionCard(sessionId, snapshotDataUrl, missionIndex) {
        const card = this.sessionList ? this.sessionList.querySelector(`[data-sid="${sessionId}"]`) : null;
        if (!card) return;
        const preview = card.querySelector('.session-card-preview');        // Update snapshot image
        if (preview) {
            let img = preview.querySelector('.session-snapshot-img');
            if (!img) {                                                     // Replace placeholder with real image
                const placeholder = preview.querySelector('.session-snapshot-placeholder');
                if (placeholder) placeholder.remove();
                img = document.createElement('img');
                img.className = 'session-snapshot-img';
                img.alt = 'Session preview';
                preview.insertBefore(img, preview.querySelector('.session-card-progress'));
            }
            img.src = snapshotDataUrl;
        }

        // Update progress bar on card
        const fill = card.querySelector('.session-card-progress-fill');
        if (fill) fill.style.width = `${(missionIndex || 0) * 20}%`;
    }

    // ─────────────────────────────────────────
    // ACTIVE SESSION VIEW

    updateSnapshot(snapshotDataUrl, missionIndex, missionTitle) {
        if (this.canvasSnapshot) {
            this.canvasSnapshot.src = snapshotDataUrl;
        }
        this._missionProgress = missionIndex || 0;
        this._updateProgressBar();
        if (this.missionOverlay) {
            this.missionOverlay.textContent = missionTitle || '';
        }
    }

    _updateProgressBar() {
        if (this.progressFill) {
            this.progressFill.style.width = `${this._missionProgress * 20}%`;
        }
    }

    // ─────────────────────────────────────────
    // ATTACK GRID - left sidebar top panel

    renderAttackGrid(attackStatuses, onAttack) {
        if (!this.attackGrid) return;
        this.attackGrid.innerHTML = '';

        attackStatuses.forEach(atk => {
            const btn = document.createElement('button');
            btn.className = `attack-btn ${atk.available ? 'available' : 'cooldown'}`;
            btn.dataset.key = atk.key;
            btn.disabled = !atk.available;

            // Color block background, replaced by PNG later
            btn.style.setProperty('--attack-color', atk.color);
            const usesText = atk.maxUses !== null ? ` (${atk.usesLeft}/${atk.maxUses})` : '';
            const cdSecs = atk.available ? '' : `<span class="attack-cd-secs">${Math.ceil(atk.cooldownMs / 1000)}s</span>`;
            btn.innerHTML = `
                <div class="attack-btn-color-block" style="background:${atk.color}">
                    ${cdSecs}
                </div>
                <span class="attack-btn-label">${atk.label}${usesText}</span>
            `;

            if (atk.available) {
                btn.addEventListener('click', () => onAttack(atk.key));
            }

            this.attackGrid.appendChild(btn);
        });
    }

    // Updates a single attack button state without full re-render.
    updateAttackCard(attackKey, status) {
        if (!this.attackGrid) return;
        const btn = this.attackGrid.querySelector(`[data-key="${attackKey}"]`);
        if (!btn) return;

        btn.className = `attack-btn ${status.available ? 'available' : 'cooldown'}`;
        btn.disabled = !status.available;

        const cdSecs = btn.querySelector('.attack-cd-secs');
        if (cdSecs) {
            cdSecs.textContent = status.available ? '' : `${Math.ceil(status.cooldownMs / 1000)}s`;
        }

        const label = btn.querySelector('.attack-btn-label');
        if (label && status.maxUses !== null) {
            label.textContent = `${status.label} (${status.usesLeft}/${status.maxUses})`;
        }
    }

    // ─────────────────────────────────────────
    // TIMER

    updateTimer(msRemaining) {
        if (!this.timerDisplay) return;
        const secs = Math.ceil(msRemaining / 1000);
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        this.timerDisplay.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        this.timerDisplay.style.color = msRemaining < 30000 ? '#ff3c3c' : '#00f2ff';
    }

    // ─────────────────────────────────────────
    // SESSION LABEL

    setSessionLabel(sessionId) {
        if (this.sessionLabel) {
            this.sessionLabel.textContent = sessionId || '---';
        }
    }

    // ─────────────────────────────────────────
    // EVENT LOG

    log(message, type = 'info') {
        if (!this.logPanel) return;
        const line = document.createElement('div');
        line.className = `log-line log-${type}`;
        const time = new Date().toLocaleTimeString('es-CO', {
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
        line.textContent = `[${time}] ${message}`;
        this.logPanel.appendChild(line);
        // Keep log scrolled to bottom, cap at 50 lines
        if (this.logPanel.children.length > 50) {
            this.logPanel.removeChild(this.logPanel.firstChild);
        }
        this.logPanel.scrollTop = this.logPanel.scrollHeight;
    }

    // ─────────────────────────────────────────
    // CONNECTION STATES

    showConnecting() {
        if (!this.sessionList) return;
        this.sessionList.innerHTML = `
            <div class="attacker-empty">
                <p style="color:var(--primary-neon);">Conectando al servidor...</p>
            </div>
        `;
    }

    showConnectionError() {
        if (!this.sessionList) return;
        this.sessionList.innerHTML = `
            <div class="attacker-empty">
                <p style="color:var(--accent-red);">Error de conexión.</p>
                <p style="font-size:0.75rem; margin-top:6px;">Verifica que el servidor esté corriendo en PORT ${typeof GAME_CONFIG !== 'undefined' ? GAME_CONFIG.serverPort : '8080'
            }.</p>
            </div>
        `;
    }

    // ─────────────────────────────────────────
    // HELP MODAL - describes each attack

    showAttackHelp(attacks) {
        // Reuse the game's existing modal if available
        const modalContainer = document.getElementById('modal-container');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body-content');
        const closeBtn = document.getElementById('close-modal');

        if (!modalContainer || !modalTitle || !modalBody) return;

        modalTitle.textContent = 'MANUAL DE ATAQUES';
        modalBody.innerHTML = attacks.map(atk => `
            <div style="margin-bottom:16px; border-left:3px solid ${atk.color}; padding-left:12px;">
                <p style="font-weight:700; color:${atk.color}; font-size:0.9rem;">${atk.label}
                    ${atk.maxUses ? `<span style="color:var(--text-dim); font-weight:400;">(${atk.maxUses} usos)</span>` : ''}
                </p>
                <p style="font-size:0.82rem; color:var(--text-dim); margin-top:4px;">${atk.desc}</p>
                <p style="font-size:0.75rem; color:var(--text-dim); margin-top:2px;">Cooldown: ${atk.cooldown / 1000}s</p>
            </div>
        `).join('');

        modalContainer.classList.remove('hidden');
        if (closeBtn) closeBtn.onclick = () => modalContainer.classList.add('hidden');
    }
}