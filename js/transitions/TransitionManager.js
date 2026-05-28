// TransitionManager.js
// Intro:  P1 (maze) → diegetic logo zoom → P2 (video + dialogue) → white flash to black → main menu
// Outro:  final report closed → fade to black → scene2.png → scene2-end.png crossfade → fade to black → main menu

class TransitionManager {

    constructor() {
        this._overlay = null;
        this._p1 = null;
        this._p2 = null;
    }

    // ─────────────────────────────────────────
    // INTRO — called by GameController.init() before its own setup

    init() {
        this._buildOverlay();
        this._p1 = new PhaseP1(this._overlay, () => this._onP1Complete());
        this._p1.start();
    }

    _onP1Complete() {
        // P1 artifact pickup already plays the logo zoom → white flash internally.
        // TransitionManager just waits for the callback then hands to P2.
        if (this._p1) { this._p1.destroy(); this._p1 = null; }
        // Brief black pause before P2 fades in
        setTimeout(() => {
            this._p2 = new PhaseP2(this._overlay, () => this._onP2Complete());
            this._p2.start();
        }, 300);
    }

    _onP2Complete() {
        // PhaseP2._exitTransition() already handled white→black internally.
        // Tear down overlay and signal GameController.
        if (this._p2) { this._p2.destroy(); this._p2 = null; }
        this._teardownOverlay();
        document.dispatchEvent(new CustomEvent('intro:complete'));
    }

    // ─────────────────────────────────────────
    // OUTRO — called by GameController after final report is dismissed

    playOutro(onDone) {
        // Build a fresh fullscreen overlay for the epilogue
        const el = document.createElement('div');
        el.id = 'outro-overlay';
        Object.assign(el.style, {
            position: 'fixed', inset: '0', background: '#000',
            zIndex: '1000', overflow: 'hidden', opacity: '0',
            transition: 'opacity 0.8s ease'
        });
        document.body.appendChild(el);

        // scene2.png layer
        const imgA = document.createElement('img');
        imgA.src = 'assets/scene2.png';
        Object.assign(imgA.style, {
            position: 'absolute', inset: '0', width: '100%', height: '100%',
            objectFit: 'cover', opacity: '0', transition: 'opacity 1s ease'
        });
        el.appendChild(imgA);

        // scene2-end.png layer (cross-fades over scene2)
        const imgB = document.createElement('img');
        imgB.src = 'assets/scene2-end.png';
        Object.assign(imgB.style, {
            position: 'absolute', inset: '0', width: '100%', height: '100%',
            objectFit: 'cover', opacity: '0', transition: 'opacity 1.4s ease'
        });
        el.appendChild(imgB);

        // Sequence
        requestAnimationFrame(() => {
            // 1. Fade overlay in (black)
            el.style.opacity = '1';
            setTimeout(() => {
                // 2. Fade in scene2.png
                imgA.style.opacity = '1';
                setTimeout(() => {
                    // 3. Cross-fade to scene2-end.png
                    imgB.style.opacity = '1';
                    setTimeout(() => {
                        // 4. Fade everything to black
                        imgA.style.opacity = '0';
                        imgB.style.opacity = '0';
                        el.style.background = '#000';
                        setTimeout(() => {
                            // 5. Clean up and loop back
                            el.remove();
                            if (onDone) onDone();
                        }, 1000);
                    }, 3000);   // hold scene2-end for 3s
                }, 2500);       // hold scene2 for 2.5s
            }, 600);            // black pause before first image
        });
    }

    // ─────────────────────────────────────────
    // DOM HELPERS

    _buildOverlay() {
        this._overlay = document.createElement('div');
        this._overlay.id = 'intro-overlay';
        Object.assign(this._overlay.style, {
            position: 'fixed', inset: '0',
            width: '100%', height: '100%',
            background: '#000', zIndex: '1000', overflow: 'hidden'
        });
        document.body.appendChild(this._overlay);
    }

    _teardownOverlay() {
        if (this._overlay) { this._overlay.remove(); this._overlay = null; }
    }
}