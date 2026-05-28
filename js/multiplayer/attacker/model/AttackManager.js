// AttackManager.js
// Used for all the attack types and it's own definitions. - EJ
// CALLED BY: AttackerController & GameController

class AttackManager {

    constructor() {

        // ATTACK DEFINITIONS 
        // cooldown: ms before attack can be used again
        // maxUses:  null = unlimited, number = hard cap per session
        // duration: ms the effect lasts on detective side (null = instant/permanent)

        this.ATTACKS = {
            FIREWALL: {
                key: 'FIREWALL',
                label: 'Firewall',
                desc: 'Bloquea un nodo aleatorio por 15 segundos.',
                cooldown: 20000,
                maxUses: null,
                duration: 15000,
                color: '#ff3c3c'
            },
            SIGNAL_JAM: {
                key: 'SIGNAL_JAM',
                label: 'Signal Jam',
                desc: 'Scrambles node ID labels por 20 segundos.',
                cooldown: 25000,
                maxUses: null,
                duration: 20000,
                color: '#ffaa00'
            },
            BLACKOUT: {
                key: 'BLACKOUT',
                label: 'Blackout',
                desc: 'Oscurece el canvas excepto alrededor del mouse por 10 segundos.',
                cooldown: 30000,
                maxUses: null,
                duration: 10000,
                color: '#7000ff'
            },
            GHOST_NODE: {
                key: 'GHOST_NODE',
                label: 'Ghost Node',
                desc: 'Inyecta un nodo falso en el grafo. (3 usos)',
                cooldown: 35000,
                maxUses: 3,
                duration: null,
                color: '#00ff88'
            },
            EDGE_DELETE: {
                key: 'EDGE_DELETE',
                label: 'Edge Delete',
                desc: 'Elimina una arista aleatoria. (3 usos)',
                cooldown: 30000,
                maxUses: 3,
                duration: null,
                color: '#00f2ff'
            }
        };

        this._cooldownEnds = {};  // Track cooldown end times, key: attackKey, value: timestamp
        this._useCounts = {};     // Track uses per session, key: attackKey, value: count used
        this._activeEffects = {}; // Active effect timers on detective side, key: attackKey, value: timeoutId

        this._resetState();
    }

    // ─────────────────────────────────────────
    // STATE

    _resetState() {
        for (const key of Object.keys(this.ATTACKS)) {
            this._cooldownEnds[key] = 0;
            this._useCounts[key] = 0;
        }
        // Clear any active effect timers
        for (const timer of Object.values(this._activeEffects)) {
            clearTimeout(timer);
        }
        this._activeEffects = {};
    }

    // ─────────────────────────────────────────
    // ATTACKER SIDE — checking and dispatching

    canUse(attackKey) {                     // Returns true if the attack is currently available to use.
        const def = this.ATTACKS[attackKey];
        if (!def) return false;
        const now = Date.now();
        if (now < this._cooldownEnds[attackKey]) return false; // Check cooldown
        if (def.maxUses !== null && this._useCounts[attackKey] >= def.maxUses) return false; // Check if max uses reached
        return true;
    }

    cooldownRemaining(attackKey) {      // Returns ms remaining on cooldown. 0 if ready.
        return Math.max(0, this._cooldownEnds[attackKey] - Date.now());
    }

    usesRemaining(attackKey) {          // Returns uses remaining. null if unlimited.
        const def = this.ATTACKS[attackKey];
        if (!def || def.maxUses === null) return null;
        return Math.max(0, def.maxUses - this._useCounts[attackKey]);
    }

    registerUse(attackKey) {            // Registers a use of an attack and starts its cooldown.
        if (!this.canUse(attackKey)) return false;

        const def = this.ATTACKS[attackKey];
        this._cooldownEnds[attackKey] = Date.now() + def.cooldown;
        this._useCounts[attackKey]++;
        return true;
    }

    getAllStatus() {                   // Returns current state of all attacks for rendering the attacker UI.  
        return Object.values(this.ATTACKS).map(def => ({
            key: def.key,
            label: def.label,
            desc: def.desc,
            color: def.color,
            available: this.canUse(def.key),
            cooldownMs: this.cooldownRemaining(def.key),
            usesLeft: this.usesRemaining(def.key),
            maxUses: def.maxUses
        }));
    }

    // ─────────────────────────────────────────
    // DETECTIVE SIDE, applies incoming attacks

    applyAttack(attackKey, payload, graph, renderer, ui) {      // Function to apply an attack via sending data.
        const def = this.ATTACKS[attackKey];
        if (!def) {
            console.warn(`[AttackManager] Unknown attack: ${attackKey}`);
            return;
        }

        console.log(`[AttackManager] Applying attack: ${attackKey}`);

        switch (attackKey) {
            case 'FIREWALL': this._applyFirewall(payload, graph, renderer, ui, def.duration); break;
            case 'SIGNAL_JAM': this._applySignalJam(graph, renderer, ui, def.duration); break;
            case 'BLACKOUT': this._applyBlackout(renderer, ui, def.duration); break;
            case 'GHOST_NODE': this._applyGhostNode(graph, renderer); break;
            case 'EDGE_DELETE': this._applyEdgeDelete(graph, renderer, def.duration); break;
        }
    }

