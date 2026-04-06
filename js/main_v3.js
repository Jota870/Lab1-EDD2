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
        // NIVEL 2: Custom Social Post for Valeria (Relationship rumor)
        if (level.id === 2) {
            viewerImg.classList.add('hidden');
            dynamicPost.classList.remove('hidden');
            dynamicPost.innerHTML = `
                <div class="post-header">
                    <div style="width:40px; height:40px; background: linear-gradient(135deg, #00f2ff, #7000ff); border-radius:50%; display:flex; justify-content:center; align-items:center; font-weight:bold; color:white; font-size:1.2rem;">B</div>
                    <div>
                        <div class="post-user">@Chismes_Baq_2026</div>
                        <div style="font-size:0.7rem; color:#666;">hace 10 minutos • Barranquilla</div>
                    </div>
                </div>
                <div class="post-content">
                    "¡ESCÁNDALO EN EL COLEGIO! Dicen que <strong>Valeria</strong> tiene algo con el profesor de matemáticas para que le pase la materia. ¿Ustedes qué creen? 😱🔥"
                </div>
                <div style="width:100%; height:300px; background:rgba(0,0,0,0.4); border-radius:12px; display:flex; flex-direction:column; justify-content:center; align-items:center; border: 1px solid #334155; position:relative; overflow:hidden;">
                    <div style="width:120px; height:120px; background:url('assets/valeria_oficial.png') no-repeat center top; background-size: 200%; border-radius:50%; border: 4px solid var(--primary-neon);"></div>
                    <div style="margin-top:15px; color:var(--text-main); font-weight:bold; font-size:1.1rem;">Valeria_Oficial</div>
                    <div style="color:var(--text-dim); font-size:0.8rem;">Estudiante • NetCity High</div>
                    <div class="falso-stamp">FALSO</div>
                </div>
                <div style="margin-top:10px; font-size:0.8rem; color:#888;">❤️ 2,840 likes • 💬 142 comentarios</div>
            `;
            viewerCaption.textContent = `Evidencia: Post de Calumnia (@Chismes_Baq)`;
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
    
    helpBtn.addEventListener('click', () => {
        modalTitle.textContent = "CÓDIGO DIGITAL: MANUAL DEL DETECTIVE";
        modalBodyContent.innerHTML = `
            <div style="text-align: left; font-size: 0.8rem; line-height: 1.4; max-height: 450px; overflow-y: auto; padding-right: 10px;">
                <p><strong>1. Injuria (Art. 220):</strong> Imputaciones deshonrosas que afectan el buen nombre.</p>
                <p><strong>2. Calumnia (Art. 221):</strong> Imputación falsa de una conducta que constituye un delito.</p>
                <p><strong>3. Suplantación de Identidad:</strong> Hacerse pasar por otro para causar daño o beneficio ilícito.</p>
                <p><strong>4. Hostigamiento Digital:</strong> Conducta sistemática de acoso, intimidación o asedio mediante tecnologías.</p>
                <p><strong>5. Amenaza (Art. 347):</strong> Acto de intimidar a alguien con el anuncio de un mal futuro, grave y posible.</p>
                <p><strong>6. Hurto de Datos:</strong> Apoderarse de información digital ajena para beneficio personal.</p>
                <p><strong>7. Estafa Digital:</strong> Engañar a alguien para obtener un provecho económico ilícito.</p>
                <p><strong>8. Acoso Colectivo (Mobbing):</strong> Ataque coordinado de varias personas para degradar a un individuo.</p>
                <p><strong>9. Falso Testimonio:</strong> Declarar algo falso bajo gravedad de juramento.</p>
                <p><strong>10. Difamación:</strong> Acción de desacreditar a alguien, de palabra o por escrito, publicando cosas contra su buena opinión y fama.</p>
                <p><strong>11. Acceso Abusivo (Art. 269A):</strong> Acceder a un sistema informático sin autorización.</p>
                <p><strong>12. Fraude Académico:</strong> Alteración o uso de información falsa para obtener mérito escolar.</p>
                <p><strong>13. Intimidación:</strong> Insuflar miedo de forma constante a través de cualquier medio digital.</p>
                <hr style="border-color: #444; margin: 10px 0;">
                <p style="color: var(--primary-neon); text-align: center; font-size: 0.7rem;"><em>INVESTIGACIÓN: Compara la definición técnica con las pruebas recolectadas.</em></p>
            </div>
        `;
        modalContainer.classList.remove('hidden');
    });

    updateUI();
});
