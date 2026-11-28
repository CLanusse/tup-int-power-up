import { describe, expect, it } from "vitest";
import { crearEntrenamiento, ejercicios } from "../test/handlers";
import {
  buildMuscleGroupChartData,
  filterExercisesByMuscleGroup,
  groupSetsByExercise,
  summarizeProgress,
  summarizeWorkout,
} from "./progressUtils";

describe("resúmenes de entrenamiento", () => {
  it("totaliza series, repeticiones, volumen y RPE promedio", () => {
    expect(summarizeWorkout(crearEntrenamiento())).toEqual({
      totalSets: 3,
      totalRepetitions: 18,
      totalVolume: 500 + 525 + 480,
      averageRpe: 8.5,
    });
  });

  it("agrupa series por ejercicio con su volumen y mejor 1RM (Epley)", () => {
    const [sentadilla, banca] = groupSetsByExercise(crearEntrenamiento().series);

    expect(sentadilla).toMatchObject({ nombre: "Sentadilla", volume: 1025 });
    expect(sentadilla.sets).toHaveLength(2);
    expect(sentadilla.bestOneRepMax).toBeCloseTo(105 * (1 + 5 / 30));
    expect(banca.nombre).toBe("Press de banca");
  });

  it("resume la evolución de un ejercicio en el período", () => {
    const progress = [
      { maxWeight: 80, estimatedOneRepMax: 100 },
      { maxWeight: 90, estimatedOneRepMax: 110 },
    ];
    expect(summarizeProgress(progress)).toEqual({
      sessions: 2,
      bestOneRepMax: 110,
      weightChange: 10,
    });
    expect(summarizeProgress([])).toBeNull();
  });
});

describe("gráficos", () => {
  it("filtra ejercicios por grupo muscular", () => {
    expect(
      filterExercisesByMuscleGroup(ejercicios, "2").map((exercise) => exercise.nombre),
    ).toEqual(["Sentadilla"]);
    expect(filterExercisesByMuscleGroup(ejercicios, "")).toHaveLength(3);
  });

  it("prepara los datos del volumen por grupo muscular", () => {
    const data = buildMuscleGroupChartData([{ nombre: "Piernas", totalVolume: 1000 }]);
    expect(data.labels).toEqual(["Piernas"]);
    expect(data.datasets[0].data).toEqual([1000]);
  });
});