    // FIREWALL DEFINITION
    // Locks a random unclassified node so detective can't click it
    _applyFirewall(payload, graph, renderer, ui, duration) {
        const nodes = graph.getAllNodes().filter(n => !n.classified && !n.firewalled);
        const targetNodes = nodes.length > 0 ? nodes : graph.getAllNodes().filter(n => !n.classified);
        if (targetNodes.length === 0) return;

        const target = targetNodes[Math.floor(Math.random() * targetNodes.length)];
        target.firewalled = true;
        renderer.draw();
        ui.showAttackWarning('FIREWALL', `Nodo ${target.id} bloqueado por ${duration / 1000}s`);

        const timeoutKey = `FIREWALL_${target.id}_${Date.now()}`;
        this._activeEffects[timeoutKey] = setTimeout(() => {
            target.firewalled = false;
            renderer.draw();
            delete this._activeEffects[timeoutKey];
        }, duration);
    }

    // SIGNAL JAM DEFINITION
    // Sets a flag on the graph that makes GraphRenderer show scrambled IDs
    _applySignalJam(graph, renderer, ui, duration) {
        if (this._activeEffects['SIGNAL_JAM']) {
            clearTimeout(this._activeEffects['SIGNAL_JAM']);
        }
        graph._signalJammed = true;
        renderer.draw();
        ui.showAttackWarning('SIGNAL_JAM', `IDs scrambled por ${duration / 1000}s`);

        this._activeEffects['SIGNAL_JAM'] = setTimeout(() => {
            graph._signalJammed = false;
            renderer.draw();
            delete this._activeEffects['SIGNAL_JAM'];
        }, duration);
    }

    // BLACKOUT DEFINITION
    // Sets a flag on renderer, GraphRenderer draws a blackout overlay with a flashlight radius around the mouse
    _applyBlackout(renderer, ui, duration) {
        if (this._activeEffects['BLACKOUT']) {
            clearTimeout(this._activeEffects['BLACKOUT']);
        }
        renderer._blackout = true;
        renderer.draw();
        ui.showAttackWarning('BLACKOUT', `Blackout activo por ${duration / 1000}s`);

        this._activeEffects['BLACKOUT'] = setTimeout(() => {
            renderer._blackout = false;
            renderer.draw();
            delete this._activeEffects['BLACKOUT'];
        }, duration);
    }

    // GHOST NODE DEFINITION
    // Injects a fake clean-looking node into the graph
    _applyGhostNode(graph, renderer) {
        const nodes = graph.getAllNodes();
        if (nodes.length === 0) return;

        // Ghost node looks like a clean node but is flagged as ghost
        const ghostId = 199; // a clean-range ID that doesn't normally exist
        const ghost = {
            id: ghostId,
            name: 'Usuario???',
            age: 0,
            abuseType: null,
            crimeConfig: null,
            narrative: 'Actividad sospechosa detectada. Origen desconocido.',
            evidence: [],
            gravity: 1,
            color: '#00f2ff',
            classified: false,
            isClean: true,
            isGhost: true,   // flag — GameController ignores this for mission completion
            x: Math.random() * (renderer.canvas.width - 100) + 50,
            y: Math.random() * (renderer.canvas.height - 100) + 50,
            vx: 0, vy: 0
        };

        graph.nodes.set(ghostId, ghost);
        graph.undirectedAdj.set(ghostId, []);
        graph.directedAdj.set(ghostId, []);

        // Connect ghost to a random real node
        const real = nodes[Math.floor(Math.random() * nodes.length)];
        const weight = ghostId + real.id;
        graph.undirectedAdj.get(ghostId).push({ to: real.id, weight, capacity: 10 });
        graph.undirectedAdj.get(real.id).push({ to: ghostId, weight, capacity: 10 });

        renderer.draw();
    }

    // EDGE DELETE DEFINITION
    // Removes a random edge from the graph temporarily
    _applyEdgeDelete(graph, renderer, duration) {
        const edges = graph.getAllEdges();
        if (edges.length === 0) return;

        const target = edges[Math.floor(Math.random() * edges.length)];

        // Remove from both directions in undirectedAdj
        const adjA = graph.undirectedAdj.get(target.from);
        const adjB = graph.undirectedAdj.get(target.to);
        const iA = adjA ? adjA.findIndex(e => e.to === target.to) : -1;
        const iB = adjB ? adjB.findIndex(e => e.to === target.from) : -1;

        if (iA !== -1) adjA.splice(iA, 1);
        if (iB !== -1) adjB.splice(iB, 1);

        renderer.draw();

        // Restore after duration
        if (duration) {
            const timeoutKey = `EDGE_DELETE_${target.from}_${target.to}_${Date.now()}`;
            this._activeEffects[timeoutKey] = setTimeout(() => {
                if (adjA) adjA.push({ to: target.to, weight: target.weight, capacity: target.capacity });
                if (adjB) adjB.push({ to: target.from, weight: target.weight, capacity: target.capacity });
                renderer.draw();
                delete this._activeEffects[timeoutKey];
            }, duration);
        }
    }

    // Resets all the effects if any
    reset() {
        this._resetState();
    }
}