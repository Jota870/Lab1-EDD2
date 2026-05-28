// graph.js
// Based upon the old algorithms config and part of GraphAlgorithms.js
// HAS: + buildfromNodes, change/add edges, all 5 algorithms + base structure. - EJ

class Graph {
    constructor() {
        this.undirectedAdj = new Map(); // Used in: BFS, DFS, Dijkstra, Prim
        this.directedAdj = new Map(); // Used in: Ford-Fulkerson
        this.nodes = new Map(); // Uses and assigns the id to the node object from missions.js
        this.sourceId = null;      // Grabs the highest value ID
        this.sinkId = null;      // Grabs the lower value ID
    }

    // ─────────────────────────────────────────
    // BASE GENERATION: (nodes)

    buildFromNodes(nodes, edges, sourceId, sinkId) {
        this.undirectedAdj.clear();
        this.directedAdj.clear();
        this.nodes.clear();
        this.sourceId = null;
        this.sinkId = null;

        for (const node of nodes) {                 // Register all nodes first
            this.nodes.set(node.id, node);
            this.undirectedAdj.set(node.id, []);
            this.directedAdj.set(node.id, []);
        }

        for (const edge of edges) {                 // Register all edges
            this._addEdge(edge.from, edge.to, edge.weight, edge.capacity);
        }

        this.sourceId = sourceId;
        this.sinkId = sinkId;
    }

    _addEdge(fromId, toId, weight, capacity) {     // Internal edge registration, checks for both directed and undirected.                 
        if (!this.nodes.has(fromId) || !this.nodes.has(toId)) return;

        // Undirected, both directions
        this.undirectedAdj.get(fromId).push({ to: toId, weight, capacity });
        this.undirectedAdj.get(toId).push({ to: fromId, weight, capacity });

        // Directed, source to target only (used by Ford-Fulkerson)
        this.directedAdj.get(fromId).push({ to: toId, weight, capacity });
    }

    // ─────────────────────────────────────────
    // ALGORITHM 1, BFS, Returns ordered list of node IDs visited breadth-first used in Mission 1.

    bfs(startId) {
        if (!this.nodes.has(startId)) return [];

        const visited = new Set();
        const queue = [startId];
        const result = [];

        visited.add(startId);

        while (queue.length > 0) {
            const curr = queue.shift();
            result.push(curr);

            for (const edge of this.undirectedAdj.get(curr)) {
                if (!visited.has(edge.to)) {
                    visited.add(edge.to);
                    queue.push(edge.to);
                }
            }
        }

        return result;
    }

    // ─────────────────────────────────────────
    // ALGORITHM 2, DFS, Returns ordered list of node IDs visited depth-first used in Mission 1.

    dfs(startId) {
        if (!this.nodes.has(startId)) return [];

        const visited = new Set();
        const result = [];

        const _dfs = (nodeId) => {
            visited.add(nodeId);
            result.push(nodeId);
            for (const edge of this.undirectedAdj.get(nodeId)) {
                if (!visited.has(edge.to)) {
                    _dfs(edge.to);
                }
            }
        };

        _dfs(startId);
        return result;
    }

    // ─────────────────────────────────────────
    // ALGORITHM 3, DIJKSTRA, Returns { path: number[], cost: number }, as used in Mission 2.

    dijkstra(startId, targetId) {
        if (!this.nodes.has(startId) || !this.nodes.has(targetId)) return null;

        const distances = new Map();
        const previous = new Map();
        const unvisited = new Set(this.nodes.keys());

        for (const key of this.nodes.keys()) {
            distances.set(key, Infinity);
            previous.set(key, null);
        }
        distances.set(startId, 0);

        while (unvisited.size > 0) {
            // Pick unvisited node with smallest known distance
            let curr = null;
            let minDist = Infinity;
            for (const node of unvisited) {
                if (distances.get(node) < minDist) {
                    minDist = distances.get(node);
                    curr = node;
                }
            }

            if (curr === null) break;     // remaining nodes unreachable
            if (curr === targetId) break; // found target

            unvisited.delete(curr);

            for (const edge of this.undirectedAdj.get(curr)) {
                if (unvisited.has(edge.to)) {
                    const newDist = distances.get(curr) + edge.weight;
                    if (newDist < distances.get(edge.to)) {
                        distances.set(edge.to, newDist);
                        previous.set(edge.to, curr);
                    }
                }
            }
        }

        // Reconstruct path by walking backwards through `previous`
        const path = [];
        let curr = targetId;
        if (previous.get(curr) !== undefined || curr === startId) {
            while (curr !== null) {
                path.unshift(curr);
                curr = previous.get(curr);
            }
        }

        return { path, cost: distances.get(targetId) };
    }

