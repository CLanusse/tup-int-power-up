import { describe, expect, it } from "vitest";
import { ejercicios } from "../test/handlers";
import { createEmptyExerciseLine } from "./exerciseLineUtils";
import {
  exerciseFormToPayload,
  exerciseToForm,
  filterExercises,
  selectableExercises,
} from "./exerciseUtils";
import { canModifyResource, isAdmin, ownershipLabel } from "./permissions";
import { routineFormToPayload, routineToForm } from "./routineUtils";

const ana = { id: 2, rol: "usuario" };
const admin = { id: 1, rol: "admin" };

describe("búsqueda de ejercicios", () => {
  it("ignora mayúsculas y acentos", () => {
    expect(filterExercises(ejercicios, "BASICO", "").map((exercise) => exercise.nombre)).toEqual([
      "Sentadilla",
    ]);
  });

  it("combina dificultad y grupo muscular", () => {
    expect(
      filterExercises(ejercicios, "", "intermedio", "1").map((exercise) => exercise.nombre),
    ).toEqual(["Press de banca"]);
    expect(
      filterExercises(ejercicios, "", "principiante").map((exercise) => exercise.nombre),
    ).toEqual(["Curl martillo de Ana"]);
  });

  it("para recursos globales solo ofrece ejercicios globales", () => {
    expect(selectableExercises(ejercicios, true)).toHaveLength(2);
    expect(selectableExercises(ejercicios, false)).toHaveLength(3);
  });
});

describe("permisos en la interfaz", () => {
  it("el propietario modifica lo suyo; lo global solo el admin", () => {
    expect(canModifyResource({ userId: 2 }, ana)).toBe(true);
    expect(canModifyResource({ userId: null }, ana)).toBe(false);
    expect(canModifyResource({ userId: null }, admin)).toBe(true);
    expect(canModifyResource({ userId: 2 }, admin)).toBe(false);
    expect(isAdmin(admin)).toBe(true);
  });

  it("etiqueta el origen de cada recurso", () => {
    expect(ownershipLabel({ userId: null }, ana)).toBe("PowerUp");
    expect(ownershipLabel({ userId: 2 }, ana)).toBe("Personal");
  });
});

describe("formularios", () => {
  it("solo envía global al crear", () => {
    const form = { ...exerciseToForm(ejercicios[0]), nombre: "Press inclinado" };
    expect(form.global).toBe(true);
    expect(exerciseFormToPayload(form, { creating: true }).global).toBe(true);
    expect(exerciseFormToPayload(form, { creating: false })).not.toHaveProperty("global");
  });

  it("arma el payload de la rutina con sus ejercicios", () => {
    const form = { ...routineToForm({ nombre: "Push", userId: 2 }), tiempoEstimado: "45" };
    const payload = routineFormToPayload(form, [
      createEmptyExerciseLine({ exerciseId: "10", repeticiones: "8", peso: "60" }),
    ]);

    expect(payload).toMatchObject({
      nombre: "Push",
      tiempoEstimado: 45,
      ejercicios: [{ exerciseId: 10, repeticiones: 8, peso: 60 }],
    });
    expect(payload).not.toHaveProperty("global");
  });
});
