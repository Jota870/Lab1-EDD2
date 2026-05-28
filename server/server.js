// server.js
// New multiplayer functionality added to be a relay server for multiple connections. - EJ
// HAS: Tracking for sessions of attackers and detectives, and connections between clients.
// Run with: node server.js

const http = require('http');
const WebSocket = require('ws');

const PORT = process.env.PORT || 8080;

// Create an HTTP server to satisfy health checks on cloud platforms like Render or Railway.
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('CASEFILE: REDACTED WebSocket Relay Server is active and running.');
});

const wss = new WebSocket.Server({ server });

// ─────────────────────────────────────────
// STATE

// Active detective sessions.
const sessions = new Map(); // Shows total sesssions, status: 'WAITING' | 'IN_PROGRESS' | 'FINISHED'
const attackers = new Map(); // Shows connected attackers
let sessionCounter = 1;

// ─────────────────────────────────────────
// UTILITIES

function send(ws, payload) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(payload));
    }
}

function broadcastSessionList() {
    const list = Array.from(sessions.values()).map(s => ({
        sessionId: s.sessionId,
        port: PORT,
        status: s.status,
        missionIndex: s.missionIndex || 0,
        snapshot: s.snapshot || null,
        timerRemaining: s.timerEnd ? Math.max(0, s.timerEnd - Date.now()) : (3 * 60 * 1000)
    }));

    const msg = { type: 'SESSION_LIST', sessions: list };

    // Send to all attackers in the lobby (not yet in a session)
    for (const [ws, attacker] of attackers.entries()) {
        if (attacker.sessionId === null) {
            send(ws, msg);
        }
    }
}

function getAttackerInSession(sessionId) {
    for (const [ws, attacker] of attackers.entries()) {
        if (attacker.sessionId === sessionId) return ws;
    }
    return null;
}

// ─────────────────────────────────────────
// CONNECTION HANDLER

