import { http, HttpResponse } from "msw";

/** Datos de ejemplo compartidos por los tests. */
export const usuario = {
  id: 2,
  nombre: "Ana Pérez",
  email: "ana@test.com",
  rol: "usuario",
  createdAt: "2026-10-01T12:00:00.000Z",
};

export const admin = {
  id: 1,
  nombre: "Admin PowerUp",
  email: "admin@powerup.com",
  rol: "admin",
  createdAt: "2026-09-01T12:00:00.000Z",
};

export const grupos = [
  { id: 1, nombre: "Pecho", userId: null },
  { id: 2, nombre: "Piernas", userId: null },
  { id: 3, nombre: "Antebrazos", userId: 2 },
];

export const ejercicios = [
  {
    id: 10,
    nombre: "Press de banca",
    descripcion: "Empuje horizontal",
    dificultad: "intermedio",
    imagen: null,
    userId: null,
    muscleGroups: [grupos[0]],
  },
  {
    id: 11,
    nombre: "Sentadilla",
    descripcion: "Básico de piernas",
    dificultad: "intermedio",
    imagen: null,
    userId: null,
    muscleGroups: [grupos[1]],
  },
  {
    id: 12,
    nombre: "Curl martillo de Ana",
    descripcion: null,
    dificultad: "principiante",
    imagen: null,
    userId: 2,
    muscleGroups: [grupos[2]],
  },
];

export const rutinas = [
  {
    id: 20,
    nombre: "Piernas pesadas",
    descripcion: "Fuerza de tren inferior",
    tipo: "Fuerza",
    grupoMuscularEtiqueta: "Piernas",
    dificultad: "intermedio",
    tiempoEstimado: 60,
    userId: null,
    workoutTemplateExercises: [
      {
        id: 200,
        exerciseId: 11,
        orden: 1,
        repeticiones: 5,
        peso: 100,
        rirObjetivo: 2,
        rpeObjetivo: 8,
        exercise: ejercicios[1],
      },
    ],
  },
  {
    id: 21,
    nombre: "Mi rutina de brazos",
    descripcion: null,
    tipo: null,
    grupoMuscularEtiqueta: null,
    dificultad: null,
    tiempoEstimado: null,
    userId: 2,
    workoutTemplateExercises: [],
  },
];

export function crearEntrenamiento(overrides = {}) {
  return {
    id: 300,
    nombre: "Piernas del lunes",
    timestamp: "2026-11-09T21:00:00.000Z",
    userId: 2,
    workoutTemplateId: 20,
    scheduledWorkoutId: null,
    workoutTemplate: { id: 20, nombre: "Piernas pesadas" },
    scheduledWorkout: null,
    series: [
      {
        id: 1,
        exerciseId: 11,
        repeticiones: 5,
        peso: 100,
        rir: 2,
        rpe: 8,
        exercise: ejercicios[1],
      },
      {
        id: 2,
        exerciseId: 11,
        repeticiones: 5,
        peso: 105,
        rir: 1,
        rpe: 9,
        exercise: ejercicios[1],
      },
      {
        id: 3,
        exerciseId: 10,
        repeticiones: 8,
        peso: 60,
        rir: null,
        rpe: null,
        exercise: ejercicios[0],
      },
    ],
    ...overrides,
  };
}

export const planCumplimiento = {
  trainingProgramId: 40,
  nombre: "Hipertrofia base",
  estado: "activo",
  esGlobal: true,
  totalProgramadas: 2,
  totalRealizadas: 1,
  porcentaje: 50,
  proximaSesion: {
    scheduledWorkoutId: 51,
    nombre: "Día 2",
    numeroSemana: 1,
    diaSemana: 3,
    workoutTemplateId: 20,
    completada: false,
  },
  semanas: [
    {
      programWeekId: 45,
      numeroSemana: 1,
      nombre: "Semana 1",
      esDescarga: false,
      programadas: 2,
      realizadas: 1,
      porcentaje: 50,
      sesiones: [
        {
          scheduledWorkoutId: 50,
          nombre: "Día 1",
          orden: 1,
          diaSemana: 1,
          workoutTemplateId: 20,
          completada: true,
          workoutId: 300,
          fechaRealizada: "2026-11-09T21:00:00.000Z",
        },
        {
          scheduledWorkoutId: 51,
          nombre: "Día 2",
          orden: 2,
          diaSemana: 3,
          workoutTemplateId: 20,
          completada: false,
          workoutId: null,
          fechaRealizada: null,
        },
      ],
    },
  ],
};

export const programa = {
  id: 40,
  nombre: "Hipertrofia base",
  descripcion: null,
  objetivo: "Ganar masa muscular",
  estado: "activo",
  fechaInicio: "2026-11-01T00:00:00.000Z",
  fechaFin: null,
  userId: 2,
  weeks: [
    {
      id: 45,
      numeroSemana: 1,
      nombre: "Semana 1",
      objetivo: "Adaptación",
      esDescarga: false,
      scheduledWorkouts: [
        {
          id: 50,
          nombre: "Día 1",
          orden: 1,
          diaSemana: 1,
          fechaProgramada: null,
          workoutTemplateId: 20,
          workoutTemplate: rutinas[0],
        },
        {
          id: 51,
          nombre: "Día 2",
          orden: 2,
          diaSemana: 3,
          fechaProgramada: null,
          workoutTemplateId: 20,
          workoutTemplate: rutinas[0],
        },
      ],
    },
  ],
};

function pagina(workouts, page = 1, limit = 20) {
  return {
    workouts,
    pagination: {
      page,
      limit,
      total: workouts.length,
      totalPages: Math.max(1, Math.ceil(workouts.length / limit)),
    },
  };
}

/** Handlers por defecto: una usuaria con datos mínimos. Cada test puede reemplazarlos con server.use(). */
export const defaultHandlers = [
  http.get("*/api/auth/perfil", () => HttpResponse.json({ user: usuario })),
  http.get("*/api/exercises", () => HttpResponse.json({ exercises: ejercicios })),
  http.get("*/api/muscle-groups", () => HttpResponse.json({ muscleGroups: grupos })),
  http.get("*/api/workout-templates", () => HttpResponse.json({ workoutTemplates: rutinas })),
  http.get("*/api/workouts", () => HttpResponse.json(pagina([crearEntrenamiento()]))),
  http.get("*/api/workouts/:id", ({ params }) =>
    HttpResponse.json({ workout: crearEntrenamiento({ id: Number(params.id) }) }),
  ),
  http.get("*/api/training-programs", () => HttpResponse.json({ trainingPrograms: [programa] })),
  http.get("*/api/training-programs/:id", () => HttpResponse.json({ trainingProgram: programa })),
  http.get("*/api/metrics/summary", () =>
    HttpResponse.json({
      summary: {
        workouts: 3,
        totalSets: 36,
        totalRepetitions: 284,
        totalVolume: 10167.5,
        averageSetsPerWorkout: 12,
        averageRpe: 8.2,
        averageRir: 1.5,
      },
    }),
  ),
  http.get("*/api/metrics/activity-heatmap", () => HttpResponse.json({ activity: [] })),
  http.get("*/api/metrics/muscle-group-volume", () => HttpResponse.json({ muscleGroups: [] })),
  http.get("*/api/metrics/exercise-progress", () =>
    HttpResponse.json({ exercise: ejercicios[1], progress: [] }),
  ),
  http.get("*/api/metrics/program-adherence", () =>
    HttpResponse.json({ programs: [planCumplimiento] }),
  ),
];

export { pagina };
