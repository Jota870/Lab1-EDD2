// GameController.js
// Based upon the scramble of spaghetti code in the script portion of index.html - EJ
// HAS: control over the game flow, game state, the score and coordination of modules.
// PULLS FROM: missions.js, graph.js, tree.js, graphrenderer.js, uirenderer.js

class GameController {

    constructor() {
        this.graph = new Graph();
        this.tree = new AVLTree();
        this.renderer = new GraphRenderer('graph-canvas');
        this.ui = new UIRenderer();
        this.sound = new SoundController();

        this.score = 0;
        this.state = 'MAIN_MENU';
        this.difficulty = null;
        this.missionIndex = 0;          // index into MISSIONS array
        this.graphData = null;       // raw output of generateGraph()

        this.classifiedBadIds = new Set();
        this.activeNode = null;
        this.completedMissions = new Set();
    }

    // ─────────────────────────────────────────
    // BOOT

    init() {
        this.ui.showMainMenu();
        this._bindMenuButtons();
        this._bindSoundEvents();
    }

    _bindSoundEvents() {
        // Listens for sound requests dispatched by UIRenderer (keeps UIRenderer decoupled)
        document.addEventListener('game:soundRequest', (e) => {
            switch (e.detail) {
                case 'proof': this.sound.playProof(); break;
            }
        });
    }

    _bindMenuButtons() {
        const startBtn = document.getElementById('start-btn');
        if (startBtn) startBtn.addEventListener('click', () => {
            this.sound.playStart();
            this._onStartClicked();
        });

        const helpBtn = document.getElementById('help-btn');
        if (helpBtn) helpBtn.addEventListener('click', () => {
            this.sound.playManual();
            this.ui.showHelp();
        });

        const nextBtn = document.getElementById('next-action-btn');
        if (nextBtn) nextBtn.addEventListener('click', () => {
            this.sound.playAnalyze();
            this._onNextAction();
        });

        const runAlgoBtn = document.getElementById('run-algo-btn');
        if (runAlgoBtn) runAlgoBtn.addEventListener('click', () => {
            this.sound.playFinish();
            this._onRunAlgorithm();
        });

        const missionTrackerBtn = document.getElementById('mission-tracker-btn');
        if (missionTrackerBtn) missionTrackerBtn.addEventListener('click', () => {
            this.sound.playMenuOpen();
            this._toggleMissionTracker();
        });

        const legalBtn = document.getElementById('legal-btn');
        if (legalBtn) legalBtn.addEventListener('click', () => {
            this.sound.playManual();
            this.ui.showHelp();
        });

        const closeTrackerBtn = document.getElementById('close-tracker-btn');
        if (closeTrackerBtn) closeTrackerBtn.addEventListener('click', () => {
            this.sound.playMenuClose();
            this._toggleMissionTracker();
        });

        const reportBtn = document.getElementById('report-btn');
        if (reportBtn) reportBtn.addEventListener('click', () => {
            this.sound.playMenuOpen();
            this.ui.showFinalReport(this.tree);
        });
    }

    // ─────────────────────────────────────────
    // STATE MACHINE (for changing between missions)

    transition(newState) {
        console.log(`[GameController] ${this.state} → ${newState}`);
        this.state = newState;

        switch (newState) {
            case 'DIFFICULTY_SELECT': return this._handleDifficultySelect();
            case 'GRAPH_INIT': return this._handleGraphInit();
            case 'MISSION_1': return this._handleMission(0);
            case 'MISSION_2': return this._handleMission(1);
            case 'MISSION_3': return this._handleMission(2);
            case 'MISSION_4': return this._handleMission(3);
            case 'MISSION_FINAL': return this._handleMission(4);
            case 'FINAL_REPORT': return this._handleFinalReport();
            default:
                console.warn(`[GameController] Unknown state: ${newState}`);
        }
    }

    // ─────────────────────────────────────────
    // STATE HANDLERS

    _onStartClicked() {
        this.transition('DIFFICULTY_SELECT');
    }

    _handleDifficultySelect() {
        this.ui.showDifficultySelect((diffKey) => {
            this.sound.playNext();
            this.difficulty = DIFFICULTIES[diffKey];
            this.transition('GRAPH_INIT');
        });
    }

