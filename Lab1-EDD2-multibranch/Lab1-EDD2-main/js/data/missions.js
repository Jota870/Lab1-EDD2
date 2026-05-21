// missions.js
// Based upon the old levels config and part of Tree Structure
// HAS: + difficulty config, + crime definitions, + node generation, +graph generation - EJ

// ─────────────────────────────────────────────
// DIFFICULTY CONFIG (difficulty / num_nodes / num_bad_nodes)

const DIFFICULTIES = {
    EASY: { label: "Fácil", totalNodes: 12, badNodes: 4 },
    MEDIUM: { label: "Medio", totalNodes: 16, badNodes: 7 },
    HARD: { label: "Difícil", totalNodes: 20, badNodes: 9 }
};

// ─────────────────────────────────────────────
// MISSION CONFIG (Pulled from Laboratorio2.pdf, ensures the game state which mission will happen and works as a dictionary.)

const MISSIONS = [

    {
        id: "MISSION_1",
        title: "Misión 1 - Rastros del Acoso",
        algorithm: "BFS_DFS",
        objective: "Recorre la red e identifica a todos los actores maliciosos usando BFS o DFS.",
        instructions: "Elige BFS para explorar por niveles o DFS para seguir cadenas profundas. Haz clic en cada nodo para analizarlo."
    },
    {
        id: "MISSION_2",
        title: "Misión 2 - Ruta Segura",
        algorithm: "DIJKSTRA",
        objective: "Encuentra el camino de menor riesgo desde el nodo de apoyo hasta la víctima.",
        instructions: "El sistema calculará la ruta óptima. Observa cómo Dijkstra selecciona el camino más seguro."
    },
    {
        id: "MISSION_3",
        title: "Misión 3 - Reconstruir la Red",
        algorithm: "MST",
        objective: "Reconstruye las conexiones positivas entre usuarios con el menor costo posible.",
        instructions: "Aplica Prim para generar el Árbol de Expansión Mínima y restaurar la red de confianza."
    },
    {
        id: "MISSION_4",
        title: "Misión 4 - Control del Impacto",
        algorithm: "FORD_FULKERSON",
        objective: "Controla la cantidad de contenido dañino que fluye a través de la red.",
        instructions: "El algoritmo calculará el flujo máximo desde la fuente del acoso hasta la víctima."
    },
    {
        id: "MISSION_FINAL",
        title: "Misión Final - Red Segura",
        algorithm: "ALL",
        objective: "Restaura completamente la red aplicando todo lo aprendido.",
        instructions: "Revisión completa: origen, intervención, reconstrucción y control."
    }
];

// ─────────────────────────────────────────────
// CRIME TYPES (This is directly pulled from index.html, which had the internal logic written there, so it's been pulled out to add differnt types from now on.)
// idBase is already set to it's default so that when doing the algorithms of the next missions, it'll be easier to sort through.