    // ─────────────────────────────────────────
    // ALGORITHM 4, PRIM (MST), Returns array of edges: { from, to, weight }, used in Mission 3.

    prim() {
        if (this.nodes.size === 0) return [];

        const startId = this.sourceId || Array.from(this.nodes.keys())[0];
        const visited = new Set([startId]);
        const mstEdges = [];

        while (visited.size < this.nodes.size) {
            let minEdge = null;
            let minWeight = Infinity;

            for (const v of visited) {
                for (const edge of this.undirectedAdj.get(v)) {
                    if (!visited.has(edge.to) && edge.weight < minWeight) {
                        minWeight = edge.weight;
                        minEdge = { from: v, to: edge.to, weight: edge.weight };
                    }
                }
            }

            if (minEdge) {
                visited.add(minEdge.to);
                mstEdges.push(minEdge);
            } else {
                break; // disconnected graph, redundancy line
            }
        }
        return mstEdges;
    }

    // ─────────────────────────────────────────
    // ALGORITHM 5 — FORD-FULKERSON, returns the maxFlow (number), used in Mission 4 to calculate the max harmful content flow in the graph.

    fordFulkerson(sourceId, sinkId) {
        if (!this.nodes.has(sourceId) || !this.nodes.has(sinkId)) return 0;

        // Build residual graph from directed adjacency
        const residual = new Map();
        for (const key of this.nodes.keys()) {
            residual.set(key, new Map());
        }
        for (const [u, neighbors] of this.directedAdj.entries()) {
            for (const edge of neighbors) {
                residual.get(u).set(edge.to, edge.capacity);
                if (!residual.get(edge.to).has(u)) {
                    residual.get(edge.to).set(u, 0); // reverse edge starts at 0
                }
            }
        }

        // BFS to find an augmenting path — returns true if sink is reachable
        const _bfs = (s, t, parent) => {
            const visited = new Set([s]);
            const queue = [s];

            while (queue.length > 0) {
                const u = queue.shift();
                for (const [v, cap] of residual.get(u).entries()) {
                    if (!visited.has(v) && cap > 0) {
                        parent.set(v, u);
                        visited.add(v);
                        queue.push(v);
                        if (v === t) return true;
                    }
                }
            }
            return false;
        };

        let maxFlow = 0;
        const parent = new Map();

        while (_bfs(sourceId, sinkId, parent)) {
            // Find bottleneck capacity along the augmenting path
            let pathFlow = Infinity;
            for (let v = sinkId; v !== sourceId; v = parent.get(v)) {
                const u = parent.get(v);
                pathFlow = Math.min(pathFlow, residual.get(u).get(v));
            }

            // Update residual capacities along the path
            for (let v = sinkId; v !== sourceId; v = parent.get(v)) {
                const u = parent.get(v);
                residual.get(u).set(v, residual.get(u).get(v) - pathFlow);
                residual.get(v).set(u, residual.get(v).get(u) + pathFlow);
            }

            maxFlow += pathFlow;
            parent.clear(); // reset for next BFS pass
        }

        const flowEdges = [];
        for (const [u, neighbors] of this.directedAdj.entries()) {
            for (const edge of neighbors) {
                const initialCapacity = edge.capacity;
                const residualCapacity = residual.get(u).get(edge.to) || 0;
                const flow = initialCapacity - residualCapacity;
                if (flow > 0) {
                    flowEdges.push({ from: u, to: edge.to, flow: flow });
                }
            }
        }

        return { maxFlow, flowEdges };
    }

    // ─────────────────────────────────────────
    // UTILITIES, "Get" helpers for GameController and GraphRenderer


    getNode(id) {
        return this.nodes.get(id) || null; // specific node
    }

    getAllNodes() {
        return Array.from(this.nodes.values()); // array of nodes
    }

    getAllEdges() {
        const seen = new Set();
        const edges = [];

        for (const [fromId, neighbors] of this.undirectedAdj.entries()) {
            for (const edge of neighbors) {
                const key = fromId < edge.to
                    ? `${fromId}-${edge.to}`
                    : `${edge.to}-${fromId}`;   // De-duplication
                if (!seen.has(key)) {
                    seen.add(key);
                    edges.push({ from: fromId, to: edge.to, weight: edge.weight, capacity: edge.capacity });
                }
            }
        }
        return edges;
    }

    get size() {
        return this.nodes.size; // total node count
    }
}