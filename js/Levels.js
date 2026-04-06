const LEVELS = [
    {
        id: 1,
        title: "Nivel 1 - Las primeras señales",
        situation: "Valeria comienza a recibir mensajes ofensivos en redes sociales. Al principio parecen bromas aisladas, pero se repiten constantemente.",
        objective: "Recolectar capturas, identificar al usuario y clasificar la agresión.",
        crime: "Injuria",
        law: "Artículo 220 del Código Penal Colombiano",
        penalty: "Multa o sanciones legales por afectar el buen nombre.",
        gravity: 3,
        caseId: 300,
        evidence: ["Captura de pantalla", "ID de usuario @Anonimo123"],
        image: "chat_bullying_screenshot.png",
        options: ["Injuria", "Calumnia", "Amenaza"],
        feedback: "La injuria se refiere a las ofensas que deshonran a alguien directamente, mientras que la calumnia es una acusación falsa de un delito."
    },
    {
        id: 2,
        title: "Nivel 2 - El rumor viral",
        situation: "Empiezan a circular publicaciones falsas sobre Valeria en redes sociales. Otros estudiantes comparten rumores que dañan su reputación.",
        objective: "Identificar la publicación original, rastrear al iniciador y determinar veracidad.",
        crime: "Calumnia",
        law: "Artículo 221 del Código Penal Colombiano",
        penalty: "Multas o sanciones por difundir acusaciones falsas.",
        gravity: 5,
        caseId: 500,
        evidence: ["Publicación viral", "Testimonio del iniciador"],
        image: "viral_rumor_post.png",
        options: ["Injuria", "Calumnia", "Acoso"],
        feedback: "Al difundir rumores falsos para dañar la reputación, estamos ante un caso de calumnia bajo el Art. 221."
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
        image: "fake_profile_screenshot.png",
        options: ["Hurto calificado", "Suplantación de identidad", "Injuria"],
        feedback: "Utilizar la identidad de otro sin su consentimiento es un delito informático grave bajo la Ley 1273 de 2009."
    },
    {
        id: 4,
        title: "Nivel 4 - El ataque coordinado",
        situation: "El acoso se intensifica. Varias cuentas comienzan a atacar a Valeria simultáneamente con comentarios humillantes.",
        objective: "Identificar cuentas vinculadas, patrones de comportamiento y al responsable principal.",
        crime: "Hostigamiento digital",
        law: "Amenazas y hostigamiento reiterado",
        penalty: "Sanciones penales y procesos judiciales graves.",
        gravity: 10,
        caseId: 1000,
        evidence: ["Log de ataques simultáneos", "Patrón de red", "ID del cabecilla"],
        image: "coordinated_attack_logs.png",
        options: ["Hurto", "Hostigamiento digital", "Suplantación"],
        feedback: "El hostigamiento digital coordinado busca intimidar y degradar a la víctima repetidamente. Puede ser causal de cárcel."
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