    _handleGraphInit() {            // Generates the graph for the whole run
        this.graphData = generateGraph(this.difficulty);
        this.graph.buildFromNodes(
            this.graphData.nodes,
            this.graphData.edges,
            this.graphData.sourceId,
            this.graphData.sinkId
        );

        // Reset or Start as Null
        this.score = 0;
        this.missionIndex = 0;
        this.classifiedBadIds = new Set();
        this.completedMissions = new Set();
        this.tree = new AVLTree();
        this.activeNode = null;

        // Start and load graph into renderer
        this.ui.showGame();
        this.renderer.loadGraph(this.graph);
        this.renderer.onNodeClick((node) => this._onNodeClicked(node));

        // Update HUD
        this.ui.updateScore(this.score);
        this.ui.clearCasefile();
        this.ui.setHUDState('IDLE');
        this._updateMissionTracker();

        // Start mission 1
        this.transition('MISSION_1');
    }

    // MISSION HANDLER (for controlling the state passed)
    _handleMission(index) {
        this.missionIndex = index;
        const mission = MISSIONS[index];

        this.renderer.clearHighlights();
        this.ui.showMissionPanel(mission);
        this.ui.updateMissionIndicator(mission.title);
        this.ui.clearCasefile();
        this.ui.setHUDState('IDLE');
        this.ui.hideAlgoResult();

        const runBtn = document.getElementById('run-algo-btn'); // run button for algorithms
        if (runBtn) {
            if (index === 0) {
                runBtn.classList.add('hidden');
            } else {
                runBtn.textContent = this._algoButtonLabel(mission.algorithm);
                runBtn.classList.remove('hidden');
            }
        }

        this.ui.setDialogText(mission.objective);
        this._updateMissionTracker();

        // Flash the mission tracker open on mission transitions (after first)
        if (index > 0) {
            this._flashMissionTracker();
        }
    }

    // ─────────────────────────────────────────
    // NODE INTERACTION

    _onNodeClicked(node) {
        if (this.missionIndex !== 0) {          // Used in mission 1
            this.ui.setDialogText('En esta misión el análisis ya fue completado. Observa el algoritmo.');
            return;
        }

        if (node.classified) {                  // Already classified
            this.ui.showCasefile(node);
            this.ui.setHUDState('IDLE');
            this.ui.setDialogText(`${node.name} ya fue analizado.`);
            return;
        }

        this.activeNode = node;
        this.ui.showCasefile(node);

        if (node.isClean) {
            this.ui.setHUDState('INVESTIGATING');                       // Clean node
            this.ui.setDialogText(`Analizando a ${node.name}...`);
        } else {
            const options = getClassificationOptions(node);             // Bad Node
            this.ui.showClassificationButtons(options, (selected) => {
                this._onClassificationSubmit(node, selected);
            });
            this.ui.setDialogText(`¿Qué delito cometió ${node.name}?`);
        }
    }

    _onNextAction() { // Analizar Pruebas button
        if (!this.activeNode) return;

        if (this.activeNode.isClean && !this.activeNode.classified) {
            this.activeNode.classified = true;
            this._addScore(SCORE.CLEAN_NODE_VISITED);
            this.ui.showFeedback(true, 'Sin actividad delictiva. +' + SCORE.CLEAN_NODE_VISITED + ' karma.');
            this.ui.setHUDState('IDLE');
            this.renderer.draw();
            this.activeNode = null;
            this._checkMission1Complete();
        }
    }

    _onClassificationSubmit(node, selectedLabel) {      // Button used in classifying evidence
        const correct = checkClassification(node, selectedLabel);

        if (correct) {
            node.classified = true;
            this.classifiedBadIds.add(node.id);
            this.tree.insertNode(node);
            this._addScore(SCORE.CORRECT);
            this.sound.playCorrect();
            this.ui.showFeedback(true, `¡Correcto! ${node.crimeConfig.label} — +${SCORE.CORRECT} karma.`);
            this.ui.showCasefile(node);
            this.ui.setHUDState('IDLE');
            this.renderer.draw();
            this.activeNode = null;
            this._checkMission1Complete();
        } else {
            this._addScore(SCORE.WRONG);
            this.sound.playIncorrect();
            this.ui.showFeedback(false, `Incorrecto. ${SCORE.WRONG} karma. Intenta de nuevo.`);
        }
    }