const CRIME_TYPES = {
    INJURIA: {
        key: "INJURIA",
        label: "Injuria",
        idBase: 200,
        gravity: 3,
        law: "Art. 220 Código Penal Colombiano",
        penalty: "Multa de 1 a 3 SMLMV.",
        color: "#ffaa00",
        evidence: ["Captura de pantalla ofensiva", "Historial de mensajes", "ID de usuario"],
        narratives: [
            "{name} ({age} años) ha enviado mensajes ofensivos que dañan directamente el honor de la víctima. Los mensajes contienen insultos reiterados publicados en el grupo del colegio.",
            "{name} ({age} años) dejó comentarios humillantes en publicaciones públicas, afectando gravemente el buen nombre de otra persona.",
            "{name} ({age} años) publicó contenido deshonroso dirigido personalmente a la víctima, repitiendo las ofensas durante varios días."
        ],
        distractors: ["Calumnia", "Amenaza", "Acoso", "Hostigamiento", "Daño a la honra"]
    },

    CALUMNIA: {
        key: "CALUMNIA",
        label: "Calumnia",
        idBase: 300,
        gravity: 5,
        law: "Art. 221 Código Penal Colombiano",
        penalty: "Multa de 2 a 5 SMLMV.",
        color: "#ff6600",
        evidence: ["Post viral con afirmación falsa", "Registro de difusión", "Historial de cuenta"],
        narratives: [
            "{name} ({age} años) difundió información completamente falsa sobre la víctima, atribuyéndole una conducta delictiva que nunca ocurrió. El post se volvió viral en el grupo del curso.",
            "{name} ({age} años) creó y compartió una historia falsa que imputa a la víctima un delito inexistente, causando daño masivo a su reputación.",
            "{name} ({age} años) publicó capturas editadas para hacer parecer que la víctima cometió un acto ilegal, cuando en realidad son completamente falsas."
        ],
        distractors: ["Injuria", "Difamación", "Falso Testimonio", "Fraude Académico", "Acceso Abusivo"]
    },

    SUPLANTACION: {
        key: "SUPLANTACION",
        label: "Suplantación",
        idBase: 400,
        gravity: 7,
        law: "Ley 1273 de 2009 – Art. 269F",
        penalty: "Prisión de 3 a 8 años.",
        color: "#cc00ff",
        evidence: ["Perfil falso identificado", "Dirección IP rastreada", "Foto suplantada"],
        narratives: [
            "{name} ({age} años) creó un perfil falso usando fotografías e información personal de la víctima para publicar contenido ofensivo y dañar su imagen.",
            "{name} ({age} años) se hizo pasar por la víctima en múltiples plataformas para mandar mensajes agresivos a conocidos de la persona.",
            "{name} ({age} años) utilizó los datos reales de la víctima para crear cuentas falsas desde las que distribuye contenido comprometedor."
        ],
        distractors: ["Hurto de Datos", "Estafa", "Acceso Abusivo", "Falsedad en documento", "Calumnia"]
    },

    HOSTIGAMIENTO: {
        key: "HOSTIGAMIENTO",
        label: "Hostigamiento",
        idBase: 500,
        gravity: 9,
        law: "Ley 1482 de 2011 – Art. 134B",
        penalty: "Prisión de 1 a 3 años.",
        color: "#ff3c3c",
        evidence: ["Log de ataques coordinados", "Patrón de red identificado", "ID del instigador"],
        narratives: [
            "{name} ({age} años) organizó un ataque coordinado desde múltiples cuentas hacia la víctima, enviando mensajes de odio de forma sistemática y reiterada.",
            "{name} ({age} años) ha acosado a la víctima de forma persistente durante semanas, usando diferentes cuentas para evitar ser bloqueado.",
            "{name} ({age} años) lidera un grupo que acosa colectivamente a la víctima con comentarios degradantes en todas sus publicaciones públicas."
        ],
        distractors: ["Amenazas", "Acoso Colectivo", "Ciberbullying", "Intimidación", "Extorsión"]
    }
};

// CLEAN_NODE: means any user that won't have any keys or abuse cases.
const CLEAN_NODE = {
    key: "CLEAN",
    label: "Sin actividad sospechosa",
    idBase: 100,
    gravity: 1,
    color: "#00f2ff",
    narratives: [
        "{name} ({age} años) no presenta actividad sospechosa en la red. Sus interacciones son positivas y no hay indicios de participación en el acoso.",
        "{name} ({age} años) aparece en la red como contacto de la víctima, pero el análisis no revela conducta maliciosa.",
        "{name} ({age} años) tiene interacciones normales. No hay evidencia que lo vincule al acoso."
    ]
};

// ─────────────────────────────────────────────
// NAMES_DICT: dictionary for the purpose of randomizing node info, same as the age range.

const NAMES_DICT = [
    "Valentina", "Sebastián", "Camila", "Santiago", "Isabella",
    "Mateo", "Salomé", "Samuel", "Gabriela", "Alejandro",
    "Mariana", "Daniel", "Luisa", "Juan", "Sofía", "Julio",
    "Andrés", "Paula", "Diego", "Natalia", "Tomás",
    "Sara", "Miguel", "Laura", "Nicolás", "Daniela",
    "Felipe", "Ana", "Simón", "Valeria", "Julián"
];

const AGE_RANGE = { min: 14, max: 19 };

// ─────────────────────────────────────────────
// NODE GENERATION (for creating the binary search tree, it will pull out the array from the difficulties tab and start generating it randomly.)

function _randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)]; // Picks a random value from the array.
}

