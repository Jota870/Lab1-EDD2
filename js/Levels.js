const LEVELS = [
    {
        id: 1,
        title: "Nivel 1 - Las primeras señales",
        situation: "Valeria comienza a recibir mensajes ofensivos en redes sociales. Al principio parecen bromas aisladas, pero se repiten constantemente afectando su honor.",
        objective: "Recolectar capturas, identificar al usuario y clasificar la agresión.",
        crime: "Injuria",
        law: "Artículo 220 del Código Penal Colombiano",
        penalty: "Multa o sanciones legales por afectar el buen nombre.",
        gravity: 3,
        caseId: 300,
        evidence: ["Captura de pantalla", "ID de usuario @Anonimo123"],
        image: "chat_bullying_screenshot.png",
        options: ["Injuria", "Calumnia", "Amenaza", "Acoso", "Hostigamiento", "Daño a la honra"],
        feedback: "La injuria se refiere a las ofensas que deshonran a alguien directamente (Art. 220)."
    },
    {
        id: 2,
        title: "Nivel 2 - El rumor difamatorio",
        situation: "Un mensaje anónimo se vuelve viral en el grupo del colegio: aseguran que Valeria tiene una relación secreta con uno de los profesores para subir sus notas.",
        objective: "Analizar el post viral, identificar la falsedad y clasificar el delito.",
        crime: "Calumnia",
        law: "Artículo 221 del Código Penal Colombiano",
        penalty: "Multas o sanciones por imputar falsamente una conducta deshonrosa.",
        gravity: 5,
        caseId: 500,
        evidence: ["Post de chisme viral", "Foto de Valeria (perfil)"],
        image: "valeria_oficial.png",
        options: ["Calumnia", "Injuria", "Difamación", "Falso Testimonio", "Fraude Académico", "Injuria por vía de hecho"],
        feedback: "Imputar falsamente una conducta deshonrosa (como una relación prohibida) es Calumnia (Art. 221)."
    },
    {
        id: 3,
        title: "Nivel 3 - La cuenta fantasma",
        situation: "Aparece un perfil falso que utiliza la foto de Valeria para publicar contenido ofensivo y hacer comentarios agresivos.",
        objective: "Analizar el perfil, rastrear la IP y encontrar al suplantador.",
        crime: "Suplantación de identidad",
        law: "Ley 1273 de 2009 - Delitos informáticos",
        penalty: "Sanciones penales y multas severas.",
        gravity: 8,
        caseId: 800,
        evidence: ["Perfil falso", "Dirección IP", "Foto suplantada"],
        image: "valeria_oficial.png",
        options: ["Suplantación de identidad", "Hurto de datos", "Estafa", "Acceso Abusivo", "Falsedad en documento", "Suplantación agravada"],
        feedback: "Utilizar la identidad de otro sin su consentimiento es un delito informático (Ley 1273)."
    },
    {
        id: 4,
        title: "Nivel 4 - El ataque coordinado",
        situation: "El acoso se intensifica. Varias cuentas comienzan a atacar a Valeria simultáneamente con comentarios humillantes y amenazas directas.",
        objective: "Identificar cuentas vinculadas, patrones de comportamiento y al responsable principal.",
        crime: "Hostigamiento digital",
        law: "Amenazas y hostigamiento reiterado",
        penalty: "Sanciones penales y procesos judiciales graves.",
        gravity: 10,
        caseId: 1000,
        evidence: ["Log de ataques simultáneos", "Patrón de red", "ID del cabecilla"],
        image: "valeria_oficial.png",
        options: ["Hostigamiento digital", "Amenazas", "Acoso Colectivo", "Ciberbullying", "Intimidación", "Extorsión"],
        feedback: "El hostigamiento digital coordinado busca intimidar y degradar repetidamente."
    }
];

class GameState {
    constructor() {
        this.currentLevelIndex = 0;
        this.tree = null;
        this.collectedEvidence = [];
        this.isGameOver = false;
        this.score = 0;
        this.currentStatus = 'INVESTIGATING'; // INVESTIGATING, CLASSIFYING
    }

    getCurrentLevel() {
        return LEVELS[this.currentLevelIndex];
    }

    nextLevel() {
        if (this.currentLevelIndex < LEVELS.length - 1) {
            this.currentLevelIndex++;
            this.currentStatus = 'INVESTIGATING';
            return true;
        }
        this.isGameOver = true;
        return false;
    }

    addEvidence(evidence) {
        if (!this.collectedEvidence.includes(evidence)) {
            this.collectedEvidence.push(evidence);
            this.score += 50;
            return true;
        }
        return false;
    }
}
