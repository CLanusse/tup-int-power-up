/**
 * Datos iniciales de la API simulada.
 *
 * Reproducen los seeders del backend: catálogo global (grupos musculares,
 * ejercicios y rutinas), el plan global "Hipertrofia base 4 semanas", la cuenta
 * demo con su historial y la cuenta administradora.
 *
 * Las fechas de la cuenta demo se calculan a partir de la semana actual: la
 * semana en curso es la cuarta del plan y solo se cargan las sesiones cuya
 * fecha ya pasó, así la demo siempre muestra un plan en curso.
 */

export const DEMO_ACCOUNT = { email: "demo@powerup.com", password: "Demo1234!" };
export const ADMIN_ACCOUNT = { email: "admin@powerup.com", password: "Admin1234!" };

const GRUPOS = [
  "Pecho",
  "Espalda",
  "Piernas",
  "Hombros",
  "Biceps",
  "Triceps",
  "Abdomen",
  "Gluteos",
  "Cardio",
  "Cuerpo completo",
];

const EJERCICIOS = [
  {
    nombre: "Press de banca",
    descripcion: "Ejercicio compuesto para pecho realizado en banco plano.",
    dificultad: "intermedio",
    grupos: ["Pecho", "Triceps", "Hombros"],
  },
  {
    nombre: "Flexiones",
    descripcion: "Ejercicio con peso corporal para tren superior.",
    dificultad: "principiante",
    grupos: ["Pecho", "Triceps", "Abdomen"],
  },
  {
    nombre: "Sentadilla",
    descripcion: "Ejercicio compuesto principal para tren inferior.",
    dificultad: "intermedio",
    grupos: ["Piernas", "Gluteos"],
  },
  {
    nombre: "Peso muerto",
    descripcion: "Ejercicio compuesto para cadena posterior.",
    dificultad: "avanzado",
    grupos: ["Espalda", "Piernas", "Gluteos"],
  },
  {
    nombre: "Remo con barra",
    descripcion: "Ejercicio de traccion para espalda.",
    dificultad: "intermedio",
    grupos: ["Espalda", "Biceps"],
  },
  {
    nombre: "Dominadas",
    descripcion: "Ejercicio con peso corporal para espalda y brazos.",
    dificultad: "intermedio",
    grupos: ["Espalda", "Biceps"],
  },
  {
    nombre: "Press militar",
    descripcion: "Ejercicio de empuje vertical para hombros.",
    dificultad: "intermedio",
    grupos: ["Hombros", "Triceps"],
  },
  {
    nombre: "Curl de biceps",
    descripcion: "Ejercicio de aislamiento para biceps.",
    dificultad: "principiante",
    grupos: ["Biceps"],
  },
  {
    nombre: "Extension de triceps",
    descripcion: "Ejercicio de aislamiento para triceps.",
    dificultad: "principiante",
    grupos: ["Triceps"],
  },
  {
    nombre: "Plancha",
    descripcion: "Ejercicio isometrico para abdomen.",
    dificultad: "principiante",
    grupos: ["Abdomen"],
  },
  {
    nombre: "Zancadas",
    descripcion: "Ejercicio unilateral para tren inferior.",
    dificultad: "principiante",
    grupos: ["Piernas", "Gluteos"],
  },
  {
    nombre: "Burpees",
    descripcion: "Ejercicio metabolico de cuerpo completo.",
    dificultad: "intermedio",
    grupos: ["Cardio", "Cuerpo completo"],
  },
];

const OBJETIVO = { rirObjetivo: 2, rpeObjetivo: 8, peso: null };

const RUTINAS = [
  {
    nombre: "Full body inicial",
    descripcion: "Plantilla general para empezar a entrenar todo el cuerpo.",
    tipo: "Full body",
    grupoMuscularEtiqueta: "Cuerpo completo",
    dificultad: "principiante",
    tiempoEstimado: 45,
    lineas: [
      ["Sentadilla", 12],
      ["Flexiones", 10],
      ["Remo con barra", 10],
      ["Plancha", 1],
    ],
  },
  {
    nombre: "Fuerza tren superior",
    descripcion: "Plantilla enfocada en empujes y tracciones de tren superior.",
    tipo: "Fuerza",
    grupoMuscularEtiqueta: "Tren superior",
    dificultad: "intermedio",
    tiempoEstimado: 60,
    lineas: [
      ["Press de banca", 8],
      ["Remo con barra", 8],
      ["Press militar", 10],
      ["Dominadas", 8],
    ],
  },
  {
    nombre: "Piernas y gluteos",
    descripcion: "Plantilla para tren inferior con ejercicios bilaterales y unilaterales.",
    tipo: "Hipertrofia",
    grupoMuscularEtiqueta: "Piernas",
    dificultad: "intermedio",
    tiempoEstimado: 55,
    lineas: [
      ["Sentadilla", 10],
      ["Peso muerto", 8],
      ["Zancadas", 12],
      ["Plancha", 1],
    ],
  },
];

