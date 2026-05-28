// PhaseP2.js
// P2 scene: scene2.mp4 plays fullscreen as background loop.
// Persona 5 / TXR chatbox runs over the top.
// On dialogue end → white flash from center → fade to black → onComplete().

class PhaseP2 {

    static SCRIPT = [
        {
            id: 'intro_boot',
            speaker: 'SYSTEM',
            text: 'INICIANDO PROTOCOLO DE SESIÓN...\n▓▓▓▓▓▓▓▓░░░░  72%',
            choices: [],
            autoDelay: 2000
        },
        {
            id: 'intro_connect',
            speaker: 'SYSTEM',
            text: 'CONEXIÓN ESTABLECIDA.\nNODO ORIGEN IDENTIFICADO.',
            choices: [],
            autoDelay: 1500
        },
        {
            id: 'figure_1',
            speaker: 'FIGURE',
            text: 'Sabía que llegarías. Los paquetes de datos siempre encuentran el camino — eso los hace peligrosos.',
            choices: [
                { label: '¿Quién eres?', next: 'figure_2a' },
                { label: 'Explícate.', next: 'figure_2b' },
                { label: '[Silencio]', next: 'figure_2c' },
            ]
        },
        {
            id: 'figure_2a',
            speaker: 'FIGURE',
            text: 'Un nombre no importa aquí. Lo que importa es lo que sabes — y lo que aún no sabes que sabes.',
            choices: [{ label: '¿Qué quieres de mí?', next: 'figure_3' }]
        },
        {
            id: 'figure_2b',
            speaker: 'FIGURE',
            text: 'Muy directo. Bien. El sistema que ves en esa pantalla no es solo un juego — es una réplica. Una prueba.',
            choices: [{ label: '¿Una prueba de qué?', next: 'figure_3' }]
        },
        {
            id: 'figure_2c',
            speaker: 'FIGURE',
            text: '... Inteligente. El silencio también es información. Siéntate — hay cosas que necesitas ver.',
            choices: [{ label: '[Esperar]', next: 'figure_3' }]
        },
        {
            id: 'figure_3',
            speaker: 'FIGURE',
            text: 'El expediente que vas a investigar pertenece a una red real. Nombres reales. Crímenes reales. Todo ha sido — redactado.',
            choices: [
                { label: '¿Redactado por quién?', next: 'figure_4a' },
                { label: '¿Por qué yo?', next: 'figure_4b' },
            ]
        },
        {
            id: 'figure_4a',
            speaker: 'FIGURE',
            text: 'Por los mismos que construyeron la red. Hay actores dentro del sistema — los llaman "nodos limpios". Miente el nombre.',
            choices: [{ label: 'Continuar.', next: 'figure_5' }]
        },
        {
            id: 'figure_4b',
            speaker: 'FIGURE',
            text: 'Porque llegaste hasta aquí. La mayoría de paquetes se pierde en el laberinto. Tú no. Eso ya dice algo.',
            choices: [{ label: 'Continuar.', next: 'figure_5' }]
        },
        {
            id: 'figure_5',
            speaker: 'FIGURE',
            text: 'Tu misión: analiza la red. Clasifica las amenazas. Encuentra la ruta. Y sobre todo — no confíes en el primer camino que encuentres.',
            choices: [
                { label: 'Entendido.', next: 'figure_6' },
                { label: '¿Y si me equivoco?', next: 'figure_6alt' },
            ]
        },
        {
            id: 'figure_6alt',
            speaker: 'FIGURE',
            text: 'Entonces el expediente te lo hará saber. El karma no miente — aunque el sistema a veces sí.',
            choices: [{ label: 'Entendido.', next: 'figure_6' }]
        },
        {
            id: 'figure_6',
            speaker: 'FIGURE',
            text: 'Una última cosa.',
            choices: [],
            autoDelay: 1200
        },
        {
            id: 'figure_7',
            speaker: 'FIGURE',
            text: 'No estás solo en la red.',
            choices: [],
            autoDelay: 2500
        },
        {
            id: 'system_out',
            speaker: 'SYSTEM',
            text: 'TRANSFIRIENDO AL NODO PRINCIPAL...\nCASEFILE: REDACTED — INICIANDO.',
            choices: [],
            autoDelay: 2000
        },
        { id: '__END__', speaker: null, text: '', choices: [] }
    ];