    // ─────────────────────────────────────────
    // ALGORITHM MISSION (2-5)

    _onRunAlgorithm() {
        const mission = MISSIONS[this.missionIndex];

        switch (mission.algorithm) { // Internal logic for which algo to run.
            case 'BFS_DFS': return this._runBFSDFS();
            case 'DIJKSTRA': return this._runDijkstra();
            case 'MST': return this._runMST();
            case 'FORD_FULKERSON': return this._runFordFulkerson();
            case 'ALL': return this._runFinalMission();
        }
    }

    _runBFSDFS() {
        this.ui.showTraversalSelect((type) => {
            const order = type === 'BFS' ? this.graph.bfs(100) : this.graph.dfs(100);

            const runBtn = document.getElementById('run-algo-btn');
            if (runBtn) {
                runBtn.classList.add('hidden'); // hide while animating
            }

            this.renderer.animateTraversal(order, 500, () => {
                this._completeMission();
            });

            this.ui.showAlgoResult(
                `Recorrido de Red (${type})`,
                `Orden de transmisión: ${order.join(' → ')}`
            );
        });
    }

    _runDijkstra() {
        const result = this.graph.dijkstra(this.graph.sinkId, this.graph.sourceId);
        if (!result || result.path.length === 0) {
            this.ui.showAlgoResult('Dijkstra', 'No se encontró ruta.');
            return;
        }

        this.renderer.animatePath(result.path, 400, () => {
            this._completeMission();
        });

        this.ui.showAlgoResult(
            'Ruta Segura (Dijkstra)',
            `Camino: ${result.path.join(' → ')}<br>Costo total: ${result.cost}`
        );
    }

    _runMST() {
        const mstEdges = this.graph.prim();

        this.renderer.animateMST(mstEdges, 400, () => {
            this._completeMission();
        });

        const totalCost = mstEdges.reduce((sum, e) => {
            const fromNode = this.graph.getNode(e.from);
            const toNode = this.graph.getNode(e.to);
            if (fromNode && toNode && fromNode.isClean && toNode.isClean) {
                return sum + e.weight;
            }
            return sum;
        }, 0);

        this.ui.showAlgoResult(
            'Red Reconstruida (Prim)',
            `Conexiones de confianza restauradas: ${mstEdges.length}<br>Costo de Confianza (100+): ${totalCost}`
        );
    }

    _runFordFulkerson() {
        const nodesList = this.graph.getAllNodes();
        this.ui.showFlowSelect(nodesList, (srcId, snkId) => {
            const { maxFlow, flowEdges } = this.graph.fordFulkerson(srcId, snkId);

            this.renderer.animateFlow(flowEdges, 400, () => {
                this._completeMission();
            });

            this.ui.showAlgoResult(
                'Control de Flujo (Ford-Fulkerson)',
                `Origen de ataque (ID: ${srcId}) → Víctima (ID: ${snkId})<br>Flujo máximo bloqueado: ${maxFlow} unidades`
            );
        });
    }

    _runFinalMission() {            // Replay all algorithms in sequence with sequential animations
        const bfsOrder = this.graph.bfs(this.graph.sourceId);

        this.renderer.animateTraversal(bfsOrder, 250, () => {
            const dijkResult = this.graph.dijkstra(this.graph.sinkId, this.graph.sourceId);
            if (dijkResult) {
                this.renderer.animatePath(dijkResult.path, 250, () => {
                    const mstEdges = this.graph.prim();
                    this.renderer.animateMST(mstEdges, 250, () => {
                        const { maxFlow, flowEdges } = this.graph.fordFulkerson(this.graph.sourceId, this.graph.sinkId);
                        this.renderer.animateFlow(flowEdges, 250, () => {
                            this.ui.showAlgoResult(
                                '¡Red Restaurada!',
                                `BFS completado · Ruta segura encontrada · Red reconstruida · Flujo máximo: ${maxFlow}`
                            );
                            this._completeMission();
                        });
                    });
                });
            }
        });
    }

    // ─────────────────────────────────────────
    // MISSION COMPLETION

