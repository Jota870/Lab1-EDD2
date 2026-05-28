// PhaseP1.js
// 2D top-down Atari-style grid maze.
// Canvas fills the viewport dynamically — no fixed pixel dimensions.
// Player spawns from black (Hollow Knight style), navigates procedural Room 1,
// enters fixed Room 2, touches artifact → diegetic logo zoom → onComplete().

class PhaseP1 {

    static TILE = 32;
    static COLS = 40;
    static ROWS = 24;

    static COLOR = {
        BG: '#000',
        WALL: '#0a2a3a',
        WALL_GLOW: '#00d4ff',
        FLOOR: '#050f18',
        PACKET: '#00ffcc',
        ARTIFACT: '#ffffff',
        GRID_LINE: 'rgba(0,212,255,0.06)',
        VIGNETTE_INNER: 'rgba(0,0,0,0)',
        VIGNETTE_OUTER: 'rgba(0,0,0,0.88)',
    };

    static ROOM_SPLIT = 25;

    // 0=floor, 1=wall, 2=artifact
    static ROOM2_MAP = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1],
        [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
        [1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1],
        [1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1],
        [1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1],
        [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
        [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];

    // ─────────────────────────────────────────

    constructor(container, onComplete) {
        this._container = container;
        this._onComplete = onComplete;
        this._canvas = null;
        this._ctx = null;
        this._grid = [];
        this._player = { gx: 1, gy: 1 };
        this._artifact = null;
        this._spawnAlpha = 0;      // 0→1 fade-in from black
        this._frameId = null;
        this._keys = {};
        this._lastMove = 0;
        this._artPulse = 0;
        this._complete = false;
        this._onKey = null;
        this._onResize = null;
    }

    start() {
        this._canvas = document.createElement('canvas');
        Object.assign(this._canvas.style, {
            display: 'block',
            position: 'absolute',
            inset: '0',
            width: '100%',
            height: '100%',
        });
        this._container.appendChild(this._canvas);
        this._ctx = this._canvas.getContext('2d');

        // Size canvas to actual pixels
        this._resize();
        this._onResize = () => this._resize();
        window.addEventListener('resize', this._onResize);

        this._buildGrid();

        this._onKey = (e) => { this._keys[e.code] = (e.type === 'keydown'); };
        window.addEventListener('keydown', this._onKey);
        window.addEventListener('keyup', this._onKey);

        this._loop(performance.now());
    }

    destroy() {
        cancelAnimationFrame(this._frameId);
        window.removeEventListener('keydown', this._onKey);
        window.removeEventListener('keyup', this._onKey);
        window.removeEventListener('resize', this._onResize);
        if (this._canvas) this._canvas.remove();
    }

    // ─────────────────────────────────────────
    // SIZING — canvas resolution matches viewport

    _resize() {
        this._canvas.width = this._container.clientWidth || window.innerWidth;
        this._canvas.height = this._container.clientHeight || window.innerHeight;
    }

    // Derived dimensions from current canvas size
    get _W() { return this._canvas.width; }
    get _H() { return this._canvas.height; }

    // Tile size scales so the full grid fits the canvas
    get _tileW() { return this._W / PhaseP1.COLS; }
    get _tileH() { return this._H / PhaseP1.ROWS; }

    // ─────────────────────────────────────────
    // GRID GENERATION

    _buildGrid() {
        const { COLS, ROWS, ROOM_SPLIT, ROOM2_MAP } = PhaseP1;
        this._grid = Array.from({ length: ROWS }, () => new Array(COLS).fill(1));

        this._carveMaze(1, 1, ROOM_SPLIT - 1, ROWS - 2);

        // Paste Room 2 first — THEN punch the corridor so Room2's border can't seal it
        for (let r = 0; r < ROOM2_MAP.length; r++) {
            for (let c = 0; c < ROOM2_MAP[r].length; c++) {
                const gx = ROOM_SPLIT + c;
                const gy = r;
                const val = ROOM2_MAP[r][c];
                if (val === 2) {
                    this._grid[gy][gx] = 0;
                    this._artifact = { gx, gy };
                } else {
                    this._grid[gy][gx] = val;
                }
            }
        }

        // Exit corridor Room1 → Room2: punch AFTER Room2 paste so border wall can't re-seal it
        // Open 3 rows tall so the player can't get stuck on a single-cell gap
        const exitRow = Math.floor(ROWS / 2);
        for (let dy = -1; dy <= 1; dy++) {
            const ey = exitRow + dy;
            if (ey < 1 || ey >= ROWS - 1) continue;
            this._grid[ey][ROOM_SPLIT - 1] = 0;   // last cell of Room 1
            this._grid[ey][ROOM_SPLIT] = 0;   // first cell of Room 2 (border override)
        }

        this._player = { gx: 1, gy: 1 };
        this._grid[1][1] = 0;
    }

    _carveMaze(x1, y1, x2, y2) {
        // Fill all as wall first
        for (let y = y1; y <= y2; y++)
            for (let x = x1; x <= x2; x++)
                this._grid[y][x] = 1;

        const cellCols = [], cellRows = [];
        const startX = x1 % 2 === 0 ? x1 + 1 : x1;
        const startY = y1 % 2 === 0 ? y1 + 1 : y1;
        for (let x = startX; x <= x2; x += 2) cellCols.push(x);
        for (let y = startY; y <= y2; y += 2) cellRows.push(y);
        if (!cellCols.length || !cellRows.length) return;

        const key = (x, y) => `${x},${y}`;
        const visited = new Set();
        const stack = [{ x: cellCols[0], y: cellRows[0] }];
        visited.add(key(cellCols[0], cellRows[0]));
        this._grid[cellRows[0]][cellCols[0]] = 0;

        const dirs = [{ dx: 2, dy: 0 }, { dx: -2, dy: 0 }, { dx: 0, dy: 2 }, { dx: 0, dy: -2 }];

        while (stack.length) {
            const cur = stack[stack.length - 1];
            const shuffled = dirs.slice().sort(() => Math.random() - 0.5);
            let moved = false;
            for (const d of shuffled) {
                const nx = cur.x + d.dx, ny = cur.y + d.dy;
                if (cellCols.includes(nx) && cellRows.includes(ny) && !visited.has(key(nx, ny))) {
                    this._grid[cur.y + d.dy / 2][cur.x + d.dx / 2] = 0;
                    this._grid[ny][nx] = 0;
                    visited.add(key(nx, ny));
                    stack.push({ x: nx, y: ny });
                    moved = true;
                    break;
                }
            }
            if (!moved) stack.pop();
        }
    }

    // ─────────────────────────────────────────
    // LOOP

    _loop(now) {
        this._frameId = requestAnimationFrame((t) => this._loop(t));
        this._update(now);
        this._draw();
    }

    _update(now) {
        // Hollow Knight spawn fade: 0→1 over ~1.5s
        if (this._spawnAlpha < 1) {
            this._spawnAlpha = Math.min(1, this._spawnAlpha + 0.010);
        }
        this._artPulse += 0.05;
        if (this._complete) return;

        if (now - this._lastMove < 120) return;

        let dx = 0, dy = 0;
        if (this._keys['ArrowUp'] || this._keys['KeyW']) dy = -1;
        if (this._keys['ArrowDown'] || this._keys['KeyS']) dy = 1;
        if (this._keys['ArrowLeft'] || this._keys['KeyA']) dx = -1;
        if (this._keys['ArrowRight'] || this._keys['KeyD']) dx = 1;
        if (!dx && !dy) return;

        const nx = this._player.gx + dx;
        const ny = this._player.gy + dy;
        if (this._isFloor(nx, ny)) {
            this._player.gx = nx;
            this._player.gy = ny;
            this._lastMove = now;

            if (this._artifact && nx === this._artifact.gx && ny === this._artifact.gy) {
                this._complete = true;
                this._triggerArtifactPickup();
            }
        }
    }

    _isFloor(gx, gy) {
        const { COLS, ROWS } = PhaseP1;
        if (gx < 0 || gy < 0 || gx >= COLS || gy >= ROWS) return false;
        return this._grid[gy][gx] === 0;
    }

    // ─────────────────────────────────────────
    // ARTIFACT PICKUP → logo zoom to white → black → onComplete

    _triggerArtifactPickup() {
        const flash = document.createElement('div');
        Object.assign(flash.style, {
            position: 'fixed', inset: '0', zIndex: '2000',
            background: '#000', opacity: '0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'opacity 0.5s ease'
        });

        const logo = document.createElement('img');
        logo.src = 'assets/casefilelogo-transparent.png';
        Object.assign(logo.style, {
            width: '28%', opacity: '0',
            transition: 'opacity 0.35s ease 0.15s, transform 1.3s cubic-bezier(0.2,0,0.5,1) 0.15s',
            transform: 'scale(1)'
        });

        flash.appendChild(logo);
        document.body.appendChild(flash);

        // Fade overlay in from black
        requestAnimationFrame(() => {
            flash.style.opacity = '1';
            setTimeout(() => {
                // Logo appears
                logo.style.opacity = '1';
                setTimeout(() => {
                    // Logo zooms to fill screen — stays white, hand off to P2
                    logo.style.transform = 'scale(22)';
                    logo.style.opacity = '0';
                    flash.style.background = '#fff';
                    setTimeout(() => {
                        // Stay white — P2 will fade in over this
                        flash.remove();
                        this._onComplete();
                    }, 800);
                }, 500);
            }, 400);
        });
    }

    // ─────────────────────────────────────────
    // DRAW

    _draw() {
        const ctx = this._ctx;
        const { COLS, ROWS, ROOM_SPLIT, COLOR } = PhaseP1;
        const W = this._W, H = this._H;
        const tW = this._tileW, tH = this._tileH;

        // Everything drawn at spawn alpha (fade in from black)
        ctx.save();
        ctx.globalAlpha = this._spawnAlpha;

        // Background
        ctx.fillStyle = COLOR.BG;
        ctx.fillRect(0, 0, W, H);

        // Subtle grid lines
        ctx.strokeStyle = COLOR.GRID_LINE;
        ctx.lineWidth = 0.5;
        for (let c = 0; c <= COLS; c++) {
            ctx.beginPath(); ctx.moveTo(c * tW, 0); ctx.lineTo(c * tW, H); ctx.stroke();
        }
        for (let r = 0; r <= ROWS; r++) {
            ctx.beginPath(); ctx.moveTo(0, r * tH); ctx.lineTo(W, r * tH); ctx.stroke();
        }

        // Tiles
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const x = c * tW, y = r * tH;
                if (this._grid[r][c] === 1) {
                    ctx.fillStyle = COLOR.WALL;
                    ctx.fillRect(x, y, tW, tH);
                    ctx.strokeStyle = COLOR.WALL_GLOW;
                    ctx.lineWidth = 0.7;
                    ctx.strokeRect(x + 0.5, y + 0.5, tW - 1, tH - 1);
                } else {
                    ctx.fillStyle = COLOR.FLOOR;
                    ctx.fillRect(x, y, tW, tH);
                }
            }
        }

        // Room split hint
        ctx.strokeStyle = 'rgba(0,212,255,0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ROOM_SPLIT * tW, 0);
        ctx.lineTo(ROOM_SPLIT * tW, H);
        ctx.stroke();

        // Artifact — pulsing white diamond
        if (this._artifact && !this._complete) {
            const ax = this._artifact.gx * tW + tW / 2;
            const ay = this._artifact.gy * tH + tH / 2;
            const pulse = 5 + Math.sin(this._artPulse) * 3;

            const grd = ctx.createRadialGradient(ax, ay, 0, ax, ay, pulse * 3);
            grd.addColorStop(0, 'rgba(255,255,255,0.55)');
            grd.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = grd;
            ctx.beginPath(); ctx.arc(ax, ay, pulse * 3, 0, Math.PI * 2); ctx.fill();

            ctx.fillStyle = COLOR.ARTIFACT;
            ctx.beginPath();
            ctx.moveTo(ax, ay - pulse);
            ctx.lineTo(ax + pulse, ay);
            ctx.lineTo(ax, ay + pulse);
            ctx.lineTo(ax - pulse, ay);
            ctx.closePath(); ctx.fill();
        }

        // Player — cyan square + radial glow
        const px = this._player.gx * tW + tW / 2;
        const py = this._player.gy * tH + tH / 2;
        const ps = Math.min(tW, tH) * 0.36;

        const pgrd = ctx.createRadialGradient(px, py, 0, px, py, ps * 2.8);
        pgrd.addColorStop(0, 'rgba(0,255,204,0.32)');
        pgrd.addColorStop(1, 'rgba(0,255,204,0)');
        ctx.fillStyle = pgrd;
        ctx.beginPath(); ctx.arc(px, py, ps * 2.8, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = COLOR.PACKET;
        ctx.fillRect(px - ps, py - ps, ps * 2, ps * 2);

        // Vignette centered on player
        const diag = Math.sqrt(W * W + H * H);
        // Tight vignette — small clear zone, aggressively dark past it
        const vgrd = ctx.createRadialGradient(px, py, diag * 0.10, px, py, diag * 0.38);
        vgrd.addColorStop(0, 'rgba(0,0,0,0)');
        vgrd.addColorStop(0.5, 'rgba(0,0,0,0.6)');
        vgrd.addColorStop(1, 'rgba(0,0,0,0.97)');
        ctx.fillStyle = vgrd;
        ctx.fillRect(0, 0, W, H);

        // Controls hint during spawn
        if (this._spawnAlpha < 0.95) {
            ctx.fillStyle = `rgba(0,212,255,${0.6 * this._spawnAlpha})`;
            ctx.font = `${Math.max(11, tH * 0.38)}px JetBrains Mono, monospace`;
            ctx.textAlign = 'center';
            ctx.fillText('WASD / ↑↓←→  MOVER', W / 2, H - tH * 0.4);
        }

        ctx.restore();
    }
}