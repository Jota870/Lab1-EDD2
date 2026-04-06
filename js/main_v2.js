/**
 * main.js - v1.4 Final (Drone Removal & Cache Busting)
 * CyberDetective - Case: Valeria
 */

document.addEventListener('DOMContentLoaded', () => {
    const gameState = new GameState();
    gameState.tree = new AVLTree();
    const visualTree = new VisualTree('tree-canvas');

    const levelIndicator = document.getElementById('level-indicator');
    const scoreDisplay = document.getElementById('score-display');
    const scenarioText = document.getElementById('scenario-text');
    const evidenceList = document.getElementById('evidence-list');
    const lawText = document.getElementById('law-text');
    const dialogText = document.getElementById('dialog-text');
    const nextActionBtn = document.getElementById('next-action-btn');
    const classificationOptions = document.getElementById('classification-options');
    const helpBtn = document.getElementById('help-btn');
    const modalContainer = document.getElementById('modal-container');
    const modalTitle = document.getElementById('modal-title');
    const modalBodyContent = document.getElementById('modal-body-content');
    const closeModal = document.getElementById('close-modal');
    const evidenceViewer = document.getElementById('evidence-viewer');
    const viewerImg = document.getElementById('viewer-img');
    const viewerCaption = document.getElementById('viewer-caption');
    const closeViewer = document.getElementById('close-viewer');
    const dynamicPost = document.getElementById('dynamic-post');

    function updateUI() {
        const currentLevel = gameState.getCurrentLevel();
        levelIndicator.textContent = `NIVEL ${currentLevel.id}: ${currentLevel.title}`;
        scoreDisplay.textContent = `Karma: ${gameState.score}`;
        scenarioText.textContent = currentLevel.situation;
        
        if (gameState.currentStatus === 'INVESTIGATING') {
            lawText.textContent = "Analizando evidencias digitales de Valeria.";
            classificationOptions.classList.add('hidden');
            nextActionBtn.classList.remove('hidden');
            nextActionBtn.textContent = "Examinar Evidencia";
        } else if (gameState.currentStatus === 'CLASSIFYING') {
            lawText.textContent = "¿Bajo qué ley colombiana clasificamos este delito?";
            nextActionBtn.classList.add('hidden');
            showClassificationButtons();
        }

        evidenceList.innerHTML = '';
        gameState.collectedEvidence.forEach((evidence) => {
            const li = document.createElement('li');
            li.className = 'evidence-tag';
            li.textContent = evidence;
            li.onclick = () => openEvidenceViewer(evidence, currentLevel);
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
            gameState.score += 200;
            dialogText.textContent = `¡Correcto! Es ${currentLevel.crime}. El Árbol AVL se actualiza.`;
            
            gameState.tree.insert({
                caseId: currentLevel.caseId,
                type: currentLevel.crime,
                evidence: [...currentLevel.evidence],
                law: currentLevel.law,
                penalty: currentLevel.penalty,
                gravity: currentLevel.gravity
            });

            gameState.currentStatus = 'FINISHED_LEVEL';
            classificationOptions.classList.add('hidden');
            nextActionBtn.classList.remove('hidden');
            nextActionBtn.textContent = (gameState.currentLevelIndex === LEVELS.length - 1) ? "Reporte Final" : "Siguiente Caso";
            updateUI();
        } else {
            gameState.score -= 50;
            dialogText.textContent = `Error de ley. Pista: ${currentLevel.feedback}`;
            updateUI();
        }
    }

    function triggerNextAction() {
        if (gameState.currentStatus === 'FINISHED_LEVEL') {
            if (!gameState.nextLevel()) showFinalReport();
            else { dialogText.textContent = "Nueva amenaza detectada."; updateUI(); }
            return;
        }

        const currentLevel = gameState.getCurrentLevel();
        if (gameState.currentStatus === 'INVESTIGATING') {
            currentLevel.evidence.forEach(ev => gameState.addEvidence(ev));
            dialogText.textContent = "Evidencias listas. Toca las etiquetas para verlas.";
            gameState.currentStatus = 'CLASSIFYING';
            updateUI();
        }
    }

    function openEvidenceViewer(name, level) {
        // NIVEL 2: RUMOR SOBRE EL PROFESOR (CACHE BUSTED IMAGE)
        if (level.id === 2) {
            viewerImg.classList.add('hidden');
            dynamicPost.classList.remove('hidden');
            dynamicPost.innerHTML = `
                <div class="post-header">
                    <div style="width:40px; height:40px; background:#444; border-radius:50%; display:flex; justify-content:center; align-items:center;">📂</div>
                    <div>
                        <div class="post-user">@Chismes_Escolares_Oficial</div>
                        <div style="font-size:0.7rem; color:#666;">hace 10 minutos</div>
                    </div>
                </div>
                <div class="post-content">
                    "¡ESCÁNDALO! Dicen que <strong>Valeria</strong> tiene algo con el profesor de matemáticas para que le pase la materia. ¿Ustedes qué creen? 😱🔥"
                </div>
                <img src="assets/valeria_oficial.png" class="social-img" style="width:100%; border-radius:8px;">
                <div class="falso-stamp">FALSO</div>
            `;
            viewerCaption.textContent = `Evidencia: Post de Calumnia Viral`;
        } else {
            dynamicPost.classList.add('hidden');
            viewerImg.classList.remove('hidden');
            viewerImg.onerror = () => { viewerImg.src = "https://via.placeholder.com/600x400/0a0c10/00f2ff?text=ARCHIVO"; };
            viewerImg.src = `assets/${level.image}`;
            viewerCaption.textContent = `Analizando: ${name}`;
        }
        evidenceViewer.classList.remove('hidden');
    }

    function showFinalReport() {
        const inOrderNodes = gameState.tree.getInOrder();
        modalTitle.textContent = "REPORTE TÉCNICO DE INVESTIGACIÓN (Árbol AVL)";
        let reportHTML = `<p>Casos organizados en el árbol por <strong>Gravedad del Delito</strong>.</p><hr style="margin: 15px 0; border-color: var(--primary-neon);">`;
        inOrderNodes.forEach(node => {
            reportHTML += `<div style="margin-bottom: 25px; border-bottom: 1px solid #333; padding-bottom: 15px;">
                <p><strong>1. ID del caso:</strong> ${node.caseId}</p>
                <p><strong>2. Tipo de acoso:</strong> ${node.type}</p>
                <p><strong>3. Evidencias:</strong> ${node.evidence.join(", ")}</p>
                <p><strong>4. Ley colombiana:</strong> ${node.law}</p>
                <p style="color:var(--accent-red)"><strong>5. Posible pena:</strong> ${node.penalty}</p>
            </div>`;
        });
        modalBodyContent.innerHTML = reportHTML;
        modalContainer.classList.remove('hidden');
    }

    nextActionBtn.addEventListener('click', triggerNextAction);
    closeModal.addEventListener('click', () => modalContainer.classList.add('hidden'));
    closeViewer.addEventListener('click', () => evidenceViewer.classList.add('hidden'));
    updateUI();
});