    constructor(container, onComplete) {
        this._container = container;
        this._onComplete = onComplete;
        this._root = null;
        this._typeTimer = null;
        this._autoTimer = null;
        this._scriptMap = new Map(PhaseP2.SCRIPT.map(n => [n.id, n]));
    }

    start() {
        this._build();
        this._showNode('intro_boot');
    }

    destroy() {
        clearTimeout(this._typeTimer);
        clearTimeout(this._autoTimer);
        if (this._root) this._root.remove();
    }

    // ─────────────────────────────────────────
    // DOM BUILD

    _build() {
        this._root = document.createElement('div');
        this._root.id = 'phase-p2';
        Object.assign(this._root.style, {
            position: 'absolute', inset: '0',
            width: '100%', height: '100%',
            overflow: 'hidden',
            fontFamily: "'JetBrains Mono', monospace",
            background: '#fff'  // Start white (matches P1 exit) then video covers it
        });
        // Fade background from white to black as video loads
        setTimeout(() => { this._root.style.background = '#000'; this._root.style.transition = 'background 1.2s ease'; }, 50);

        // Background video loop
        const bg = document.createElement('video');
        bg.src = 'assets/scene2.mp4';
        bg.autoplay = true; bg.loop = true; bg.muted = true; bg.playsInline = true;
        Object.assign(bg.style, {
            position: 'absolute', inset: '0',
            width: '100%', height: '100%',
            objectFit: 'cover', zIndex: '0',
            opacity: '0',
            transform: 'scale(0.18) translateY(35%)',
            transition: 'opacity 1.0s ease, transform 1.4s cubic-bezier(0.16, 1, 0.3, 1)'
        });
        bg.addEventListener('canplay', () => {
            // Short delay so the first frame is ready before we start animating
            requestAnimationFrame(() => {
                bg.style.opacity = '0.82';
                bg.style.transform = 'scale(1) translateY(0)';
            });
        });
        // PNG fallback
        bg.addEventListener('error', () => {
            this._root.style.backgroundImage = 'url(assets/scene2.png)';
            this._root.style.backgroundSize = 'cover';
        });
        this._root.appendChild(bg);

        // Depth overlay
        const overlay = document.createElement('div');
        Object.assign(overlay.style, {
            position: 'absolute', inset: '0',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.72) 100%)',
            zIndex: '1'
        });
        this._root.appendChild(overlay);

        // Chatbox
        const box = document.createElement('div');
        box.id = 'p2-chatbox';
        Object.assign(box.style, { position: 'absolute', bottom: '0', left: '0', right: '0', zIndex: '10' });

        const nameplate = document.createElement('div');
        nameplate.id = 'p2-nameplate';
        Object.assign(nameplate.style, {
            display: 'inline-block', marginLeft: '48px', marginBottom: '-2px',
            padding: '6px 24px', background: '#00d4ff', color: '#000',
            fontWeight: '700', fontSize: '0.78rem', letterSpacing: '0.18em',
            textTransform: 'uppercase',
            clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 100%, 0 100%)',
        });

        const panel = document.createElement('div');
        panel.id = 'p2-panel';
        Object.assign(panel.style, {
            padding: '22px 48px 16px', background: 'rgba(0,8,16,0.92)',
            borderTop: '2px solid #00d4ff', minHeight: '110px', position: 'relative'
        });

        const textEl = document.createElement('div');
        textEl.id = 'p2-text';
        Object.assign(textEl.style, {
            color: '#e8f4f8', fontSize: '1rem', lineHeight: '1.65',
            minHeight: '3.3em', whiteSpace: 'pre-wrap', letterSpacing: '0.01em'
        });

        const choicesEl = document.createElement('div');
        choicesEl.id = 'p2-choices';
        Object.assign(choicesEl.style, {
            display: 'flex', gap: '12px', flexWrap: 'wrap',
            marginTop: '16px', paddingBottom: '20px'
        });

        const advEl = document.createElement('span');
        advEl.id = 'p2-advance'; advEl.textContent = '▶';
        Object.assign(advEl.style, {
            position: 'absolute', right: '40px', bottom: '20px',
            color: '#00d4ff', fontSize: '0.9rem',
            animation: 'p2-blink 0.8s step-end infinite', display: 'none'
        });

        panel.appendChild(textEl);
        panel.appendChild(choicesEl);
        panel.appendChild(advEl);
        box.appendChild(nameplate);
        box.appendChild(panel);
        this._root.appendChild(box);

        if (!document.getElementById('p2-styles')) {
            const style = document.createElement('style');
            style.id = 'p2-styles';
            style.textContent = `
                @keyframes p2-blink { 0%,100%{opacity:1} 50%{opacity:0} }
                .p2-choice {
                    background: transparent;
                    border: 1px solid rgba(0,212,255,0.5);
                    color: #00d4ff;
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 0.82rem;
                    padding: 8px 18px;
                    cursor: pointer;
                    letter-spacing: 0.08em;
                    transition: background 0.15s, color 0.15s;
                    clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%);
                }
                .p2-choice:hover { background: #00d4ff; color: #000; }
            `;
            document.head.appendChild(style);
        }

        this._container.appendChild(this._root);
    }

    // ─────────────────────────────────────────
    // DIALOGUE ENGINE

    _showNode(id) {
        clearTimeout(this._autoTimer);
        clearTimeout(this._typeTimer);

        if (id === '__END__') {
            this._exitTransition();
            return;
        }

        const node = this._scriptMap.get(id);
        if (!node) return;

        const nameEl = document.getElementById('p2-nameplate');
        const textEl = document.getElementById('p2-text');
        const choicesEl = document.getElementById('p2-choices');
        const advEl = document.getElementById('p2-advance');

        nameEl.textContent = node.speaker === 'FIGURE' ? '??? / [REDACTED]'
            : node.speaker === 'SYSTEM' ? 'SISTEMA' : '';
        nameEl.style.background = node.speaker === 'SYSTEM' ? '#ff4040' : '#00d4ff';

        choicesEl.innerHTML = '';
        advEl.style.display = 'none';
        textEl.textContent = '';

        this._typeText(textEl, node.text, () => {
            if (node.choices && node.choices.length > 0) {
                node.choices.forEach(choice => {
                    const btn = document.createElement('button');
                    btn.className = 'p2-choice';
                    btn.textContent = choice.label;
                    btn.addEventListener('click', () => {
                        clearTimeout(this._typeTimer);
                        this._showNode(choice.next);
                    });
                    choicesEl.appendChild(btn);
                });
            } else {
                const nextId = this._nextAfter(id);
                advEl.style.display = 'block';
                this._autoTimer = setTimeout(() => this._showNode(nextId), node.autoDelay ?? 2500);
            }
        });
    }

    _typeText(el, text, onDone) {
        let i = 0;
        const tick = () => {
            if (i >= text.length) { onDone(); return; }
            el.textContent += text[i++];
            this._typeTimer = setTimeout(tick, 28);
        };
        tick();
    }

    _nextAfter(id) {
        const idx = PhaseP2.SCRIPT.findIndex(n => n.id === id);
        if (idx < 0 || idx >= PhaseP2.SCRIPT.length - 1) return '__END__';
        return PhaseP2.SCRIPT[idx + 1].id;
    }

    // ─────────────────────────────────────────
    // EXIT: white radial flash → fade to black → onComplete

    _exitTransition() {
        // Hide chatbox
        const box = document.getElementById('p2-chatbox');
        if (box) box.style.transition = 'opacity 0.4s';
        if (box) box.style.opacity = '0';

        // White radial burst from center
        const flash = document.createElement('div');
        Object.assign(flash.style, {
            position: 'absolute', inset: '0', zIndex: '50',
            background: 'radial-gradient(circle at 50% 48%, #fff 0%, rgba(255,255,255,0) 60%)',
            opacity: '0', transition: 'opacity 0.5s ease'
        });
        this._root.appendChild(flash);

        requestAnimationFrame(() => {
            flash.style.opacity = '1';
            // Expand to full white
            setTimeout(() => {
                flash.style.background = '#fff';
                flash.style.transition = 'background 0.3s ease, opacity 0.6s ease';
                setTimeout(() => {
                    // Fade to black
                    flash.style.opacity = '0';
                    flash.style.background = '#000';
                    flash.style.transition = 'opacity 0.8s ease';
                    setTimeout(() => {
                        flash.style.opacity = '1';
                        setTimeout(() => { this._onComplete(); }, 800);
                    }, 300);
                }, 400);
            }, 500);
        });
    }
}