wss.on('connection', (ws) => {
    console.log('[Server] New client connected');

    ws.on('message', (raw) => {
        let msg;
        try {
            msg = JSON.parse(raw);
        } catch {
            console.warn('[Server] Malformed message received');
            return;
        }

        console.log(`[Server] Message received: ${msg.type}`);

        switch (msg.type) {

            // DETECTIVE: registers as a new session on game start
            case 'REGISTER_SESSION': {
                const sessionId = `SESSION_${String(sessionCounter++).padStart(2, '0')}`;
                sessions.set(sessionId, {
                    ws,
                    sessionId,
                    port: PORT,
                    status: 'IN_PROGRESS',
                    missionIndex: 0,        // updated on SESSION_SNAPSHOT
                    snapshot: null,      // last known canvas snapshot
                    timerEnd: null,
                    timerTimeout: null
                });
                ws._sessionId = sessionId;
                ws._clientType = 'detective';

                send(ws, { type: 'SESSION_REGISTERED', sessionId, port: PORT });
                console.log(`[Server] Session registered: ${sessionId}`);

                // Notify all lobby attackers a new session is available
                broadcastSessionList();
                break;
            }

            // DETECTIVE: notifies server the mission is complete
            case 'DETECTIVE_WIN': {
                const session = sessions.get(ws._sessionId);
                if (!session) break;

                session.status = 'FINISHED';

                if (session.timerTimeout) {
                    clearTimeout(session.timerTimeout);
                    session.timerTimeout = null;
                }

                // Kick attacker from this session if present
                const attackerWs = getAttackerInSession(ws._sessionId);
                if (attackerWs) {
                    send(attackerWs, { type: 'KICKED', reason: 'DETECTIVE_WIN' });
                    attackers.get(attackerWs).sessionId = null;
                }

                broadcastSessionList();
                break;
            }

            // DETECTIVE: forwards game state events to attacker 
            // e.g. mission progress, node classification, score updates
            case 'GAME_EVENT': {
                const attackerWs = getAttackerInSession(ws._sessionId);
                if (attackerWs) {
                    send(attackerWs, { type: 'GAME_EVENT', payload: msg.payload });
                }
                break;
            }

            // ATTACKER: registers as an attacker (joins lobby)
            case 'REGISTER_ATTACKER': {
                ws._clientType = 'attacker';
                attackers.set(ws, { sessionId: null });

                // Send current session list immediately
                const list = Array.from(sessions.values()).map(s => ({
                    sessionId: s.sessionId,
                    port: PORT,
                    status: s.status,
                    missionIndex: s.missionIndex || 0,
                    snapshot: s.snapshot || null,
                    timerRemaining: s.timerEnd ? Math.max(0, s.timerEnd - Date.now()) : (3 * 60 * 1000)
                }));
                send(ws, { type: 'SESSION_LIST', sessions: list });
                console.log('[Server] Attacker registered in lobby');
                break;
            }

            // ATTACKER: joins a specific detective session
            case 'JOIN_SESSION': {
                const { sessionId } = msg;
                const session = sessions.get(sessionId);

                console.log(`[Server] Attacker requesting to join ${sessionId}`);

                if (!session || session.status === 'FINISHED') {
                    console.log(`[Server] Join rejected: ${sessionId} is not available`);
                    send(ws, { type: 'JOIN_REJECTED', reason: 'Session not available' });
                    break;
                }

                // Check if session is already occupied by another attacker
                const existingAttacker = getAttackerInSession(sessionId);
                if (existingAttacker) {
                    console.log(`[Server] Join rejected: ${sessionId} is already occupied by another attacker!`);
                    send(ws, { type: 'JOIN_REJECTED', reason: 'Session already occupied' });
                    break;
                }

                // Update attacker's current session
                attackers.get(ws).sessionId = sessionId;

                // Start timer if not already started
                if (!session.timerEnd) {
                    session.timerEnd = Date.now() + (3 * 60 * 1000); // 2 minutes

                    // Set timeout to automatically end the session when timer expires
                    session.timerTimeout = setTimeout(() => {
                        if (session.status !== 'FINISHED') {
                            session.status = 'FINISHED';
                            send(session.ws, { type: 'GAME_OVER', reason: 'TIMER_EXPIRED' });

                            const attackerWs = getAttackerInSession(sessionId);
                            if (attackerWs) {
                                send(attackerWs, { type: 'KICKED', reason: 'TIMER_EXPIRED' });
                                attackers.get(attackerWs).sessionId = null;
                            }
                            broadcastSessionList();
                        }
                    }, 3 * 60 * 1000);
                }

                const remaining = Math.max(0, session.timerEnd - Date.now());

                send(ws, {
                    type: 'JOIN_CONFIRMED',
                    sessionId,
                    timerRemaining: remaining
                });
                send(session.ws, { type: 'ATTACKER_ENTERED', sessionId });
                console.log(`[Server] Attacker joined ${sessionId}. Timer remaining: ${remaining}ms`);
                break;
            }

            // ATTACKER: leaves current session, returns to lobby
            case 'LEAVE_SESSION': {
                const attacker = attackers.get(ws);
                if (!attacker || !attacker.sessionId) break;

                const session = sessions.get(attacker.sessionId);
                if (session) {
                    send(session.ws, { type: 'ATTACKER_LEFT' });
                }

                attacker.sessionId = null;
                send(ws, { type: 'RETURNED_TO_LOBBY' });

                // Refresh session list for this attacker now in lobby
                broadcastSessionList();
                break;
            }

            // ATTACKER: sends an attack to the detective in their session ──
            case 'ATTACK': {
                const attacker = attackers.get(ws);
                if (!attacker || !attacker.sessionId) break;

                const session = sessions.get(attacker.sessionId);
                if (!session) break;

                // Forward attack payload directly to the detective
                send(session.ws, {
                    type: 'INCOMING_ATTACK',
                    attack: msg.attack,   // attack type key
                    payload: msg.payload   // optional extra data
                });

                console.log(`[Server] Attack '${msg.attack}' forwarded to ${attacker.sessionId}`);
                break;
            }

            // ATTACKER: timer ran out, detective gets game over
            case 'ATTACKER_WIN': {
                const attacker = attackers.get(ws);
                if (!attacker || !attacker.sessionId) break;

                const session = sessions.get(attacker.sessionId);
                if (session) {
                    if (session.timerTimeout) {
                        clearTimeout(session.timerTimeout);
                        session.timerTimeout = null;
                    }
                    send(session.ws, { type: 'GAME_OVER', reason: 'TIMER_EXPIRED' });
                    session.status = 'FINISHED';
                }

                attacker.sessionId = null;
                broadcastSessionList();
                break;
            }

            // DETECTIVE: sends a canvas snapshot + mission progress
            // Triggered on: mission complete, incoming attack received
            case 'SESSION_SNAPSHOT': {
                const session = sessions.get(ws._sessionId);
                if (!session) break;

                // Update stored state on session
                session.missionIndex = msg.missionIndex || 0;
                session.snapshot = msg.snapshot || null;

                // Relay to the attacker currently in this session
                const attackerWs = getAttackerInSession(ws._sessionId);
                if (attackerWs) {
                    send(attackerWs, {
                        type: 'SESSION_SNAPSHOT',
                        sessionId: ws._sessionId,
                        snapshot: msg.snapshot,
                        missionIndex: msg.missionIndex,
                        missionTitle: msg.missionTitle || ''
                    });
                }

                // Also broadcast updated session list so lobby cards refresh
                broadcastSessionList();
                console.log(`[Server] Snapshot relayed for ${ws._sessionId} (mission ${msg.missionIndex})`);
                break;
            }

            default:
                console.warn(`[Server] Unknown message type: ${msg.type}`);
        }
    });

    // CLIENT DISCONNECTED
    ws.on('close', () => {
        console.log('[Server] Client disconnected');

        if (ws._clientType === 'detective') {
            const sessionId = ws._sessionId;
            if (sessionId) {
                const session = sessions.get(sessionId);
                if (session && session.timerTimeout) {
                    clearTimeout(session.timerTimeout);
                    session.timerTimeout = null;
                }
                // Notify attacker if they were in this session
                const attackerWs = getAttackerInSession(sessionId);
                if (attackerWs) {
                    send(attackerWs, { type: 'SESSION_CLOSED' });
                    attackers.get(attackerWs).sessionId = null;
                }
                sessions.delete(sessionId);
                console.log(`[Server] Session ${sessionId} removed`);
                broadcastSessionList();
            }
        }

        if (ws._clientType === 'attacker') {
            const attacker = attackers.get(ws);
            if (attacker && attacker.sessionId) {
                const session = sessions.get(attacker.sessionId);
                if (session) send(session.ws, { type: 'ATTACKER_LEFT' });
            }
            attackers.delete(ws);
        }
    });

    ws.on('error', (err) => {
        console.error('[Server] WebSocket error:', err.message);
    });
});

server.listen(PORT, () => {
    console.log(`[Server] CASEFILE: REDACTED relay running on port ${PORT}`);
    console.log(`[Server] Waiting for connections...`);
});