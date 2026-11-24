import { describe, expect, it } from "vitest";
import {
  createEmptyExerciseLine,
  hasIncompleteExerciseLines,
  hydrateExerciseLines,
  hydrateRoutineLines,
  moveExerciseLine,
  serializeExerciseLines,
  serializeRoutineLines,
  updateExerciseLine,
} from "./exerciseLineUtils";

describe("líneas de ejercicios", () => {
  it("cada línea nueva tiene una clave única", () => {
    expect(createEmptyExerciseLine().key).not.toBe(createEmptyExerciseLine().key);
  });

  it("actualiza un campo sin mutar la lista", () => {
    const lines = [createEmptyExerciseLine(), createEmptyExerciseLine()];
    const updated = updateExerciseLine(lines, 1, "peso", "50");
    expect(updated[1].peso).toBe("50");
    expect(lines[1].peso).toBe("");
  });

  it("serializa series con RIR y RPE solo si se completaron", () => {
    const lines = [
      createEmptyExerciseLine({
        exerciseId: "3",
        repeticiones: "10",
        peso: "60",
        rir: "2",
        rpe: "8.5",
      }),
      createEmptyExerciseLine({ exerciseId: "3", repeticiones: "8", peso: "" }),
    ];

    expect(serializeExerciseLines(lines)).toEqual([
      { exerciseId: 3, repeticiones: 10, peso: 60, rir: 2, rpe: 8.5 },
      { exerciseId: 3, repeticiones: 8, peso: 0 },
    ]);
  });

  it("serializa ejercicios de rutina con objetivos nulos y descarta filas vacías", () => {
    const lines = [
      createEmptyExerciseLine({
        exerciseId: "3",
        repeticiones: "5",
        peso: "100",
        rir: "2",
        rpe: "",
      }),
      createEmptyExerciseLine({ exerciseId: "4", repeticiones: "12", peso: "" }),
      createEmptyExerciseLine(),
    ];

    expect(serializeRoutineLines(lines)).toEqual([
      { exerciseId: 3, repeticiones: 5, peso: 100, rirObjetivo: 2, rpeObjetivo: null },
      { exerciseId: 4, repeticiones: 12, peso: null, rirObjetivo: null, rpeObjetivo: null },
    ]);
  });

  it("convierte series registradas y objetivos de rutina en líneas de texto", () => {
    expect(
      hydrateExerciseLines([{ exerciseId: 3, repeticiones: 10, peso: 60, rir: null, rpe: 9 }])[0],
    ).toMatchObject({
      exerciseId: "3",
      repeticiones: "10",
      peso: "60",
      rir: "",
      rpe: "9",
    });
    expect(
      hydrateRoutineLines([
        { exerciseId: 3, repeticiones: 5, peso: null, rirObjetivo: 1, rpeObjetivo: 9 },
      ])[0],
    ).toMatchObject({ exerciseId: "3", peso: "0", rir: "1", rpe: "9" });
  });

  it("detecta series incompletas", () => {
    expect(
      hasIncompleteExerciseLines([
        createEmptyExerciseLine({ exerciseId: "1", repeticiones: "5", peso: "0" }),
      ]),
    ).toBe(false);
    expect(
      hasIncompleteExerciseLines([
        createEmptyExerciseLine({ exerciseId: "1", repeticiones: "", peso: "0" }),
      ]),
    ).toBe(true);
  });

  it("reordena líneas sin salirse de los límites", () => {
    const lines = ["a", "b", "c"].map((exerciseId) => createEmptyExerciseLine({ exerciseId }));
    expect(moveExerciseLine(lines, 0, 1).map((line) => line.exerciseId)).toEqual(["b", "a", "c"]);
    expect(moveExerciseLine(lines, 0, -1)).toBe(lines);
  });
});
