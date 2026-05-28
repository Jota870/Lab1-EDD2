// UIRenderer.js
// New special class made to replace the string of spaghetti code inside index.html - EJ
// HAS: anything related to the page itself is changed here, only works as display.

class UIRenderer {
    constructor() {
        // Main Panels
        this.mainMenu = document.getElementById('main-menu');
        this.gameContainer = document.getElementById('game-container');

        // HUD / UI Elements
        this.levelIndicator = document.getElementById('level-indicator');
        this.scoreDisplay = document.getElementById('score-display');
        this.scenarioText = document.getElementById('scenario-text');
        this.evidenceList = document.getElementById('evidence-list');
        this.lawText = document.getElementById('law-text');
        this.dialogText = document.getElementById('dialog-text');
        this.classifyOptions = document.getElementById('classification-options');
        this.nextActionBtn = document.getElementById('next-action-btn');

        // MODALS
        this.modalContainer = document.getElementById('modal-container');
        this.modalTitle = document.getElementById('modal-title');
        this.modalBody = document.getElementById('modal-body-content');
        this.closeModalBtn = document.getElementById('close-modal');

        // EVIDENCE VIEWER TAB
        this.evidenceViewer = document.getElementById('evidence-viewer');
        this.viewerImg = document.getElementById('viewer-img');
        this.viewerCaption = document.getElementById('viewer-caption');
        this.closeViewerBtn = document.getElementById('close-viewer');

        // MISSION BAR
        this.missionBar = document.getElementById('mission-bar');
        this.missionTitle = document.getElementById('mission-title');
        this.missionInstr = document.getElementById('mission-instructions');

        // ALGORITHM
        this.algoResultBox = document.getElementById('algo-result-box');

        this._onCloseModal = null;
        this._bindModalClose();

        if (this.closeViewerBtn) {
            this.closeViewerBtn.onclick = () => {
                if (this.evidenceViewer) this.evidenceViewer.classList.add('hidden');
            };
        }
        if (this.evidenceViewer) {
            this.evidenceViewer.onclick = (e) => {
                if (e.target === this.evidenceViewer) {
                    this.evidenceViewer.classList.add('hidden');
                }
            };
        }
    }

    // ─────────────────────────────────────────
    // GAME STATE TRANSITIONS

    showMainMenu() {
        this.mainMenu.classList.remove('hidden');
        this.gameContainer.classList.add('hidden');
    }

    showGame() {
        this.mainMenu.classList.add('hidden');
        this.gameContainer.classList.remove('hidden');
    }

    setHUDState(state) { // HUD SWITCHES
        switch (state) {
            case 'INVESTIGATING':
                this.classifyOptions.classList.add('hidden');
                this.nextActionBtn.classList.remove('hidden');
                this.nextActionBtn.textContent = 'Analizar Pruebas';
                break;
            case 'CLASSIFYING':
                this.nextActionBtn.classList.add('hidden');
                this.classifyOptions.classList.remove('hidden');
                break;
            case 'IDLE':
                this.classifyOptions.classList.add('hidden');
                this.nextActionBtn.classList.add('hidden');
                break;
        }
    }

    // ─────────────────────────────────────────
    // SCORE + LEVEL INDICATOR

    updateScore(score) {
        this.scoreDisplay.textContent = `Karma: ${score}`;
    }

    updateMissionIndicator(missionTitle) {
        this.levelIndicator.textContent = missionTitle;
    }

    setDialogText(text) {
        this.dialogText.textContent = text;
    }

    // ─────────────────────────────────────────
    // CASEFILE PANEL 