    _checkMission1Complete() { // (for mission 1)
        const allNodes = this.graph.getAllNodes();
        const allClassified = allNodes.every(n => n.classified);
        if (allClassified) {
            const runBtn = document.getElementById('run-algo-btn');
            if (runBtn) {
                runBtn.textContent = 'Recorrer Expediente (BFS/DFS)';
                runBtn.classList.remove('hidden');
            }
            this.ui.setDialogText('¡Todos los nodos analizados! Haz clic en "Recorrer Expediente (BFS/DFS)" para procesar el expediente AVL.');
        }
    }

    _completeMission() { // for all other missions
        this.completedMissions.add(this.missionIndex);
        this._updateMissionTracker();
        this._addScore(500);

        const nextIndex = this.missionIndex + 1;
        const hasNext = nextIndex < MISSIONS.length;

        const nextLabel = hasNext
            ? `Continuar → ${MISSIONS[nextIndex].title}`
            : 'Ver Reporte Final';

        this.ui.showModal(
            '✓ Misión Completada',
            `<p style="margin-bottom:20px;">Has completado <strong>${MISSIONS[this.missionIndex].title}</strong>.</p>
             <p style="color:var(--primary-neon); font-size:1.1rem;">+500 karma</p>`,
            () => {
                this.sound.playMenuClose();
                if (hasNext) {
                    this.transition(this._missionStateKey(nextIndex));
                } else {
                    this.transition('FINAL_REPORT');
                }
            }
        );

        if (this.ui.closeModalBtn) {            // Update continue button text before modal closes
            this.ui.closeModalBtn.textContent = nextLabel;
        }
    }

    _handleFinalReport() {
        this.ui.showFinalReport(this.tree);
    }

    // ─────────────────────────────────────────
    // MISSION TRACKER SIDEBAR

    _toggleMissionTracker() {
        const sidebar = document.getElementById('mission-tracker-sidebar');
        if (!sidebar) return;
        sidebar.classList.toggle('open');
    }

    _flashMissionTracker() {
        const sidebar = document.getElementById('mission-tracker-sidebar');
        if (!sidebar) return;
        sidebar.classList.add('open');
        setTimeout(() => {
            if (!sidebar.matches(':hover')) sidebar.classList.remove('open');
        }, 3000); // close after 3 seconds if player doesn't interact
    }

    _updateMissionTracker() { // for the sidebar tracker / transition
        const list = document.getElementById('mission-checklist');
        if (!list) return;

        list.innerHTML = '';
        MISSIONS.forEach((mission, index) => {
            const li = document.createElement('li');
            li.className = 'mission-item';

            const isCompleted = this.completedMissions.has(index);
            const isCurrent = this.missionIndex === index;
            const isLocked = index > this.missionIndex && !isCompleted;

            li.classList.toggle('completed', isCompleted);
            li.classList.toggle('current', isCurrent && !isCompleted);
            li.classList.toggle('locked', isLocked);

            const checkbox = document.createElement('span'); // square checkbox ui
            checkbox.className = 'mission-checkbox';
            checkbox.textContent = isCompleted ? '✓' : '';

            const label = document.createElement('span');    // Mission label
            label.className = 'mission-label';
            label.textContent = mission.title;

            li.appendChild(checkbox);
            li.appendChild(label);
            list.appendChild(li);

            if (isCurrent && !isCompleted) {                // dialog hint
                this.ui.setDialogText(mission.objective);
            }
        });
    }

    // ─────────────────────────────────────────
    // HELPER FUNCTIONS

    _addScore(delta) {
        this.score = Math.max(0, this.score + delta);
        this.ui.updateScore(this.score);
    }

    _missionStateKey(index) {
        const keys = ['MISSION_1', 'MISSION_2', 'MISSION_3', 'MISSION_4', 'MISSION_FINAL'];
        return keys[index] || 'FINAL_REPORT';
    }

    _algoButtonLabel(algorithm) {
        const labels = {
            DIJKSTRA: 'Encontrar Ruta Segura',
            MST: 'Reconstruir Red',
            FORD_FULKERSON: 'Controlar Flujo',
            ALL: 'Restaurar Red Completa'
        };
        return labels[algorithm] || 'Ejecutar Algoritmo';
    }
}