// NetworkManager.js
// Used for handling the connection of all websocket connections. - EJ
// FUNCTIONS: Connects, sends and receives data to/from the server.


const NetworkManager = (() => {
    let _ws = null;
    let _listeners = {};   // type → [callbacks]
    let _connected = false;

    // ─────────────────────────────────────────
    // CONNECTION

    function connect(serverUrl) {
        if (_ws) {
            _ws.onopen = null;
            _ws.onclose = null;
            _ws.onerror = null;
            _ws.onmessage = null;
            _ws.close();
            _ws = null;
        }
        _connected = false;

        return new Promise((resolve, reject) => {
            _ws = new WebSocket(serverUrl);

            _ws.onopen = () => {
                _connected = true;
                console.log('[NetworkManager] Connected to server');
                resolve();
            };

            _ws.onclose = () => {
                _connected = false;
                console.log('[NetworkManager] Disconnected from server');
                _emit('DISCONNECTED', {});
            };

            _ws.onerror = (err) => {
                console.error('[NetworkManager] Connection error');
                reject(err);
            };

            _ws.onmessage = (event) => {
                let msg;
                try {
                    msg = JSON.parse(event.data);
                } catch {
                    console.warn('[NetworkManager] Malformed message received');
                    return;
                }
                console.log(`[NetworkManager] Received: ${msg.type}`);
                _emit(msg.type, msg);
            };
        });
    }

    function disconnect() {
        if (_ws) _ws.close();
    }

    function isConnected() {
        return _connected;
    }

    // ─────────────────────────────────────────
    // SEND

    function send(payload) {
        if (!_connected || !_ws) {
            console.warn('[NetworkManager] Cannot send, not connected');
            return;
        }
        _ws.send(JSON.stringify(payload));
    }

    // ─────────────────────────────────────────
    // EVENT LISTENER API

    function on(type, callback) {
        if (!_listeners[type]) _listeners[type] = [];
        _listeners[type].push(callback);
    }

    function off(type, callback) {
        if (!_listeners[type]) return;
        _listeners[type] = _listeners[type].filter(cb => cb !== callback);
    }

    function clearListeners() {
        _listeners = {};
    }

    function _emit(type, msg) {
        if (_listeners[type]) {
            _listeners[type].forEach(cb => cb(msg));
        }
    }

    // ─────────────────────────────────────────
    // CONVENIENCE SENDERS

    // Detective side
    function registerSession() { send({ type: 'REGISTER_SESSION' }); }
    function notifyDetectiveWin() { send({ type: 'DETECTIVE_WIN' }); }
    function sendGameEvent(payload) { send({ type: 'GAME_EVENT', payload }); }

    // Attacker side
    function registerAttacker() { send({ type: 'REGISTER_ATTACKER' }); }
    function joinSession(sessionId) { send({ type: 'JOIN_SESSION', sessionId }); }
    function leaveSession() { send({ type: 'LEAVE_SESSION' }); }
    function sendAttack(attack, payload) { send({ type: 'ATTACK', attack, payload: payload || {} }); }
    function notifyAttackerWin() { send({ type: 'ATTACKER_WIN' }); }

    return {
        connect, disconnect, isConnected,
        send, on, off, clearListeners,
        registerSession, notifyDetectiveWin, sendGameEvent,
        registerAttacker, joinSession, leaveSession, sendAttack, notifyAttackerWin
    };
})();