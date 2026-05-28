// GraphRenderer.js
// Based upon the old VisualTree.js
// HAS: anything related to canvas drawing, as it only handles the visual aspects of displaying the graph. - EJ
// FUNCTIONALITIES: Layout of Nodes, Drawing, Animation, Highlight, Input

class GraphRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Node appearance (SHAPE)
        this.NODE_RADIUS = 28;
        this.NODE_FONT = 'bold 11px JetBrains Mono';
        this.LABEL_FONT = '10px JetBrains Mono';

        // Colors (USED FOR RENDERING)
        this.COLOR = {
            edge: 'rgba(0, 242, 255, 0.2)',
            edgeHighlight: '#00f2ff',
            edgeMST: '#00ff88',
            edgeFlow: '#ff6600',
            nodeFill: '#14181e',
            nodeDefault: '#00f2ff99',    // unvisited or unclassified clean
            nodeVisited: '#7000ff',      // visited during traversal
            nodeClassified: null,             // uses node.crimeConfig.color
            nodeClean: '#00f2ff',
            nodeBad: '#ff3c3c',      // revealed bad actor, not yet classified
            pathHighlight: '#ffaa00',
            textMain: '#e0e6ed',
            textDim: '#94a3b8',
            shadow: '#00f2ff'
        };

        this._layoutReady = false;

        // Animation state
        this._animQueue = [];   // list of nodeIds to highlight in sequence
        this._animIndex = 0;
        this._animTimer = null;
        this._animVisited = new Set();
        this._animEdges = new Set();

        // Highlight overlays (creates the arrays that are then sent for each individual node to get animated)
        this._highlightPath = [];          // path of ordered node IDs
        this._highlightMST = [];          // edges such as { from, to }
        this._highlightFlow = [];          // edges such as { from, to }

        this._clickCallback = null;
        this._graph = null;

        // Blackout & Mouse tracking state
        this._blackout = false;
        this._mouseX = this.canvas.width / 2;
        this._mouseY = this.canvas.height / 2;

        // Bind resize
        this._boundResize = this._resize.bind(this);
        window.addEventListener('resize', this._boundResize);
        this._resize();

        // Bind click
        this.canvas.addEventListener('click', this._handleClick.bind(this));
        this.canvas.style.cursor = 'default';
        this.canvas.addEventListener('mousemove', this._handleHover.bind(this));
    }

    // ─────────────────────────────────────────
    // Game Controller (called functions)

    loadGraph(graph) {                  // Loads a graph instance with all values in null or default.
        this._graph = graph;
        this._layoutReady = false;
        this.clearHighlights();
        this._stopAnimation();
        const parent = this.canvas.parentElement;
        if (parent) {                   // FIX: Prevents canvas being 0x0.
            this.canvas.width = parent.clientWidth;
            this.canvas.height = parent.clientHeight;
        }
        this._computeLayout();
        this.draw();
    }

    draw() {                            // Redraws the graph completely.
        if (!this._graph) return;
        this._clear();
        this._drawEdges();
        this._drawNodes();
        if (this._blackout) {
            this._drawBlackout();
        }
    }

    _drawBlackout() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.save();
        const x = this._mouseX;
        const y = this._mouseY;

        // Create radial gradient around mouse coordinates
        // Inner radius: 60px (transparent), outer radius: 200px (dark blackout)
        const grad = ctx.createRadialGradient(x, y, 30, x, y, 130);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        grad.addColorStop(0.4, 'rgba(0, 0, 0, 0.3)');
        grad.addColorStop(0.8, 'rgba(5, 7, 10, 0.92)');
        grad.addColorStop(1, 'rgba(5, 7, 10, 0.98)');

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
    }

    onNodeClick(callback) {             // Registers clicks.
        this._clickCallback = callback;
    }

    animateTraversal(nodeIdList, delayMs = 600, onComplete = null) {     // BFS-DFS animations.
        this._stopAnimation();
        this._animQueue = [...nodeIdList];
        this._animIndex = 0;
        this._animVisited = new Set();
        this._animEdges = new Set();

        const step = () => {
            if (this._animIndex >= this._animQueue.length) {
                this._animTimer = null;
                if (onComplete) onComplete();
                return;
            }

            const currNodeId = this._animQueue[this._animIndex];
            this._animVisited.add(currNodeId);

            if (this._animIndex > 0) {
                const parent = this._findPredecessor(currNodeId);
                if (parent !== null) {
                    this._animEdges.add(_ekey(parent, currNodeId));
                }
            }

            this._animIndex++;
            this.draw();
            this._animTimer = setTimeout(step, delayMs);
        };

        step();
    }

    _findPredecessor(nodeId) {
        if (!this._graph) return null;
        const visitedArray = this._animQueue.slice(0, this._animIndex);
        for (let i = visitedArray.length - 1; i >= 0; i--) {
            const prevId = visitedArray[i];
            const edges = this._graph.undirectedAdj.get(prevId) || [];
            if (edges.some(e => e.to === nodeId)) {
                return prevId;
            }
        }
        return null;
    }

    highlightPath(nodeIdList) {         // Dijkstra highlighted path
        this._stopAnimation();
        this._highlightPath = [...nodeIdList];
        this.draw();
    }

    animatePath(nodeIdList, delayMs = 400, onComplete = null) { // Dijkstra progressive path animation
        this._stopAnimation();
        this._highlightPath = [];
        let i = 0;

        const step = () => {
            if (i >= nodeIdList.length) {
                this._animTimer = null;
                if (onComplete) onComplete();
                return;
            }
            this._highlightPath.push(nodeIdList[i]);
            this.draw();
            i++;
            this._animTimer = setTimeout(step, delayMs);
        };
        step();
    }

    highlightMST(edgeList) {            // Prim highlighted edges
        this._stopAnimation();
        this._highlightMST = [...edgeList];
        this.draw();
    }

    animateMST(edgeList, delayMs = 400, onComplete = null) { // Prim progressive MST animation
        this._stopAnimation();
        this._highlightMST = [];
        let i = 0;

        const step = () => {
            if (i >= edgeList.length) {
                this._animTimer = null;
                if (onComplete) onComplete();
                return;
            }
            this._highlightMST.push(edgeList[i]);
            this.draw();
            i++;
            this._animTimer = setTimeout(step, delayMs);
        };
        step();
    }

    highlightFlow(edgeList) {           // Ford-Fulkerson highlighted path
        this._stopAnimation();
        this._highlightFlow = [...edgeList];
        this.draw();
    }

    animateFlow(edgeList, delayMs = 400, onComplete = null) { // Ford-Fulkerson progressive flow animation
        this._stopAnimation();
        this._highlightFlow = [];
        let i = 0;

        const step = () => {
            if (i >= edgeList.length) {
                this._animTimer = null;
                if (onComplete) onComplete();
                return;
            }
            this._highlightFlow.push(edgeList[i]);
            this.draw();
            i++;
            this._animTimer = setTimeout(step, delayMs);
        };
        step();
    }

    clearHighlights() {                 // Resets all highlights, used in between missions.
        this._stopAnimation();
        this._animVisited = new Set();
        this._animEdges = new Set();
        this._highlightPath = [];
        this._highlightMST = [];
        this._highlightFlow = [];
        this.draw();
    }

    // ─────────────────────────────────────────
    // LAYOUT - runs the simulation to position each node during rendering.

    _computeLayout() {
        if (!this._graph) return;                       // All constants required
        const nodes = this._graph.getAllNodes();
        const edges = this._graph.getAllEdges();
        const W = this.canvas.width;
        const H = this.canvas.height;
        const cx = W / 2;
        const cy = H / 2;

        // Asymmetrical padding to prevent clipping under UI overlays
        const PADDING_X = this.NODE_RADIUS + 40;
        const PADDING_TOP = this.NODE_RADIUS + 65;    // Clear the top mission bar
        const PADDING_BOTTOM = this.NODE_RADIUS + 110; // Clear the bottom dialog box

        // Position Initialization
        for (const node of nodes) {
            node.x = cx + (Math.random() - 0.5) * (W * 0.5);
            node.y = cy + (Math.random() - 0.5) * (H * 0.5);
            node.vx = 0;
            node.vy = 0;
        }

        // Force-directed simulation
        const ITERATIONS = 400;
        const REPULSION = Math.max(W, H) * nodes.length * 6; // slightly reduced repulsion
        const ATTRACTION = 0.024; // slightly stronger attraction
        const DAMPING = 0.82;
        const MIN_DIST = this.NODE_RADIUS * 3.0;

        for (let iter = 0; iter < ITERATIONS; iter++) {
            // Repulsion between every pair of nodes
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const a = nodes[i];
                    const b = nodes[j];
                    const dx = b.x - a.x;
                    const dy = b.y - a.y;
                    const dist = Math.max(Math.sqrt(dx * dx + dy * dy), MIN_DIST);
                    const force = REPULSION / (dist * dist);
                    const fx = (dx / dist) * force;
                    const fy = (dy / dist) * force;
                    a.vx -= fx; a.vy -= fy;
                    b.vx += fx; b.vy += fy;
                }
            }

            // Attraction along edges
            for (const edge of edges) {
                const a = this._graph.getNode(edge.from);
                const b = this._graph.getNode(edge.to);
                if (!a || !b) continue;
                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
                const force = dist * ATTRACTION;
                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;
                a.vx += fx; a.vy += fy;
                b.vx -= fx; b.vy -= fy;
            }

            // Apply velocity + damping + boundary clamping + center gravity
            const gravity = 0.02; // slightly stronger center gravity
            for (const node of nodes) {
                node.vx += (cx - node.x) * gravity;
                node.vy += (cy - node.y) * gravity;

                node.vx *= DAMPING;
                node.vy *= DAMPING;
                node.x = Math.max(PADDING_X, Math.min(W - PADDING_X, node.x + node.vx));
                node.y = Math.max(PADDING_TOP, Math.min(H - PADDING_BOTTOM, node.y + node.vy));
            }
        }

        // FIX: Post-simulation pass: run relaxation 5 times to resolve all cascading overlaps
        for (let pass = 0; pass < 5; pass++) {
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const a = nodes[i];
                    const b = nodes[j];
                    const dx = b.x - a.x || 0.1;
                    const dy = b.y - a.y || 0.1;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const minSep = this.NODE_RADIUS * 2 + 15; // slightly larger separation buffer
                    if (dist < minSep) {
                        const push = (minSep - dist) / 2;
                        const nx = dx / dist;
                        const ny = dy / dist;
                        a.x = Math.max(PADDING_X, Math.min(W - PADDING_X, a.x - nx * push));
                        a.y = Math.max(PADDING_TOP, Math.min(H - PADDING_BOTTOM, a.y - ny * push));
                        b.x = Math.max(PADDING_X, Math.min(W - PADDING_X, b.x + nx * push));
                        b.y = Math.max(PADDING_TOP, Math.min(H - PADDING_BOTTOM, b.y + ny * push));
                    }
                }
            }
        }

        this._layoutReady = true;
    }

    // ─────────────────────────────────────────
    // DRAWING

    _clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    _drawEdges() {
        const ctx = this.ctx;
        const edges = this._graph.getAllEdges();
        const mstSet = new Set(this._highlightMST.map(e => _ekey(e.from, e.to)));
        const flowSet = new Set(this._highlightFlow.map(e => _ekey(e.from, e.to)));

        const pathSet = new Set();                  // Builds the connections to draw them.
        for (let i = 0; i < this._highlightPath.length - 1; i++) {
            pathSet.add(_ekey(this._highlightPath[i], this._highlightPath[i + 1]));
        }

        for (const edge of edges) {
            const a = this._graph.getNode(edge.from);
            const b = this._graph.getNode(edge.to);
            if (!a || !b) continue;

            const key = _ekey(edge.from, edge.to);

            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);

            if (flowSet.has(key)) {
                ctx.strokeStyle = this.COLOR.edgeFlow;
                ctx.lineWidth = 3;
                ctx.setLineDash([]);
                ctx.shadowBlur = 10;
                ctx.shadowColor = this.COLOR.edgeFlow;
            } else if (mstSet.has(key)) {
                const isBadActor = !a.isClean || !b.isClean;
                ctx.strokeStyle = isBadActor ? 'var(--accent-red)' : this.COLOR.edgeMST;
                ctx.lineWidth = 3;
                ctx.setLineDash([]);
                ctx.shadowBlur = 10;
                ctx.shadowColor = isBadActor ? 'var(--accent-red)' : this.COLOR.edgeMST;
            } else if (pathSet.has(key)) {
                ctx.strokeStyle = this.COLOR.edgeHighlight;
                ctx.lineWidth = 3;
                ctx.setLineDash([]);
                ctx.shadowBlur = 10;
                ctx.shadowColor = this.COLOR.edgeHighlight;
            } else if (this._animEdges && this._animEdges.has(key)) {
                ctx.strokeStyle = this.COLOR.nodeVisited;
                ctx.lineWidth = 3.5;
                ctx.setLineDash([]);
                ctx.shadowBlur = 15;
                ctx.shadowColor = this.COLOR.nodeVisited;
            } else {
                ctx.strokeStyle = this.COLOR.edge;
                ctx.lineWidth = 1.5;
                ctx.setLineDash([4, 4]);
                ctx.shadowBlur = 0;
            }

            ctx.stroke();
            ctx.setLineDash([]);
            ctx.shadowBlur = 0;

            if (pathSet.has(key) || mstSet.has(key)) {   // Draws the ID of the node at the center.
                const mx = (a.x + b.x) / 2;
                const my = (a.y + b.y) / 2;
                ctx.fillStyle = this.COLOR.textDim;
                ctx.font = this.LABEL_FONT;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(edge.weight, mx, my - 8);
            }
        }
    }

    _drawNodes() {
        if (!this._graph) return;
        for (const node of this._graph.getAllNodes()) {
            this._drawNode(node);
        }
    }

    _drawNode(node) {
        const ctx = this.ctx;
        const x = node.x;
        const y = node.y;
        const r = this.NODE_RADIUS;

        let ringColor = this.COLOR.nodeDefault;

        if (node.firewalled) {
            ringColor = '#ff3c3c';
        } else if (this._highlightPath.includes(node.id)) {
            ringColor = this.COLOR.pathHighlight;
        } else if (this._animVisited.has(node.id)) {
            ringColor = this.COLOR.nodeVisited;
        } else if (node.classified) {
            // Correctly classified
            ringColor = node.isClean ? this.COLOR.nodeClean : node.crimeConfig.color;
        }

        ctx.shadowBlur = 18;                   // draw shadow
        ctx.shadowColor = ringColor;
        ctx.fillStyle = this.COLOR.nodeFill;    // draw color
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = ringColor;            // draw outer ring
        ctx.lineWidth = 3;
        ctx.stroke();

        if (node.classified && !node.isClean && node.crimeConfig) { // draw inner ring
            ctx.strokeStyle = node.crimeConfig.color;
            ctx.lineWidth = 5;
            ctx.shadowBlur = 8;
            ctx.shadowColor = node.crimeConfig.color;
            ctx.beginPath();
            ctx.arc(x, y, r - 4, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.shadowBlur = 0;
        ctx.fillStyle = this.COLOR.textMain; // draw ID//name
        ctx.font = this.NODE_FONT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (node.classified) {
            const shortName = node.name.split(' ')[0]; // show name
            ctx.fillText(shortName.length > 8 ? shortName.slice(0, 7) + '…' : shortName, x, y);
        } else if (node.firewalled) {
            ctx.fillText('🔒', x, y);
        } else {
            ctx.fillText(`ID:${node.id}`, x, y);
        }

        if (node.classified && !node.isClean && node.crimeConfig) { // show crime
            ctx.fillStyle = node.crimeConfig.color;
            ctx.font = '9px JetBrains Mono';
            ctx.fillText(node.crimeConfig.label.toUpperCase(), x, y + r + 12);
        }
    }

    // ─────────────────────────────────────────
    // INPUT HANDLING (click related)

    _handleClick(e) {
        if (!this._graph || !this._clickCallback) return;
        const node = this._getNodeAtPoint(e);
        if (node) this._clickCallback(node);
    }

    _handleHover(e) {
        if (!this._graph) return;
        const node = this._getNodeAtPoint(e);
        if (node) {
            this.canvas.style.cursor = node.firewalled ? 'not-allowed' : 'pointer';
        } else {
            this.canvas.style.cursor = 'default';
        }

        if (this._blackout) {
            this.draw();
        }
    }

    _updateMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        this._mouseX = (e.clientX - rect.left) * scaleX;
        this._mouseY = (e.clientY - rect.top) * scaleY;
    }

    _getNodeAtPoint(e) {
        this._updateMousePos(e);
        const mx = this._mouseX;
        const my = this._mouseY;

        for (const node of this._graph.getAllNodes()) {
            const dx = mx - node.x;
            const dy = my - node.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= this.NODE_RADIUS + 4) return node; // +4px tolerance
        }
        return null;
    }

    // ─────────────────────────────────────────
    // UTILITIES

    _resize() {
        const parent = this.canvas.parentElement;
        if (!parent) return;

        const newWidth = parent.clientWidth;
        const newHeight = parent.clientHeight;

        // Only resize if the dimensions actually changed, preventing feedback loops
        if (this.canvas.width === newWidth && this.canvas.height === newHeight) {
            return;
        }

        this.canvas.width = newWidth;
        this.canvas.height = newHeight;

        // Re-do layout to not damage window resizing
        if (this._graph && this._layoutReady) {
            this._computeLayout();
            this.draw();
        }
    }

    _stopAnimation() {
        if (this._animTimer) {
            clearTimeout(this._animTimer);
            this._animTimer = null;
        }
    }

    destroy() {                 // Stops event listens.
        this._stopAnimation();
        window.removeEventListener('resize', this._boundResize);
    }
}

// ─────────────────────────────────────────────
// MODULE-LEVEL HELPER
// Edge key for deduplication, order independent

function _ekey(a, b) {
    return a < b ? `${a}-${b}` : `${b}-${a}`;
}