    showCasefile(node) { // Node info opens up 
        this.scenarioText.textContent = node.narrative;     //  Narrative
        this.evidenceList.innerHTML = '';                   // Evidence
        if (node.evidence && node.evidence.length > 0) {
            node.evidence.forEach(ev => {
                const li = document.createElement('li');
                li.className = 'evidence-tag';
                li.textContent = ev;

                const assetPath = this._getEvidenceAsset(node, ev);
                if (assetPath) {
                    li.style.cursor = 'pointer';
                    li.style.border = '1px solid var(--primary-neon)';
                    li.title = 'Haz clic para inspeccionar la prueba';
                    li.onclick = () => {
                        this.showEvidenceViewer(assetPath, `${ev} - Caso de ${node.name} (ID: ${node.id})`);
                    };
                }

                this.evidenceList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.className = 'evidence-tag';
            li.style.background = 'rgba(0,242,255,0.1)';
            li.textContent = 'Sin evidencia sospechosa';
            this.evidenceList.appendChild(li);
        }
        if (node.isClean) {                                 // LAW
            this.lawText.textContent = 'Sin actividad delictiva detectada.';
        } else if (node.classified) {
            this.lawText.textContent = `Clasificado: ${node.crimeConfig.label} - ${node.crimeConfig.law}`;
        } else {
            this.lawText.textContent = '¿Bajo qué ley clasificamos esto?';
        }
    }

    _getEvidenceAsset(node, evText) {
        const num = (node.id % 100) + 1;
        const text = evText.toLowerCase();

        let prefix = null;
        if (text.includes('afirmación') || text.includes('afirmacion') || text.includes('suplantada') || text.includes('falsa') || text.includes('falso')) {
            // Check if Calumnia or Suplantacion
            if (text.includes('perfil') || text.includes('falso') || text.includes('suplantación') || text.includes('suplantacion')) {
                prefix = 'suplantacion';
            } else {
                prefix = 'calumnia';
            }
        } else if (text.includes('pantalla') || text.includes('ofensiva') || text.includes('hostigamiento')) {
            prefix = 'hostigamiento';
        } else if (text.includes('mensajes') || text.includes('coordinados')) {
            prefix = 'injuria';
        } else if (text.includes('perfil') || text.includes('suplantación') || text.includes('suplantacion')) {
            prefix = 'suplantacion';
        }

        if (!prefix) return null;

        const files = {
            "calumnia": {
                1: "assets/calumnia-1.jpg",
                2: "assets/calumnia-2.jpeg"
            },
            "hostigamiento": {
                1: "assets/hostigamiento-1.png",
                2: "assets/hostigamiento-2.png",
                3: "assets/hostigamiento-3.png",
                4: "assets/hostigamiento-4.png"
            },
            "injuria": {
                1: "assets/injuria-1.png",
                2: "assets/injuria-2.jpeg"
            },
            "suplantacion": {
                1: "assets/suplantacion-1.jpeg",
                2: "assets/suplantacion-2.jpeg",
                3: "assets/suplantacion-3.png"
            }
        };

        const fileMap = files[prefix];
        const maxNum = Object.keys(fileMap).length;
        const finalNum = ((num - 1) % maxNum) + 1;
        return fileMap[finalNum];
    }

    showEvidenceViewer(imgPath, caption) {
        if (!this.evidenceViewer) return;
        this.viewerImg.src = imgPath;
        this.viewerCaption.textContent = caption;
        this.evidenceViewer.classList.remove('hidden');
    }

    showClassificationButtons(options, onSelect) {          // Renders classification button.
        this.classifyOptions.innerHTML = '';
        this.classifyOptions.classList.remove('hidden');
        this.nextActionBtn.classList.add('hidden');

        options.forEach(option => {
            const btn = document.createElement('button');
            btn.className = 'crime-btn';
            btn.textContent = option;
            btn.onclick = () => {
                btn.blur();
                onSelect(option);
            };
            this.classifyOptions.appendChild(btn);
        });
    }

    clearCasefile() {                                       // Reverts back to default state at the end.
        this.scenarioText.textContent = 'Haz clic en un nodo para analizarlo.';
        this.evidenceList.innerHTML = '';
        this.lawText.textContent = 'Esperando análisis...';
        this.classifyOptions.classList.add('hidden');
        this.nextActionBtn.classList.add('hidden');
    }

    // ─────────────────────────────────────────
    // MISSION PANEL (top bar above canvas)

    showMissionPanel(mission) {
        if (!this.missionBar) return;
        this.missionBar.classList.remove('hidden');
        if (this.missionTitle) this.missionTitle.textContent = mission.title;
        if (this.missionInstr) this.missionInstr.textContent = mission.instructions;
    }

    // ─────────────────────────────────────────
    // ALGORITHM RESULT BOX (overlay on canvas)

    showAlgoResult(title, content) {
        if (!this.algoResultBox) return;
        this.algoResultBox.innerHTML = `<strong>${title}</strong><br>${content}`;
        this.algoResultBox.classList.remove('hidden');
    }

    hideAlgoResult() {
        if (!this.algoResultBox) return;
        this.algoResultBox.classList.add('hidden');
    }

    // ─────────────────────────────────────────
    // MODAL

    showModal(title, htmlContent, onClose = null) {
        this.modalTitle.textContent = title;
        this.modalBody.innerHTML = htmlContent;
        this.modalContainer.classList.remove('hidden');
        this._onCloseModal = onClose;
    }

    closeModal() {
        this.modalContainer.classList.add('hidden');
        if (this._onCloseModal) {
            this._onCloseModal();
            this._onCloseModal = null;
        }
    }

    _bindModalClose() {
        if (this.closeModalBtn) {
            this.closeModalBtn.addEventListener('click', () => this.closeModal());
        }
    }

    // ─────────────────────────────────────────
    // FINAL REPORT (avl tree)

    showFinalReport(tree) {
        const nodes = tree.getInOrder();

        let html = `
            <p style="margin-bottom:15px; color:var(--text-dim);">
                Casos clasificados en el Árbol AVL ordenados por gravedad.
            </p>
            <hr style="border-color:var(--border-color); margin-bottom:15px;">
        `;

        if (nodes.length === 0) {
            html += '<p>No se clasificaron casos en esta sesión.</p>';
        } else {
            nodes.forEach(n => {
                html += `
                    <div style="margin-bottom:18px; border-bottom:1px solid #333; padding-bottom:12px;">
                        <p><strong>ID:</strong> ${n.caseId} &nbsp;|&nbsp; <strong>Nombre:</strong> ${n.name}</p>
                        <p><strong>Tipo:</strong> ${n.type}</p>
                        <p><strong>Pruebas:</strong> ${n.evidence.join(', ')}</p>
                        <p><strong>Ley:</strong> ${n.law}</p>
                        <p style="color:var(--accent-red)"><strong>Sanción:</strong> ${n.penalty}</p>
                    </div>
                `;
            });
        }

        this.showModal('REPORTE TÉCNICO FINAL', html);
    }

    // ─────────────────────────────────────────
    // HELP MODAL

    showHelp() {
        const html = `
            <div style="max-height:420px; overflow-y:auto; padding-right:10px; line-height:1.7; font-size:0.9rem;">
                <ul style="list-style-type:'⚖️ '; padding-left:15px;">
                    <li><strong>Injuria (Art. 220):</strong> Ofensas directas que dañan el honor de una persona.</li>
                    <li><strong>Calumnia (Art. 221):</strong> Acusar falsamente a alguien de un delito inexistente.</li>
                    <li><strong>Suplantación (Ley 1273):</strong> Usar datos ajenos para hacerse pasar por otro.</li>
                    <li><strong>Hostigamiento (Ley 1482):</strong> Acoso sistemático y reiterado para causar daño.</li>
                    <li><strong>Amenaza (Art. 347):</strong> Anunciar un mal grave e inminente contra alguien.</li>
                    <li><strong>Acceso Abusivo (Art. 269A):</strong> Entrar a sistemas informáticos sin permiso.</li>
                    <li><strong>Difamación:</strong> Dañar públicamente la reputación de una persona.</li>
                    <li><strong>Hurto de Datos:</strong> Apoderarse de información digital privada.</li>
                    <li><strong>Estafa Digital:</strong> Engaño informático para obtener beneficio ilícito.</li>
                    <li><strong>Acoso Colectivo:</strong> Ataque grupal coordinado contra una víctima.</li>
                    <li><strong>Ciberbullying:</strong> Intimidación sistemática a través de redes sociales.</li>
                    <li><strong>Extorsión:</strong> Obligar a alguien bajo amenaza grave.</li>
                </ul>
                <hr style="border-color:#444; margin:12px 0;">
                <p style="color:var(--primary-neon); font-size:0.75rem; text-align:center;">
                    Compara la definición con las pruebas recolectadas para clasificar correctamente.
                </p>
            </div>
        `;
        this.showModal('COMPENDIO LEGAL', html);
    }

    // ─────────────────────────────────────────
    // DIFFICULTY SELECTOR

    showDifficultySelect(onSelect) {
        const html = `
            <p style="color:var(--text-dim); margin-bottom:20px;">
                Selecciona la dificultad. Esto determina el tamaño de la red y la cantidad de actores maliciosos.
            </p>
            <div style="display:flex; flex-direction:column; gap:12px;">
                ${Object.entries(DIFFICULTIES).map(([key, cfg]) => `
                    <button
                        class="start-btn"
                        style="font-size:1rem; padding:12px 20px;"
                        onclick="window._diffSelect('${key}')"
                    >
                        ${cfg.label} — ${cfg.totalNodes} nodos, ${cfg.badNodes} actores maliciosos
                    </button>
                `).join('')}
            </div>
        `;

        // Temporary global so the inline onclick can reach the callback
        window._diffSelect = (key) => {
            delete window._diffSelect;
            this.closeModal();
            onSelect(key);
        };

        this.showModal('SELECCIONAR DIFICULTAD', html);
    }

    showTraversalSelect(onSelect) {
        const html = `
            <p style="color:var(--text-dim); margin-bottom:20px;">
                ¡Todos los nodos han sido analizados! 
                Selecciona el método para recorrer y mapear la red de contactos, iniciando desde Valeria (ID:100):
            </p>
            <div style="display:flex; flex-direction:column; gap:12px;">
                <button
                    class="start-btn"
                    style="font-size:1.1rem; padding:15px 20px; border-color:var(--primary-neon); color:var(--primary-neon); background: rgba(0, 242, 255, 0.05); font-weight: bold;"
                    onclick="window._travSelect('BFS')"
                >
                    BFS (Búsqueda en Anchura desde Valeria)
                </button>
                <button
                    class="start-btn"
                    style="font-size:1.1rem; padding:15px 20px; border-color:var(--secondary-neon); color:var(--secondary-neon); background: rgba(204, 0, 255, 0.05); font-weight: bold;"
                    onclick="window._travSelect('DFS')"
                >
                    DFS (Búsqueda en Profundidad desde Valeria)
                </button>
            </div>
        `;

        window._travSelect = (type) => {
            delete window._travSelect;
            this.closeModal();
            onSelect(type);
        };

        this.showModal('RECORRIDO DE RED', html);
    }

    showFlowSelect(nodes, onSelect) {
        let sourceOptions = '';
        let sinkOptions = '';

        // Sort nodes by ID for neatness
        const sortedNodes = [...nodes].sort((a, b) => a.id - b.id);

        sortedNodes.forEach(node => {
            const role = node.isClean ? 'Limpio' : (node.crimeConfig ? node.crimeConfig.label : 'Sospechoso');
            const label = `ID: ${node.id} - ${node.name} (${role})`;

            // Default selected: suggest source is highest ID or a bad actor, and sink is Valeria (100)
            const isSourceDefault = !node.isClean ? 'selected' : '';
            const isSinkDefault = node.id === 100 ? 'selected' : '';

            sourceOptions += `<option value="${node.id}" ${isSourceDefault}>${label}</option>`;
            sinkOptions += `<option value="${node.id}" ${isSinkDefault}>${label}</option>`;
        });

        const html = `
            <p style="color:var(--text-dim); margin-bottom:15px;">
                Selecciona el <strong>Nodo Origen (Atacante)</strong> y el <strong>Nodo Destino (Víctima)</strong> para calcular el flujo de datos dañinos en la red:
            </p>
            <div style="margin-bottom:15px; text-align:left;">
                <label style="display:block; margin-bottom:5px; font-weight:bold; color:var(--primary-neon); font-size:0.9rem;">Nodo de Origen (Atacante):</label>
                <select id="flow-source-select" style="width:100%; padding:10px; background:#1e293b; color:white; border:1px solid var(--border-color); border-radius:6px; font-size:0.9rem;">
                    ${sourceOptions}
                </select>
            </div>
            <div style="margin-bottom:20px; text-align:left;">
                <label style="display:block; margin-bottom:5px; font-weight:bold; color:var(--accent-red); font-size:0.9rem;">Nodo de Destino (Víctima / Valeria):</label>
                <select id="flow-sink-select" style="width:100%; padding:10px; background:#1e293b; color:white; border:1px solid var(--border-color); border-radius:6px; font-size:0.9rem;">
                    ${sinkOptions}
                </select>
            </div>
            <button id="run-flow-btn" class="start-btn" style="width:100%; font-size:1.1rem; padding:15px 20px; font-weight:bold;">
                Calcular Camino Minimo
            </button>
        `;

        this.showModal('CÁLCULO DE FLUJO MÁXIMO', html, null);

        const btn = document.getElementById('run-flow-btn');
        if (btn) {
            btn.onclick = () => {
                const srcId = parseInt(document.getElementById('flow-source-select').value);
                const snkId = parseInt(document.getElementById('flow-sink-select').value);
                this.closeModal();
                onSelect(srcId, snkId);
            };
        }
    }

    showDijkstraSelect(nodes, onSelect) {
        let sourceOptions = '';
        let sinkOptions = '';

        // Sort nodes by ID for neatness
        const sortedNodes = [...nodes].sort((a, b) => a.id - b.id);

        sortedNodes.forEach(node => {
            const role = node.isClean ? 'Limpio' : (node.crimeConfig ? node.crimeConfig.label : 'Sospechoso');
            const label = `ID: ${node.id} - ${node.name} (${role})`;

            // Default selected: suggest source is highest ID or a bad actor, and sink is Valeria (100)
            const isSourceDefault = !node.isClean ? 'selected' : '';
            const isSinkDefault = node.id === 100 ? 'selected' : '';

            sourceOptions += `<option value="${node.id}" ${isSourceDefault}>${label}</option>`;
            sinkOptions += `<option value="${node.id}" ${isSinkDefault}>${label}</option>`;
        });

        const html = `
            <p style="color:var(--text-dim); margin-bottom:15px;">
                Selecciona el <strong>Nodo Origen (Atacante)</strong> y el <strong>Nodo Destino (Víctima)</strong> para calcular el flujo menos dañino en la red:
            </p>
            <div style="margin-bottom:15px; text-align:left;">
                <label style="display:block; margin-bottom:5px; font-weight:bold; color:var(--primary-neon); font-size:0.9rem;">Nodo de Origen (Atacante):</label>
                <select id="dijkstra-source-select" style="width:100%; padding:10px; background:#1e293b; color:white; border:1px solid var(--border-color); border-radius:6px; font-size:0.9rem;">
                    ${sourceOptions}
                </select>
            </div>
            <div style="margin-bottom:20px; text-align:left;">
                <label style="display:block; margin-bottom:5px; font-weight:bold; color:var(--accent-red); font-size:0.9rem;">Nodo de Destino (Víctima / Valeria):</label>
                <select id="dijkstra-sink-select" style="width:100%; padding:10px; background:#1e293b; color:white; border:1px solid var(--border-color); border-radius:6px; font-size:0.9rem;">
                    ${sinkOptions}
                </select>
            </div>
            <button id="run-dijkstra-btn" class="start-btn" style="width:100%; font-size:1.1rem; padding:15px 20px; font-weight:bold;">
                Calcular Intervención de Flujo Máximo
            </button>
        `;

        this.showModal('CÁLCULO DE CAMINO MNIMO', html, null);

        const btn = document.getElementById('run-dijkstra-btn');
        if (btn) {
            btn.onclick = () => {
                const srcId = parseInt(document.getElementById('dijkstra-source-select').value);
                const snkId = parseInt(document.getElementById('dijkstra-sink-select').value);
                this.closeModal();
                onSelect(srcId, snkId);
            };
        }
    }

    showFinalSelect(nodes, onSelect) {
        let sourceOptions = '';
        let sinkOptions = '';

        // Sort nodes by ID for neatness
        const sortedNodes = [...nodes].sort((a, b) => a.id - b.id);

        sortedNodes.forEach(node => {
            const role = node.isClean ? 'Limpio' : (node.crimeConfig ? node.crimeConfig.label : 'Sospechoso');
            const label = `ID: ${node.id} - ${node.name} (${role})`;

            // Default selected: suggest source is highest ID or a bad actor, and sink is Valeria (100)
            const isSourceDefault = !node.isClean ? 'selected' : '';
            const isSinkDefault = node.id === 100 ? 'selected' : '';

            sourceOptions += `<option value="${node.id}" ${isSourceDefault}>${label}</option>`;
            sinkOptions += `<option value="${node.id}" ${isSinkDefault}>${label}</option>`;
        });

        const html = `
            <p style="color:var(--text-dim); margin-bottom:15px;">
                Selecciona el <strong>Nodo Origen (Atacante)</strong> y el <strong>Nodo Destino (Víctima)</strong> para restaurar la red:
            </p>
            <div style="margin-bottom:15px; text-align:left;">
                <label style="display:block; margin-bottom:5px; font-weight:bold; color:var(--primary-neon); font-size:0.9rem;">Nodo de Origen (Atacante):</label>
                <select id="final-source-select" style="width:100%; padding:10px; background:#1e293b; color:white; border:1px solid var(--border-color); border-radius:6px; font-size:0.9rem;">
                    ${sourceOptions}
                </select>
            </div>
            <div style="margin-bottom:20px; text-align:left;">
                <label style="display:block; margin-bottom:5px; font-weight:bold; color:var(--accent-red); font-size:0.9rem;">Nodo de Destino (Víctima / Valeria):</label>
                <select id="final-sink-select" style="width:100%; padding:10px; background:#1e293b; color:white; border:1px solid var(--border-color); border-radius:6px; font-size:0.9rem;">
                    ${sinkOptions}
                </select>
            </div>
            <button id="run-final-btn" class="start-btn" style="width:100%; font-size:1.1rem; padding:15px 20px; font-weight:bold;">
                Restaurar Red Final
            </button>
        `;

        this.showModal('RESTAURAR RED FINAL', html, null);

        const btn = document.getElementById('run-final-btn');
        if (btn) {
            btn.onclick = () => {
                const srcId = parseInt(document.getElementById('final-source-select').value);
                const snkId = parseInt(document.getElementById('final-sink-select').value);
                this.closeModal();
                onSelect(srcId, snkId);
            };
        }
    }

    // ─────────────────────────────────────────
    // FEEDBACK FLASH (classification)

    showFeedback(correct, message) {
        this.lawText.textContent = message;
        this.lawText.style.color = correct ? '#00ff88' : 'var(--accent-red)';
        setTimeout(() => {
            this.lawText.style.color = '';
        }, 2000);
    }

    // ─────────────────────────────────────────
    // MULTIPLAYER FUNCTIONS

    showAttackWarning(attackKey, message) {
        this.dialogText.textContent = `⚠ ATAQUE: ${message}`;
        this.dialogText.style.color = '#ff3c3c';
        this.dialogText.style.fontWeight = 'bold';
        setTimeout(() => {
            this.dialogText.style.color = '';
            this.dialogText.style.fontWeight = '';
        }, 3000);
    }
}