function _randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min; // Picks a random integer between min and max inclusive.
}

function _buildNarrative(template, name, age) {
    return template.replace("{name}", name).replace("{age}", age); // Fills in {name} and {age} placeholders in a narrative string.
}

function generateNode(crimeKey, sequenceIndex, usedNames = []) {
    const crimeConfig = crimeKey ? CRIME_TYPES[crimeKey] : CLEAN_NODE;

    // Picks a unique name from the dictionary, and checks that it isn't already used twice through a used names list, and grabs the rest of values to use.
    let name;
    if (crimeKey === null && sequenceIndex === 0) {
        name = "Valeria";
    } else {
        const availableNames = NAMES_DICT.filter(n => !usedNames.includes(n) && n !== "Valeria");
        name = availableNames.length > 0 ? _randomFrom(availableNames) : `Usuario${sequenceIndex}`;
    }
    const age = _randomInt(AGE_RANGE.min, AGE_RANGE.max);
    const narrative = _buildNarrative(_randomFrom(crimeConfig.narratives), name, age);

    return {
        id: crimeConfig.idBase + sequenceIndex,               // returns the base code of the hundreds + whatever the amount of node is to create it, eg. 101, 102...
        name,                                                 // returns the name
        age,                                                  // returns the age
        abuseType: crimeKey,                                  // returns null if clean
        crimeConfig: crimeKey ? crimeConfig : null,           // if it's non clean it returns the type of crime
        narrative,                                            // returns the description prompt
        evidence: crimeKey ? [...crimeConfig.evidence] : [],  // returns the photos type of the asset
        gravity: crimeConfig.gravity,                         // coloring purposes
        color: crimeConfig.color,                             // coloring purposes
        classified: false,                                    // toggled to true after correct player answer
        isClean: crimeKey === null,                           // checks if it's clean

        // Canvas position, assigned by GraphGenerator, but initialized
        x: 0,
        y: 0
    };
}

// ─────────────────────────────────────────────
// GRAPH GENERATION