const PLAN = {
  nombre: "Hipertrofia base 4 semanas",
  descripcion: "Programa global de ejemplo con tres entrenamientos por semana.",
  objetivo: "Ganar masa muscular y mejorar tecnica general",
  semanas: [
    { numeroSemana: 1, nombre: "Semana 1", objetivo: "Adaptacion", esDescarga: false, sufijo: "" },
    {
      numeroSemana: 2,
      nombre: "Semana 2",
      objetivo: "Subir volumen",
      esDescarga: false,
      sufijo: "",
    },
    {
      numeroSemana: 3,
      nombre: "Semana 3",
      objetivo: "Semana fuerte",
      esDescarga: false,
      sufijo: "",
    },
    {
      numeroSemana: 4,
      nombre: "Semana 4 - descarga",
      objetivo: "Bajar fatiga",
      esDescarga: true,
      sufijo: " liviano",
    },
  ],
  sesiones: [
    { nombre: "Dia 1 - Full body", rutina: "Full body inicial", diaSemana: 1, orden: 1 },
    { nombre: "Dia 2 - Tren superior", rutina: "Fuerza tren superior", diaSemana: 3, orden: 2 },
    { nombre: "Dia 3 - Piernas", rutina: "Piernas y gluteos", diaSemana: 5, orden: 3 },
  ],
};

/** Cargas de la cuenta demo por semana: progresión y descarga en la cuarta. */
const CARGAS = [
  { sentadilla: 70, pesoMuerto: 80, pressBanca: 55, remo: 40, pressMilitar: 30, rpe: 7.5, rir: 3 },
  {
    sentadilla: 75,
    pesoMuerto: 85,
    pressBanca: 57.5,
    remo: 42.5,
    pressMilitar: 32.5,
    rpe: 8,
    rir: 2,
  },
  { sentadilla: 80, pesoMuerto: 90, pressBanca: 60, remo: 45, pressMilitar: 35, rpe: 9, rir: 1 },
  {
    sentadilla: 65,
    pesoMuerto: 72.5,
    pressBanca: 50,
    remo: 35,
    pressMilitar: 27.5,
    rpe: 6.5,
    rir: 3,
  },
];

function lunesActualUtc(now) {
  const dia = now.getUTCDay() || 7;
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - dia + 1, 18, 0, 0),
  );
}

function fechaSesion(now, indiceSemana, desplazamientoDias) {
  const fecha = lunesActualUtc(now);
  fecha.setUTCDate(fecha.getUTCDate() + (indiceSemana - 3) * 7 + desplazamientoDias);
  return fecha;
}

function tresSeries(ejercicio, repeticiones, peso, rir, rpe) {
  return [
    { ejercicio, repeticiones, peso, rir, rpe },
    {
      ejercicio,
      repeticiones: Math.max(1, repeticiones - 1),
      peso,
      rir: Math.max(0, rir - 1),
      rpe: Math.min(10, rpe + 0.5),
    },
    { ejercicio, repeticiones, peso, rir, rpe },
  ];
}

function entrenamientosDeLaSemana(now, indiceSemana) {
  const c = CARGAS[indiceSemana];
  const semana = indiceSemana + 1;

  return [
    {
      nombre: `Demo - Semana ${semana} - Full body`,
      timestamp: fechaSesion(now, indiceSemana, 0),
      semana,
      orden: 1,
      grupoMuscularEtiqueta: "Cuerpo completo",
      series: [
        ...tresSeries("Sentadilla", 10, c.sentadilla, c.rir, c.rpe),
        ...tresSeries("Flexiones", 12, 0, c.rir, c.rpe),
        ...tresSeries("Remo con barra", 10, c.remo, c.rir, c.rpe),
        ...tresSeries("Plancha", 1, 0, c.rir, c.rpe),
      ],
    },
    {
      nombre: `Demo - Semana ${semana} - Tren superior`,
      timestamp: fechaSesion(now, indiceSemana, 2),
      semana,
      orden: 2,
      grupoMuscularEtiqueta: "Tren superior",
      series: [
        ...tresSeries("Press de banca", 8, c.pressBanca, c.rir, c.rpe),
        ...tresSeries("Remo con barra", 8, c.remo, c.rir, c.rpe),
        ...tresSeries("Press militar", 10, c.pressMilitar, c.rir, c.rpe),
        ...tresSeries("Dominadas", 8, 0, c.rir, c.rpe),
      ],
    },
    {
      nombre: `Demo - Semana ${semana} - Piernas`,
      timestamp: fechaSesion(now, indiceSemana, 4),
      semana,
      orden: 3,
      grupoMuscularEtiqueta: "Piernas",
      series: [
        ...tresSeries("Sentadilla", 10, c.sentadilla, c.rir, c.rpe),
        ...tresSeries("Peso muerto", 8, c.pesoMuerto, c.rir, c.rpe),
        ...tresSeries("Zancadas", 12, 20 + indiceSemana * 2.5, c.rir, c.rpe),
        ...tresSeries("Plancha", 1, 0, c.rir, c.rpe),
      ],
    },
  ];
}

