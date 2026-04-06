/**
 * AVL Tree Implementation for CyberDetective Lab
 * Each node represents a cyberbullying case.
 */

class CaseNode {
    constructor(data) {
        this.caseId = data.caseId; // Used as the key for BST (Severity or ID)
        this.type = data.type;
        this.evidence = data.evidence || [];
        this.law = data.law;
        this.penalty = data.penalty;
        this.gravity = data.gravity; // Gravity factor (1-10)
        this.description = data.description;
        
        this.height = 1;
        this.left = null;
        this.right = null;

        // Position for visual rendering
        this.x = 0;
        this.y = 0;
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

        // Perform rotation
        x.right = y;
        y.left = T2;

        // Update heights
        this.updateHeight(y);
        this.updateHeight(x);

        return x; // New root
    }

    rotateLeft(x) {
        let y = x.right;
        let T2 = y.left;

        // Perform rotation
        y.left = x;
        x.right = T2;

        // Update heights
        this.updateHeight(x);
        this.updateHeight(y);

        return y; // New root
    }

    insert(data) {
        this.root = this._insertNode(this.root, data);
        return this.root;
    }

    _insertNode(node, data) {
        if (!node) return new CaseNode(data);

        if (data.caseId < node.caseId) {
            node.left = this._insertNode(node.left, data);
        } else if (data.caseId > node.caseId) {
            node.right = this._insertNode(node.right, data);
        } else {
            return node; 
        }

        this.updateHeight(node);
        let balance = this.getBalanceFactor(node);
        
        if (balance > 1 && data.caseId < node.left.caseId) {
            return this.rotateRight(node);
        }

        if (balance < -1 && data.caseId > node.right.caseId) {
            return this.rotateLeft(node);
        }

        if (balance > 1 && data.caseId > node.left.caseId) {
            node.left = this.rotateLeft(node.left);
            return this.rotateRight(node);
        }

        if (balance < -1 && data.caseId < node.right.caseId) {
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