function generateGraph(difficulty) {
    const { totalNodes, badNodes } = difficulty;
    const nodes = [];
    const usedNames = [];
    const idCounters = {}; // Track counters per idBase to keep IDs unique within each hundred

    // Build the crime pool, and then distributes bad nodes across crime types
    const crimeKeys = Object.keys(CRIME_TYPES);
    const crimePool = [];
    for (let i = 0; i < badNodes; i++) {
        crimePool.push(crimeKeys[i % crimeKeys.length]);
    }

    // Shuffle crime pool so they don't always appear in the same order
    crimePool.sort(() => Math.random() - 0.5);

    // Generate bad nodes
    for (let i = 0; i < badNodes; i++) {
        const crimeKey = crimePool[i];
        const base = CRIME_TYPES[crimeKey].idBase;
        if (!idCounters[base]) idCounters[base] = 0;
        const node = generateNode(crimeKey, idCounters[base], usedNames);
        idCounters[base]++;
        usedNames.push(node.name);
        nodes.push(node);
    }

    // Generate clean nodes
    const cleanBase = CLEAN_NODE.idBase;
    idCounters[cleanBase] = 0;
    for (let i = 0; i < totalNodes - badNodes; i++) {
        const node = generateNode(null, idCounters[cleanBase], usedNames);
        idCounters[cleanBase]++;
        usedNames.push(node.name);
        nodes.push(node);
    }

    nodes.sort(() => Math.random() - 0.5); // Re-shuffle nodes so bad actors aren't always grouped together visually

    const maxId = Math.max(...nodes.map(n => n.id));

    // ── EDGE GENERATION (semi-random) ──
    // Rules:
    // 1. Guarantee full connectivity via a spanning tree first
    // 2. Add random extra edges for density
    // 3. Source = highest gravity bad node, Sink = lowest gravity clean node
    // 4. Guarantee at least one path from source to sink
    // * Disallows direct connection between node 100 (Valeria) and the highest ID node

    const edges = [];
    const edgeSet = new Set(); // prevents duplicate edges

    function edgeKey(a, b) {
        return a < b ? `${a}-${b}` : `${b}-${a}`;
    }

    function addEdge(nodeA, nodeB) {
        // Disallow direct connection between node 100 (Valeria) and the highest ID node
        if ((nodeA.id === 100 && nodeB.id === maxId) || (nodeB.id === 100 && nodeA.id === maxId)) {
            return;
        }

        const key = edgeKey(nodeA.id, nodeB.id);
        if (!edgeSet.has(key) && nodeA.id !== nodeB.id) {
            edgeSet.add(key);
            // Weight = sum of both node IDs
            const weight = nodeA.id + nodeB.id;
            // Capacity = gravity of the higher-risk node * 10 (for Ford-Fulkerson)
            const capacity = Math.max(nodeA.gravity, nodeB.gravity) * 10;
            edges.push({ from: nodeA.id, to: nodeB.id, weight, capacity });
        }
    }

    // Step 1: Spanning tree — guarantees connectivity
    const shuffledForTree = [...nodes].sort(() => Math.random() - 0.5);
    for (let i = 1; i < shuffledForTree.length; i++) {
        const u = shuffledForTree[i - 1];
        const v = shuffledForTree[i];
        if ((u.id === 100 && v.id === maxId) || (v.id === 100 && u.id === maxId)) {
            // Swap v with the next node in the list if available to avoid direct adjacency
            if (i + 1 < shuffledForTree.length) {
                const temp = shuffledForTree[i];
                shuffledForTree[i] = shuffledForTree[i + 1];
                shuffledForTree[i + 1] = temp;
            }
        }
        addEdge(shuffledForTree[i - 1], shuffledForTree[i]);
    }

    // Step 2: Extra random edges for density (rich alternative routes, approx 95% of node count)
    const extraEdges = Math.floor(totalNodes * 0.95);
    for (let i = 0; i < extraEdges; i++) {
        const a = nodes[_randomInt(0, nodes.length - 1)];
        const b = nodes[_randomInt(0, nodes.length - 1)];
        addEdge(a, b);
    }

    // Step 3: Identify source and sink
    const badActors = nodes.filter(n => !n.isClean);
    const cleanActors = nodes.filter(n => n.isClean);

    // Source = highest gravity bad actor (origin of harassment)
    const sourceNode = badActors.length > 0
        ? badActors.reduce((max, n) => n.gravity > max.gravity ? n : max, badActors[0])
        : nodes[0];

    // Sink = always Valeria (ID 100) — the victim and origin point of the cyber-investigation!
    const sinkNode = nodes.find(n => n.id === 100) || nodes[nodes.length - 1];

    // Step 4: Guarantee source → sink path exists without violating the maximum ID constraint
    if ((sourceNode.id === 100 && sinkNode.id === maxId) || (sourceNode.id === maxId && sinkNode.id === 100)) {
        // Find an intermediate node that is neither 100 nor maxId
        const interNode = nodes.find(n => n.id !== 100 && n.id !== maxId);
        if (interNode) {
            addEdge(sourceNode, interNode);
            addEdge(interNode, sinkNode);
        } else {
            addEdge(sourceNode, sinkNode);
        }
    } else {
        addEdge(sourceNode, sinkNode);
    }

    return {
        nodes,
        edges,
        sourceId: sourceNode.id,
        sinkId: sinkNode.id
    };
}

// ─────────────────────────────────────────────
// CLASSIFICATION HELPERS
// Used by GameController when a node is clicked and the node requires data changes

// Returns shuffled answer options for a given node, which always includes the correct answer + 4 random distractors from the crime type.
// For clean nodes returns an empty array (no classification needed).

function getClassificationOptions(node) {
    if (node.isClean || !node.crimeConfig) return [];

    const correct = node.crimeConfig.label;
    const distractors = [...node.crimeConfig.distractors]
        .sort(() => Math.random() - 0.5)
        .slice(0, 4);

    return [correct, ...distractors].sort(() => Math.random() - 0.5);
}

// Checks if the player's answer is correct. Returns true/false.
function checkClassification(node, selectedLabel) {
    if (node.isClean) return false;
    return selectedLabel === node.crimeConfig.label;
}

// Returns the score delta for a classification attempt. Correct: +200, Wrong: -50
const SCORE = {
    CORRECT: 200,
    WRONG: -50,
    CLEAN_NODE_VISITED: 10   // small reward for clicking and confirming a clean node
};