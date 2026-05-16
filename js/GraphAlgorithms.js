/**
 * GraphAlgorithms.js
 * Transforma el Árbol AVL en un Grafo y aplica algoritmos avanzados.
 */

class CaseGraph {
    constructor() {
        this.undirectedAdj = new Map(); // Para Dijkstra y Prim
        this.directedAdj = new Map();   // Para Ford-Fulkerson (padre -> hijo)
        this.nodes = new Map();
        this.rootId = null;
        this.furthestLeafId = null;
    }

    addNode(node) {
        if (!this.nodes.has(node.caseId)) {
            this.nodes.set(node.caseId, node);
            this.undirectedAdj.set(node.caseId, []);
            this.directedAdj.set(node.caseId, []);
        }
    }

    addEdge(parent, child) {
        this.addNode(parent);
        this.addNode(child);
        
        // Peso basado en la diferencia de gravedad (distancia conceptual)
        let weight = Math.abs(parent.gravity - child.gravity);
        if (weight === 0) weight = 1;
        
        // Capacidad de flujo basada en la gravedad del padre x 10
        let capacity = parent.gravity * 10;

        // Dirigido
        this.directedAdj.get(parent.caseId).push({ to: child.caseId, weight, capacity });
        
        // No dirigido
        this.undirectedAdj.get(parent.caseId).push({ to: child.caseId, weight, capacity });
        this.undirectedAdj.get(child.caseId).push({ to: parent.caseId, weight, capacity });
    }

    buildFromTree(root) {
        this.undirectedAdj.clear();
        this.directedAdj.clear();
        this.nodes.clear();
        this.rootId = null;
        this.furthestLeafId = null;
        
        if (!root) return;
        
        this.rootId = root.caseId;
        this.addNode(root);

        const queue = [root];
        let lastNode = root;

        while (queue.length > 0) {
            let current = queue.shift();
            lastNode = current;

            if (current.left) {
                this.addEdge(current, current.left);
                queue.push(current.left);
            }
            if (current.right) {
                this.addEdge(current, current.right);
                queue.push(current.right);
            }
        }
        // El último nodo visitado en BFS (el más profundo por la derecha o izquierda)
        this.furthestLeafId = lastNode.caseId;
    }

    // 1. Recorrido BFS (Amplitud)
    bfs(startId) {
        if (!this.nodes.has(startId)) return [];
        let visited = new Set();
        let queue = [startId];
        let result = [];

        visited.add(startId);
        while(queue.length > 0) {
            let curr = queue.shift();
            result.push(curr);
            
            let neighbors = this.undirectedAdj.get(curr);
            for (let edge of neighbors) {
                if (!visited.has(edge.to)) {
                    visited.add(edge.to);
                    queue.push(edge.to);
                }
            }
        }
        return result;
    }

    // 2. Recorrido DFS (Profundidad)
    dfs(startId) {
        if (!this.nodes.has(startId)) return [];
        let visited = new Set();
        let result = [];
        
        const dfsHelper = (nodeId) => {
            visited.add(nodeId);
            result.push(nodeId);
            let neighbors = this.undirectedAdj.get(nodeId);
            for (let edge of neighbors) {
                if (!visited.has(edge.to)) {
                    dfsHelper(edge.to);
                }
            }
        };
        
        dfsHelper(startId);
        return result;
    }

    // 3. Dijkstra (Camino mínimo)
    dijkstra(startId, targetId) {
        if (!this.nodes.has(startId) || !this.nodes.has(targetId)) return null;
        
        let distances = new Map();
        let previous = new Map();
        let unvisited = new Set(this.nodes.keys());
        
        for (let key of this.nodes.keys()) {
            distances.set(key, Infinity);
            previous.set(key, null);
        }
        distances.set(startId, 0);

        while(unvisited.size > 0) {
            // Find min distance node
            let curr = null;
            let minDistance = Infinity;
            for (let node of unvisited) {
                if (distances.get(node) < minDistance) {
                    minDistance = distances.get(node);
                    curr = node;
                }
            }
            
            if (curr === null) break; // Remaining are unreachable
            if (curr === targetId) break; // Found target
            
            unvisited.delete(curr);
            
            let neighbors = this.undirectedAdj.get(curr);
            for (let edge of neighbors) {
                if (unvisited.has(edge.to)) {
                    let newDist = distances.get(curr) + edge.weight;
                    if (newDist < distances.get(edge.to)) {
                        distances.set(edge.to, newDist);
                        previous.set(edge.to, curr);
                    }
                }
            }
        }

        // Reconstruct path
        let path = [];
        let curr = targetId;
        if (previous.get(curr) || curr === startId) {
            while (curr !== null) {
                path.unshift(curr);
                curr = previous.get(curr);
            }
        }
        return { path, cost: distances.get(targetId) };
    }

    // 4. PRIM (Árbol de Expansión Mínima - MST)
    prim() {
        if (this.nodes.size === 0) return [];
        
        let startId = Array.from(this.nodes.keys())[0];
        let visited = new Set([startId]);
        let mstEdges = [];
        
        while(visited.size < this.nodes.size) {
            let minEdge = null;
            let minWeight = Infinity;
            
            for (let v of visited) {
                let neighbors = this.undirectedAdj.get(v);
                for (let edge of neighbors) {
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
                break; // Grafo desconectado
            }
        }
        return mstEdges;
    }

    // 5. Ford-Fulkerson (Flujo Máximo)
    fordFulkerson(sourceId, sinkId) {
        if (!this.nodes.has(sourceId) || !this.nodes.has(sinkId)) return 0;

        // Construir red residual
        let residualGraph = new Map();
        for (let key of this.nodes.keys()) {
            residualGraph.set(key, new Map());
        }

        for (let [u, neighbors] of this.directedAdj.entries()) {
            for (let edge of neighbors) {
                residualGraph.get(u).set(edge.to, edge.capacity);
                // Inicializar flujo inverso en 0
                if (!residualGraph.get(edge.to).has(u)) {
                    residualGraph.get(edge.to).set(u, 0);
                }
            }
        }

        const bfsFF = (s, t, parent) => {
            let visited = new Set();
            let queue = [s];
            visited.add(s);

            while(queue.length > 0) {
                let u = queue.shift();
                
                for (let [v, capacity] of residualGraph.get(u).entries()) {
                    if (!visited.has(v) && capacity > 0) {
                        queue.push(v);
                        parent.set(v, u);
                        visited.add(v);
                        if (v === t) return true;
                    }
                }
            }
            return false;
        };

        let parent = new Map();
        let maxFlow = 0;

        while (bfsFF(sourceId, sinkId, parent)) {
            let pathFlow = Infinity;
            
            // Encontrar cuello de botella
            for (let v = sinkId; v !== sourceId; v = parent.get(v)) {
                let u = parent.get(v);
                pathFlow = Math.min(pathFlow, residualGraph.get(u).get(v));
            }
            
            // Actualizar grafos residuales
            for (let v = sinkId; v !== sourceId; v = parent.get(v)) {
                let u = parent.get(v);
                residualGraph.get(u).set(v, residualGraph.get(u).get(v) - pathFlow);
                residualGraph.get(v).set(u, residualGraph.get(v).get(u) + pathFlow);
            }
            
            maxFlow += pathFlow;
        }

        return maxFlow;
    }
}
