import { describe, expect, it } from "vitest";
import {
  formatDateOnly,
  getWeekDays,
  getWeekRange,
  isToday,
  toApiDateRange,
  toDateTimeLocalInput,
  toInputDate,
  toLocalDateKey,
} from "./dateUtils";

describe("fechas locales", () => {
  it("toInputDate usa la fecha local y no la de UTC", () => {
    // 23:30 hora local: con toISOString() en UTC-3 daría el día siguiente.
    const lateNight = new Date(2026, 10, 16, 23, 30);
    expect(toInputDate(lateNight)).toBe("2026-11-16");
  });

  it("formatea valores para datetime-local", () => {
    expect(toDateTimeLocalInput(new Date(2026, 0, 5, 7, 3))).toBe("2026-01-05T07:03");
    expect(toDateTimeLocalInput(null)).toBe("");
    expect(toDateTimeLocalInput("no-es-fecha")).toBe("");
  });

  it("detecta si una fecha es de hoy", () => {
    const ref = new Date(2026, 10, 16, 12);
    expect(isToday(new Date(2026, 10, 16, 23, 59), ref)).toBe(true);
    expect(isToday(new Date(2026, 10, 17, 0, 1), ref)).toBe(false);
  });

  it("muestra fechas sin hora sin correrlas de día", () => {
    expect(formatDateOnly("2026-11-01T00:00:00.000Z")).toBe(
      new Date(2026, 10, 1).toLocaleDateString("es-AR"),
    );
    expect(formatDateOnly("")).toBe("Fecha no disponible");
  });

  it("convierte un rango de días locales en instantes ISO", () => {
    const range = toApiDateRange("2026-11-01", "2026-11-30");
    expect(new Date(range.from)).toEqual(new Date(2026, 10, 1, 0, 0, 0));
    expect(new Date(range.to)).toEqual(new Date(2026, 10, 30, 23, 59, 59, 999));
  });
});

describe("semana actual", () => {
  it("va de lunes a domingo", () => {
    const { from, to } = getWeekRange(new Date(2026, 10, 18)); // miércoles
    expect(new Date(from)).toEqual(new Date(2026, 10, 16, 0, 0, 0, 0));
    expect(new Date(to)).toEqual(new Date(2026, 10, 22, 23, 59, 59, 999));
  });

  it("un domingo pertenece a la semana que empezó el lunes anterior", () => {
    const { from } = getWeekRange(new Date(2026, 10, 22));
    expect(new Date(from)).toEqual(new Date(2026, 10, 16, 0, 0, 0, 0));
  });

  it("asocia la actividad a cada día por fecha local", () => {
    const days = getWeekDays([{ date: "2026-11-18", setCount: 12 }], new Date(2026, 10, 18));
    expect(days).toHaveLength(7);
    expect(toLocalDateKey(days[0].date)).toBe("2026-11-16");
    expect(days[2].data).toEqual({ date: "2026-11-18", setCount: 12 });
    expect(days[3].data).toBeUndefined();
  });
});
