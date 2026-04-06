/**
 * main.js
 * Optimized game logic engine for CyberDetective Lab.
 * Now includes interactive classification and evidence viewing.
 */

document.addEventListener('DOMContentLoaded', () => {
    const gameState = new GameState();
    gameState.tree = new AVLTree();
    const visualTree = new VisualTree('tree-canvas');

    // DOM Elements
    const levelIndicator = document.getElementById('level-indicator');
    const scoreDisplay = document.getElementById('score-display');
    const scenarioText = document.getElementById('scenario-text');
    const evidenceList = document.getElementById('evidence-list');
    const lawText = document.getElementById('law-text');
    const dialogText = document.getElementById('dialog-text');
    const nextActionBtn = document.getElementById('next-action-btn');
    const classificationOptions = document.getElementById('classification-options');
    const helpBtn = document.getElementById('help-btn');
    
    // Modals
    const modalContainer = document.getElementById('modal-container');
    const modalTitle = document.getElementById('modal-title');
    const modalBodyContent = document.getElementById('modal-body-content');
    const closeModal = document.getElementById('close-modal');
    
    // Evidence Viewer
    const evidenceViewer = document.getElementById('evidence-viewer');
    const viewerImg = document.getElementById('viewer-img');
    const viewerCaption = document.getElementById('viewer-caption');
    const closeViewer = document.getElementById('close-viewer');

    function updateUI() {
        const currentLevel = gameState.getCurrentLevel();
        levelIndicator.textContent = `CASO ACTUAL: ${currentLevel.title}`;
        scoreDisplay.textContent = `Karma: ${gameState.score}`;
        scenarioText.textContent = currentLevel.situation;
        
        if (gameState.currentStatus === 'INVESTIGATING') {
            lawText.textContent = "Analizando evidencias...";
            classificationOptions.classList.add('hidden');
            nextActionBtn.classList.remove('hidden');
            nextActionBtn.textContent = "Recolectar Evidencia";
        } else if (gameState.currentStatus === 'CLASSIFYING') {
            lawText.textContent = "¿Qué delito se está cometiendo? Selecciona una opción.";
            nextActionBtn.classList.add('hidden');
            showClassificationButtons();
        }

        // Update evidence tags
        evidenceList.innerHTML = '';
        gameState.collectedEvidence.forEach((evidence, index) => {
            const li = document.createElement('li');
            li.className = 'evidence-tag';
            li.textContent = evidence;
            li.onclick = () => openEvidenceViewer(evidence, currentLevel.image);
            evidenceList.appendChild(li);
        });

        visualTree.draw(gameState.tree);
    }

    function showClassificationButtons() {
        const currentLevel = gameState.getCurrentLevel();
        classificationOptions.innerHTML = '';
        classificationOptions.classList.remove('hidden');

        currentLevel.options.forEach(option => {
            const btn = document.createElement('button');
            btn.className = 'crime-btn';
            btn.textContent = option;
            btn.onclick = () => handleClassification(option);
            classificationOptions.appendChild(btn);
        });
    }

    function handleClassification(selectedCrime) {
        const currentLevel = gameState.getCurrentLevel();
        
        if (selectedCrime === currentLevel.crime) {
            // Correct choice
            gameState.score += 200;
            dialogText.textContent = `¡Correcto! Es un caso de ${currentLevel.crime}. ${currentLevel.feedback}`;
            
            // Insert into AVL Tree
            gameState.tree.insert({
                caseId: currentLevel.caseId,
                type: currentLevel.crime,
                law: currentLevel.law,
                penalty: currentLevel.penalty,
                gravity: currentLevel.gravity,
                evidence: [...currentLevel.evidence],
                description: currentLevel.situation
            });

            gameState.currentStatus = 'FINISHED_LEVEL';
            classificationOptions.classList.add('hidden');
            nextActionBtn.classList.remove('hidden');
            nextActionBtn.textContent = (gameState.currentLevelIndex === LEVELS.length - 1) ? "Generar Reporte Final" : "Siguiente Caso";
            
            updateUI();
        } else {
            // Wrong choice
            gameState.score -= 50;
            dialogText.textContent = `No exactamente. Alex dice: "Mira bien las evidencias. ${currentLevel.feedback.split('.')[0]}."`;
            updateUI();
        }
    }

    function triggerNextAction() {
        if (gameState.currentStatus === 'FINISHED_LEVEL') {
            if (!gameState.nextLevel()) {
                showFinalReport();
            } else {
                dialogText.textContent = "Nuevo caso detectado. Valeria necesita tu ayuda.";
                updateUI();
            }
            return;
        }

        const currentLevel = gameState.getCurrentLevel();
        
        if (gameState.currentStatus === 'INVESTIGATING') {
            currentLevel.evidence.forEach(ev => gameState.addEvidence(ev));
            dialogText.textContent = "Evidencias recolectadas. Ahora analízalas en la barra lateral y clasifica el delito.";
            gameState.currentStatus = 'CLASSIFYING';
            updateUI();
        }
    }

    function openEvidenceViewer(name, imageName) {
        viewerImg.src = `assets/${imageName}`;
        viewerCaption.textContent = `Evidencia: ${name}`;
        evidenceViewer.classList.remove('hidden');
    }

    function showFinalReport() {
        const inOrderCases = gameState.tree.getInOrder();
        modalTitle.textContent = "REPORTE FINAL DE INVESTIGACIÓN";
        
        let reportHTML = `<p>Has reconstruido el árbol de la verdad con un puntaje de <strong>${gameState.score} puntos de Karma</strong>.</p>
                          <hr style="margin: 15px 0; border-color: var(--primary-neon);">`;
        
        inOrderCases.forEach(node => {
            reportHTML += `<div style="margin-bottom: 20px; border-bottom: 1px solid #333; padding-bottom: 10px;">
                                <strong style="color:var(--primary-neon)">${node.type} (Severidad: ${node.gravity}/10)</strong><br>
                                <span>Ley: ${node.law}</span><br>
                                <span style="color: var(--accent-red)">Consecuencia: ${node.penalty}</span>
                           </div>`;
        });
        
        modalBodyContent.innerHTML = reportHTML;
        modalContainer.classList.remove('hidden');
    }

    // Event Listeners
    nextActionBtn.addEventListener('click', triggerNextAction);
    closeModal.addEventListener('click', () => modalContainer.classList.add('hidden'));
    closeViewer.addEventListener('click', () => evidenceViewer.classList.add('hidden'));
    
    helpBtn.addEventListener('click', () => {
        modalTitle.textContent = "Manual del CyberDetective";
        modalBodyContent.innerHTML = `
            <p>1. <strong>Investigar:</strong> Recolecta las pruebas digitales.</p>
            <p>2. <strong>Analizar:</strong> Haz clic en las etiquetas de la izquierda para ver las capturas de pantalla.</p>
            <p>3. <strong>Clasificar:</strong> Elige el delito correcto según la ley colombiana.</p>
            <p>4. <strong>Árbol AVL:</strong> Cada acierto construye un árbol que se auto-balancea para optimizar la base de datos de la fiscalía.</p>
        `;
        modalContainer.classList.remove('hidden');
    });

    updateUI();
});
