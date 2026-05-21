// tree.js
// Based upon the old TreeStructure.js
// HAS: nearly everything the same with a few changes, with a new insert function added. - EJ

class TreeNode {
    constructor(data) {
        this.caseId = data.id;            // maps from node.id
        this.type = data.crimeConfig ? data.crimeConfig.label : "Limpio";
        this.evidence = data.evidence || [];
        this.law = data.crimeConfig ? data.crimeConfig.law : "N/A";
        this.penalty = data.crimeConfig ? data.crimeConfig.penalty : "N/A";
        this.gravity = data.gravity;
        this.name = data.name;
        this.height = 1;
        this.left = null;
        this.right = null;
    }
}

class AVLTree {
    constructor() {
        this.root = null;
    }

    // ─────────────────────────────────────────
    // AVL STRUCTURE

    _height(node) {
        return node ? node.height : 0;
    }

    _balanceFactor(node) {
        return node ? this._height(node.left) - this._height(node.right) : 0;
    }

    _updateHeight(node) {
        node.height = Math.max(this._height(node.left), this._height(node.right)) + 1;
    }

    _rotateRight(y) {
        const x = y.left;
        const T2 = x.right;
        x.right = y;
        y.left = T2;
        this._updateHeight(y);
        this._updateHeight(x);
        return x;
    }

    _rotateLeft(x) {
        const y = x.right;
        const T2 = y.left;
        y.left = x;
        x.right = T2;
        this._updateHeight(x);
        this._updateHeight(y);
        return y;
    }

    _compare(data, node) {
        if (data.gravity !== node.gravity) {
            return data.gravity - node.gravity;
        }
        return data.id - node.caseId;
    }

    _insert(node, data) {
        if (!node) return new TreeNode(data);

        const cmp = this._compare(data, node);
        if (cmp < 0) {
            node.left = this._insert(node.left, data);
        } else if (cmp > 0) {
            node.right = this._insert(node.right, data);
        } else {
            return node; // duplicate caseId = skip
        }

        this._updateHeight(node);
        const balance = this._balanceFactor(node);

        if (balance > 1 && this._compare(data, node.left) < 0)     // LL
            return this._rotateRight(node);
        if (balance < -1 && this._compare(data, node.right) > 0)   // RR
            return this._rotateLeft(node);
        if (balance > 1 && this._compare(data, node.left) > 0) {   // LR
            node.left = this._rotateLeft(node.left);
            return this._rotateRight(node);
        }
        if (balance < -1 && this._compare(data, node.right) < 0) { // RL
            node.right = this._rotateRight(node.right);
            return this._rotateLeft(node);
        }
        return node;
    }

    _inOrder(node, result) {
        if (node) {
            this._inOrder(node.left, result);
            result.push(node);
            this._inOrder(node.right, result);
        }
    }

    // NEW FUNCTIONS
    // Used for inserting classified (visited) nodes into the tree, to replace them.
    insertNode(gameNode) {
        this.root = this._insert(this.root, gameNode);
    }

    // Returns all node in ascending order for the final report.
    getInOrder() {
        const result = [];
        this._inOrder(this.root, result);
        return result;
    }

    getBFSOrder() {
        if (!this.root) return [];
        const queue = [this.root];
        const result = [];
        while (queue.length > 0) {
            const curr = queue.shift();
            result.push(curr.caseId);
            if (curr.left) queue.push(curr.left);
            if (curr.right) queue.push(curr.right);
        }
        return result;
    }

    getDFSOrder() {
        const result = [];
        const _dfs = (node) => {
            if (!node) return;
            result.push(node.caseId); // Pre-order
            _dfs(node.left);
            _dfs(node.right);
        };
        _dfs(this.root);
        return result;
    }
}