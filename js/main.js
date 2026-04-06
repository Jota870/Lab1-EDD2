/**
 * main.js
 * CyberDetective Lab - Optimized logic for dynamic evidence and AVL tree.
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
            lawText.textContent = "Estado: Analizando evidencias de Valeria.";
            classificationOptions.classList.add('hidden');
            nextActionBtn.classList.remove('hidden');
            nextActionBtn.textContent = "Recolectar Evidencia Digital";
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
            dialogText.textContent = `¡Correcto! Es un delito de ${currentLevel.crime}. Requisitos del nodo cumplidos.`;
            
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
            nextActionBtn.textContent = (gameState.currentLevelIndex === LEVELS.length - 1) ? "Generar Reporte Final" : "Siguiente Caso";
            
            updateUI();
        } else {
            gameState.score -= 50;
            dialogText.textContent = `Error de ley. Pista: ${currentLevel.feedback}`;
            updateUI();
        }
    }

    function triggerNextAction() {
        if (gameState.currentStatus === 'FINISHED_LEVEL') {
            if (!gameState.nextLevel()) {
                showFinalReport();
            } else {
                dialogText.textContent = "El sistema de Alex detectó una nueva amenaza contra Valeria.";
                updateUI();
            }
            return;
        }

        const currentLevel = gameState.getCurrentLevel();
        if (gameState.currentStatus === 'INVESTIGATING') {
            currentLevel.evidence.forEach(ev => gameState.addEvidence(ev));
            dialogText.textContent = "Evidencias listas. Toca las etiquetas para inspeccionarlas antes de dar tu veredicto legal.";
            gameState.currentStatus = 'CLASSIFYING';
            updateUI();
        }
    }

    function openEvidenceViewer(name, level) {
        // NIVEL 2: Custom Social Post for Valeria (replacing Drone News)
        if (level.id === 2) {
            viewerImg.classList.add('hidden');
            dynamicPost.classList.remove('hidden');
            dynamicPost.innerHTML = `
                <div class="post-header">
                    <div class="post-user">@Anonimo_Escolar</div>
                    <div>• hace 2 horas</div>
                </div>
                <div class="post-content">
                    "¿Ya vieron lo que anda diciendo de Valeria? Dicen que se robó los exámenes de la oficina. ¡Qué vergüenza! 🙄 #NetCityHigh #Expuesta"
                </div>
                <img src="assets/viral_rumor_post.png" class="social-img">
                <div class="falso-stamp">FALSO</div>
            `;
            viewerCaption.textContent = `Analizando Rumor Viral: ${name}`;
        } else {
            dynamicPost.classList.add('hidden');
            viewerImg.classList.remove('hidden');
            viewerImg.onerror = () => {
                viewerImg.src = "https://via.placeholder.com/600x400/0a0c10/00f2ff?text=ARCHIVO+EVIDENCIA";
            };
            viewerImg.src = `assets/${level.image}`;
            viewerCaption.textContent = `Analizando: ${name}`;
        }
        evidenceViewer.classList.remove('hidden');
    }

    function showFinalReport() {
        const inOrderNodes = gameState.tree.getInOrder();
        modalTitle.textContent = "REPORTE TÉCNICO DE INVESTIGACIÓN (Árbol AVL)";
        
        let reportHTML = `<p>Casos organizados en el árbol por <strong>Gravedad del Delito</strong>.</p>
                          <hr style="margin: 15px 0; border-color: var(--primary-neon);">`;
        
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
    
    helpBtn.addEventListener('click', () => {
        modalTitle.textContent = "Reglas del Detective Digital";
        modalBodyContent.innerHTML = `
            <p>1. <strong>Investigar:</strong> Hazte con las evidencias del nivel.</p>
            <p>2. <strong>Inspeccionar:</strong> Haz clic en la evidencia para verla de cerca.</p>
            <p>3. <strong>Veredicto:</strong> Elige el tipo de delito basado en la ley colombiana.</p>
            <p>4. <strong>Árbol de Casos:</strong> Cada acierto inserta un nodo equilibrado (AVL) con toda la información técnica.</p>
        `;
        modalContainer.classList.remove('hidden');
    });

    updateUI();
});
