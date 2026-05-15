const pptxgen = require('pptxgenjs');
let pptx = new pptxgen();

// Slide 1: PORTADA
let slide1 = pptx.addSlide();
slide1.background = { color: '0a0c10' };
slide1.addText('CyberDetective: Analisis del Codigo \ny Teoria de Grafos', { x:1, y:1.5, fontSize:36, color:'00f2ff', bold:true, align:'center' });
slide1.addText('Aplicacion Practica de Estructuras de Datos II', { x:1, y:3.5, fontSize:20, color:'ffffff', align:'center' });


// Slide 2: El Árbol como un Grafo Especial
let slide2 = pptx.addSlide();
slide2.addText('El Arbol como un Grafo Especial', { x:0.5, y:0.5, fontSize:28, color:'0a0c10', bold:true });
slide2.addText(`En teoria de grafos, un arbol es un grafo dirigido conexo sin ciclos.
En nuestro laboratorio, utilizamos un Arbol AVL (arbol binario auto-balanceable).
Existe una relacion estrictamente jerarquica entre los posibles crimenes (nodos), ordenados mediante la gravedad de la pena.`, { x:0.5, y:1.5, w:9, fontSize:18 });
slide2.addText(`class AVLTree {
    constructor() {
        this.root = null; // El vertice origen
    }
}`, { x:0.5, y:3.5, w:9, h:1.5, fontSize:16, fontFace:'Courier New', fill:{ color:'F1F1F1' } });

// Slide 3: Los Vértices (Nodos)
let slide3 = pptx.addSlide();
slide3.addText('Los Vertices (Nodos del Grafo)', { x:0.5, y:0.5, fontSize:28, color:'0a0c10', bold:true });
slide3.addText('En nuestro codigo, esto esta representado por la clase CaseNode.', { x:0.5, y:1.5, w:9, fontSize:18 });
slide3.addText(`class CaseNode {
    constructor(data) {
        this.caseId = data.caseId;       
        this.type = data.type;           
        this.evidence = data.evidence;   
        this.gravity = data.gravity;     // Peso para ordenar!
        this.left = null;                // Arista 1
        this.right = null;               // Arista 2
    }
}`, { x:0.5, y:2.2, w:9, h:3, fontSize:16, fontFace:'Courier New', fill:{ color:'F1F1F1' } });

// Slide 4: Las Aristas y los Pesos
let slide4 = pptx.addSlide();
slide4.addText('Las Aristas y los Pesos', { x:0.5, y:0.5, fontSize:28, color:'0a0c10', bold:true });
slide4.addText(`Los atributos espaciales this.left y this.right actuan como las aristas direccionadas del grafo. 
El factor para decidir la conexion de la arista es el peso metrico: gravity.`, { x:0.5, y:1.5, w:9, fontSize:18 });
slide4.addText(`if (data.gravity < node.gravity) {
    node.left = this._insertNode(node.left, data);
} else if (data.gravity > node.gravity) {
    node.right = this._insertNode(node.right, data);
}`, { x:0.5, y:3.0, w:8.5, h:2.0, fontSize:16, fontFace:'Courier New', fill:{ color:'F1F1F1' } });

// Slide 5: Rotaciones del Grafo
let slide5 = pptx.addSlide();
slide5.addText('Dinamismo: Rotaciones del Grafo', { x:0.5, y:0.5, fontSize:28, color:'0a0c10', bold:true });
slide5.addText(`El grafo realiza "rotaciones" automaticas en base al Factor de Balance, asegurando busqueda O(log n).`, { x:0.5, y:1.5, w:9, fontSize:18 });
slide5.addText(`rotateRight(y) {
    let x = y.left;       // x sera la nueva raiz del subgrafo
    let T2 = x.right;     // Rama huerfana
    x.right = y;          
    y.left = T2;          
    return x;
}`, { x:0.5, y:2.5, w:8.5, h:2.5, fontSize:16, fontFace:'Courier New', fill:{ color:'F1F1F1' } });

// Slide 6: Recorrido del Grafo
let slide6 = pptx.addSlide();
slide6.addText('Recorrido del Grafo: Creando el Reporte', { x:0.5, y:0.5, fontSize:28, color:'0a0c10', bold:true });
slide6.addText(`Usamos el In-Order Traversal (Recorrido In-Orden). 
Permite extraer los vertices de menor a mayor gravedad de abajo hacia arriba del grafo.`, { x:0.5, y:1.5, w:9, fontSize:18 });
slide6.addText(`_inOrder(node, result) {
    if (node) {
        this._inOrder(node.left, result); // 1. Subgrafo izq
        result.push(node);                // 2. Extraer raiz
        this._inOrder(node.right, result);// 3. Subgrafo der
    }
}`, { x:0.5, y:2.7, w:8.5, h:2.3, fontSize:16, fontFace:'Courier New', fill:{ color:'F1F1F1' } });

// Slide 7: Conclusiones
let slide7 = pptx.addSlide();
slide7.background = { color: '0a0c10' };
slide7.addText('Conclusiones del Laboratorio', { x:0.5, y:0.5, fontSize:28, color:'00f2ff', bold:true });
slide7.addText(`1. CaseNode: Nuestro vertice de estado con sus datos.\n2. Gravity: El peso algoritmico que define la geometria formadora del grafo.\n3. Punteros left/right: Las aristas dinamicas manejadas de forma recursiva.`, { x:0.5, y:1.5, w:9, fontSize:20, color:'ffffff', bullet:true });
slide7.addText('¡Teoria y Practica Funcional Unificadas! 🕵️‍♂️💻', { x:0.5, y:4.0, w:9, fontSize:24, color:'00f2ff', bold:true, align:'center' });

pptx.writeFile({ fileName: 'Presentacion_Grafos_CyberDetective.pptx' }).then(fileName => {
    console.log('created: ' + fileName);
});
