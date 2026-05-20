// SoundController.js
// Based upon the old spaghetii code inside the previous index.html -EJ
// HAS: all audio playbacks, including a sound map for future additions.

/*  Sound map:
 *  menu_open      → mission-tracker-btn, report-btn
 *  menu_close     → close-modal
 *  sound_manual   → help-btn, legal-btn
 *  sound_analyze  → next-action-btn (Analizar Pruebas), run-algo-btn
 *  sound_proof    → evidence-tag click
 *  sound_correct  → crime-btn ONLY IF correct
 *  sound_incorrect→ crime-btn ONLY IF incorrect
 *  sound_next     → difficulty selected (_diffSelect)
 *  sound_start    → start-btn
 *  sound_finish   → null (reserved)
 */

class SoundController {
    constructor() {
        this._base = 'assets/';
        this._sounds = {};
        this._muted = false;
        this._load();
    }

    // ─────────────────────────────────────────
    // INIT

    _load() {
        const files = [
            'menu_open',
            'menu_close',
            'sound_manual',
            'sound_analyze',
            'sound_proof',
            'sound_correct',
            'sound_incorrect',
            'sound_next',
            'sound_start',
            'sound_finish'
        ];

        for (const name of files) {
            const audio = new Audio(`${this._base}${name}.mp3`);
            audio.preload = 'auto';
            this._sounds[name] = audio;
        }
    }

    // ─────────────────────────────────────────
    // PUBLIC PLAY METHODS

    playMenuOpen() { this._play('menu_open'); }
    playMenuClose() { this._play('menu_close'); }
    playManual() { this._play('sound_manual'); }
    playAnalyze() { this._play('sound_analyze'); }
    playProof() { this._play('sound_proof'); }
    playCorrect() { this._play('sound_correct'); }
    playIncorrect() { this._play('sound_incorrect'); }
    playNext() { this._play('sound_next'); }
    playStart() { this._play('sound_start'); }
    playFinish() { this._play('sound_finish'); }

    // ─────────────────────────────────────────
    // MUTE TOGGLE

    toggleMute() {
        this._muted = !this._muted;
        return this._muted;
    }

    isMuted() {
        return this._muted;
    }

    // ─────────────────────────────────────────
    // INTERNAL

    _play(name) {
        if (this._muted) return;
        const sound = this._sounds[name];
        if (!sound) {
            console.warn(`[SoundController] Sound not found: ${name}`);
            return;
        }
        sound.currentTime = 0;
        sound.play().catch(() => { // Autoplay policy, browser blocked it, silently ignore
        });
    }
}