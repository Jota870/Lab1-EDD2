# CyberDetective: Análisis del Código y Teoría de Grafos

````carousel
## 🕵️‍♂️ CyberDetective y los Grafos
**Aplicación Práctica de Estructuras de Datos II**

El juego "CyberDetective: El Árbol de la Verdad" no es solo una aventura interactiva. Su sistema de clasificación de crímenes cibernéticos y el reporte final están cimentados sobre una de las estructuras más importantes en la teoría de grafos: **Los Árboles**.

A continuación, explicaremos cómo cada concepto de la teoría de grafos da vida al laboratorio y **cómo lo codificamos en JavaScript (`TreeStructure.js`)**.
<!-- slide -->
## 🌳 El Árbol como un Grafo Especial
En teoría de grafos, un árbol es un grafo dirigido que es **conexo y no tiene ciclos**. En nuestro laboratorio, utilizamos un **Árbol AVL**, el cual es un árbol binario de búsqueda auto-balanceable.

¿Por qué un Árbol y no un grafo completo? Porque existe una relación estrictamente jerárquica entre los posibles crímenes (nodos), ordenados mediante un valor numérico (la gravedad de la pena).

```javascript
// La estructura principal que contiene la raíz del grafo
class AVLTree {
    constructor() {
        this.root = null; // El vértice origen
    }
    // ... métodos de mantenimiento del grafo
}
```
<!-- slide -->
## 📍 Los Vértices (Nodos del Grafo)
Cada vez que el jugador clasifica correctamente un delito, se inserta un nuevo *vértice* en el grafo. En nuestro código, esto está representado por la clase `CaseNode`.

```javascript
class CaseNode {
    constructor(data) {
        // Datos del problema (Requisitos del laboratorio)
        this.caseId = data.caseId;       
        this.type = data.type;           
        this.evidence = data.evidence;   
        this.law = data.law;             
        this.penalty = data.penalty;     
        
        // Atributo crucial para ordenar el grafo (Peso)
        this.gravity = data.gravity;     
        
        // Enlaces a grafos subyacentes (Aristas)
        this.left = null;
        this.right = null;
        this.height = 1;
    }
}
```
<!-- slide -->
## 🔗 Las Aristas y los Pesos
En nuestro Árbol AVL, los atributos espaciales `this.left` y `this.right` actúan como las **aristas direccionadas**. El factor para decidir hacia dónde se conecta la arista es el peso métrico: `gravity`.

```javascript
_insertNode(node, data) {
    if (!node) return new CaseNode(data);

    // Organizado según el peso (Gravedad del delito)
    if (data.gravity < node.gravity) {
        // La arista apunta a la sub-rama izquierda
        node.left = this._insertNode(node.left, data);
    } else if (data.gravity > node.gravity) {
        // La arista apunta a la sub-rama derecha
        node.right = this._insertNode(node.right, data);
    } else {
        return node; 
    }
    // ...
}
```
<!-- slide -->
## ⚖️ Dinamismo: Rotaciones del Grafo
Al usar un Árbol AVL, nuestro grafo realiza "rotaciones" automáticas. Esto evita que el grafo se deforme en una línea recta asimétrica si el jugador inserta crímenes progresivamente graves. 

El grafo altera dinámicamente sus aristas en base al Factor de Balance (`balance = altura_izq - altura_der`), asegurando búsqueda $O(\log n)$.

```javascript
rotateRight(y) {
    let x = y.left;       // x será la nueva raíz del subgrafo
    let T2 = x.right;     // Rama huérfana
    
    // Se invierten/reasignan las aristas
    x.right = y;          
    y.left = T2;          
    
    // Se actualizan alturas...
    return x;
}
```
<!-- slide -->
## 🚶‍♂️ Recorrido del Grafo: Creando el Reporte
Para generar el "Reporte Final" que se muestra en pantalla, usamos un algoritmo de travesía de grafos: **In-Order Traversal** (Recorrido In-Orden). 

Esto nos permite extraer los vértices de manera natural ordenados **de menor a mayor gravedad**.

```javascript
getInOrder() {
    const result = [];
    this._inOrder(this.root, result);
    return result; // Lista de vértices ordenada
}

_inOrder(node, result) {
    if (node) {
        this._inOrder(node.left, result); // 1. Visitar subgrafo izquierdo
        result.push(node);                // 2. Extraer vértice raíz
        this._inOrder(node.right, result);// 3. Visitar subgrafo derecho
    }
}
```
<!-- slide -->
## 🎯 Conclusiones del Laboratorio
La teoría de grafos encaja directamente en la implementación base del laboratorio en el archivo `TreeStructure.js`.

1. **`CaseNode`**: Nuestro estado o vértice con sus datos.
2. **` gravity`**: El peso algorítmico que define las asociaciones del grafo.
3. **Punteros `left/right`**: Las aristas dinámicas manejadas de forma recursiva por el árbol.

¡Se cumple así el objetivo pedagógico de unir la teoría con una aplicación funcional frontend! 🕵️‍♂️💻
````