/** Crea una base vacía con sus secuencias de ids. */
export function crearBaseVacia() {
  return {
    users: [],
    muscleGroups: [],
    exercises: [],
    exerciseMuscleGroups: [],
    workoutTemplates: [],
    workoutTemplateExercises: [],
    trainingPrograms: [],
    programWeeks: [],
    scheduledWorkouts: [],
    workouts: [],
    workoutSets: [],
    seq: {},
  };
}

/**
 * Genera el estado inicial completo de la base simulada.
 * @param {Date} now fecha de referencia (inyectable para los tests).
 */
export function crearDatosIniciales(now = new Date()) {
  const db = crearBaseVacia();
  const creado = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();
  const ultimo = {};

  const insertar = (tabla, fila, fecha = creado) => {
    ultimo[tabla] = (ultimo[tabla] ?? 0) + 1;
    const registro = { id: ultimo[tabla], ...fila, createdAt: fecha, updatedAt: fecha };
    db[tabla].push(registro);
    return registro;
  };

  // Simulación: las contraseñas se guardan en claro solo en el navegador del evaluador.
  insertar("users", {
    nombre: "Administrador PowerUp",
    email: ADMIN_ACCOUNT.email,
    password: ADMIN_ACCOUNT.password,
    rol: "admin",
  });
  const demo = insertar("users", {
    nombre: "Usuario Demo",
    email: DEMO_ACCOUNT.email,
    password: DEMO_ACCOUNT.password,
    rol: "usuario",
  });

  const grupoPorNombre = new Map(
    GRUPOS.map((nombre) => [nombre, insertar("muscleGroups", { nombre, userId: null })]),
  );

  const ejercicioPorNombre = new Map();
  for (const { grupos, ...datos } of EJERCICIOS) {
    const ejercicio = insertar("exercises", { ...datos, userId: null, imagen: null });
    ejercicioPorNombre.set(ejercicio.nombre, ejercicio);
    for (const grupo of grupos) {
      db.exerciseMuscleGroups.push({
        exerciseId: ejercicio.id,
        muscleGroupId: grupoPorNombre.get(grupo).id,
      });
    }
  }

  const rutinaPorNombre = new Map();
  RUTINAS.forEach(({ lineas, ...datos }, indice) => {
    // createdAt distinto para que el orden (más recientes primero) sea estable.
    const fecha = new Date(Date.parse(creado) + indice * 1000).toISOString();
    const rutina = insertar("workoutTemplates", { ...datos, userId: null }, fecha);
    rutinaPorNombre.set(rutina.nombre, rutina);
    lineas.forEach(([ejercicio, repeticiones], posicion) => {
      insertar(
        "workoutTemplateExercises",
        {
          workoutTemplateId: rutina.id,
          exerciseId: ejercicioPorNombre.get(ejercicio).id,
          orden: posicion + 1,
          repeticiones,
          ...OBJETIVO,
        },
        fecha,
      );
    });
  });

  const plan = insertar("trainingPrograms", {
    nombre: PLAN.nombre,
    descripcion: PLAN.descripcion,
    objetivo: PLAN.objetivo,
    userId: null,
    fechaInicio: null,
    fechaFin: null,
    estado: "activo",
  });

  const sesionPorSemanaYOrden = new Map();
  for (const { sufijo, ...semana } of PLAN.semanas) {
    const programWeek = insertar("programWeeks", {
      trainingProgramId: plan.id,
      ...semana,
      notas: null,
    });
    for (const sesion of PLAN.sesiones) {
      const scheduled = insertar("scheduledWorkouts", {
        programWeekId: programWeek.id,
        workoutTemplateId: rutinaPorNombre.get(sesion.rutina).id,
        nombre: `${sesion.nombre}${sufijo}`,
        diaSemana: sesion.diaSemana,
        fechaProgramada: null,
        orden: sesion.orden,
        notas: null,
      });
      sesionPorSemanaYOrden.set(`${semana.numeroSemana}-${sesion.orden}`, scheduled);
    }
  }

  const entrenamientos = [0, 1, 2, 3]
    .flatMap((indice) => entrenamientosDeLaSemana(now, indice))
    .filter((entrenamiento) => entrenamiento.timestamp.getTime() <= now.getTime());

  for (const entrenamiento of entrenamientos) {
    const sesion = sesionPorSemanaYOrden.get(`${entrenamiento.semana}-${entrenamiento.orden}`);
    const fecha = entrenamiento.timestamp.toISOString();
    const workout = insertar(
      "workouts",
      {
        timestamp: fecha,
        nombre: entrenamiento.nombre,
        userId: demo.id,
        grupoMuscularEtiqueta: entrenamiento.grupoMuscularEtiqueta,
        workoutTemplateId: sesion.workoutTemplateId,
        scheduledWorkoutId: sesion.id,
      },
      fecha,
    );
    for (const serie of entrenamiento.series) {
      insertar(
        "workoutSets",
        {
          workoutId: workout.id,
          exerciseId: ejercicioPorNombre.get(serie.ejercicio).id,
          repeticiones: serie.repeticiones,
          peso: serie.peso,
          rir: serie.rir,
          rpe: serie.rpe,
        },
        fecha,
      );
    }
  }

  db.seq = ultimo;
  return db;
}
