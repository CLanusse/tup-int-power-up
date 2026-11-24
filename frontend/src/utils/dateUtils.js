function pad(value) {
  return String(value).padStart(2, "0");
}

/** Zona horaria IANA del navegador, por ejemplo "America/Argentina/Buenos_Aires". */
export function getBrowserTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/**
 * Fecha calendario local (YYYY-MM-DD).
 * No usa toISOString(): esa conversión pasa a UTC y, en Argentina, después de
 * las 21:00 devolvía el día siguiente.
 */
export function toLocalDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function toInputDate(date) {
  return toLocalDateKey(date);
}

/** Valor para <input type="datetime-local"> en hora local. */
export function toDateTimeLocalInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${toLocalDateKey(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function isToday(timestamp, referenceDate = new Date()) {
  return toLocalDateKey(new Date(timestamp)) === toLocalDateKey(referenceDate);
}

/** Rango [from, to] en ISO que cubre los días locales completos. */
export function toApiDateRange(from, to) {
  return {
    from: new Date(`${from}T00:00:00`).toISOString(),
    to: new Date(`${to}T23:59:59.999`).toISOString(),
  };
}

export function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(timestamp) {
  return new Date(timestamp).toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function formatLongDate(timestamp) {
  return new Date(timestamp).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Formatea una fecha sin hora guardada como YYYY-MM-DD... sin correrla de día. */
export function formatDateOnly(timestamp) {
  const [year, month, day] = String(timestamp).slice(0, 10).split("-").map(Number);

  if (!year || !month || !day) {
    return "Fecha no disponible";
  }

  return new Date(year, month - 1, day).toLocaleDateString("es-AR");
}

export function getWeekRange(referenceDate = new Date()) {
  const day = referenceDate.getDay() || 7;
  const from = new Date(referenceDate);
  from.setDate(referenceDate.getDate() - day + 1);
  from.setHours(0, 0, 0, 0);

  const to = new Date(from);
  to.setDate(from.getDate() + 6);
  to.setHours(23, 59, 59, 999);

  return { from: from.toISOString(), to: to.toISOString() };
}

/** Los 7 días de la semana (lunes a domingo) con la actividad de cada uno. */
export function getWeekDays(activity, referenceDate = new Date()) {
  const weekStart = new Date(getWeekRange(referenceDate).from);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    const key = toLocalDateKey(date);
    return { date, data: activity.find((entry) => entry.date === key) };
  });
}
