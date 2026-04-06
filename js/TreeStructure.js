/**
 * AVL Tree Implementation for CyberDetective Lab
 * Each node represents a cyberbullying case with exactly 5 required fields.
 */

class CaseNode {
    constructor(data) {
        // Requisitos de la captura de pantalla:
        this.caseId = data.caseId;       // 1. ID del caso
        this.type = data.type;           // 2. Tipo de acoso
        this.evidence = data.evidence;   // 3. Evidencias recolectadas
        this.law = data.law;             // 4. Ley colombiana asociada
        this.penalty = data.penalty;     // 5. Posible pena o sanción
        
        this.gravity = data.gravity;     // Criterio de organización (Gravedad)
        this.height = 1;
        this.left = null;
        this.right = null;
    }
}

class AVLTree {
    constructor() {
        this.root = null;
    }

    getHeight(node) {
        if (!node) return 0;
        return node.height;
    }

    getBalanceFactor(node) {
        if (!node) return 0;
        return this.getHeight(node.left) - this.getHeight(node.right);
    }

    updateHeight(node) {
        node.height = Math.max(this.getHeight(node.left), this.getHeight(node.right)) + 1;
    }

    rotateRight(y) {
        let x = y.left;
        let T2 = x.right;
        x.right = y;
        y.left = T2;
        this.updateHeight(y);
        this.updateHeight(x);
        return x;
    }

    rotateLeft(x) {
        let y = x.right;
        let T2 = y.left;
        y.left = x;
        x.right = T2;
        this.updateHeight(x);
        this.updateHeight(y);
        return y;
    }

    insert(data) {
        this.root = this._insertNode(this.root, data);
        return this.root;
    }

    _insertNode(node, data) {
        if (!node) return new CaseNode(data);

        // Organizado por Gravedad del delito
        if (data.gravity < node.gravity) {
            node.left = this._insertNode(node.left, data);
        } else if (data.gravity > node.gravity) {
            node.right = this._insertNode(node.right, data);
        } else {
            return node; 
        }

        this.updateHeight(node);
        let balance = this.getBalanceFactor(node);
        
        if (balance > 1 && data.gravity < node.left.gravity) {
            return this.rotateRight(node);
        }

        if (balance < -1 && data.gravity > node.right.gravity) {
            return this.rotateLeft(node);
        }

        if (balance > 1 && data.gravity > node.left.gravity) {
            node.left = this.rotateLeft(node.left);
            return this.rotateRight(node);
        }

        if (balance < -1 && data.gravity < node.right.gravity) {
            node.right = this.rotateRight(node.right);
            return this.rotateLeft(node);
        }

        return node;
    }

    getInOrder() {
        const result = [];
        this._inOrder(this.root, result);
        return result;
    }

    _inOrder(node, result) {
        if (node) {
            this._inOrder(node.left, result);
            result.push(node);
            this._inOrder(node.right, result);
        }
    }
}
