/**
 * VisualTree.js
 * Handles the rendering of the AVL Tree on a Canvas.
 */

class VisualTree {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.nodeRadius = 25;
        this.verticalSpacing = 80;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.canvas.height = this.canvas.parentElement.clientHeight;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    draw(tree) {
        this.clear();
        if (!tree || !tree.root) return;
        
        // Initial position for the root
        this._drawNode(tree.root, this.canvas.width / 2, 60, this.canvas.width / 4);
    }

    _drawNode(node, x, y, xOffset) {
        if (!node) return;

        // Draw connections to children
        this.ctx.strokeStyle = '#00f2ff';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);

        if (node.left) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x - xOffset, y + this.verticalSpacing);
            this.ctx.stroke();
            this._drawNode(node.left, x - xOffset, y + this.verticalSpacing, xOffset / 2);
        }

        if (node.right) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x + xOffset, y + this.verticalSpacing);
            this.ctx.stroke();
            this._drawNode(node.right, x + xOffset, y + this.verticalSpacing, xOffset / 2);
        }

        // Reset dash for the node itself
        this.ctx.setLineDash([]);

        // Draw node circle (Glow effect)
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#00f2ff';
        this.ctx.fillStyle = '#14181e';
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.nodeRadius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#00f2ff';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;

        // Draw Case ID or Level
        this.ctx.fillStyle = '#e0e6ed';
        this.ctx.font = 'bold 12px JetBrains Mono';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`ID:${node.caseId}`, x, y);
        
        // Draw gravity color overlay
        const hue = 180 - (node.gravity * 15); // blue to red
        this.ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
        this.ctx.lineWidth = 5;
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.nodeRadius - 2, 0, Math.PI * 2);
        this.ctx.stroke();
    }
}
