/**
 * Lanzador de Vitest.
 *
 * En Windows, si la terminal abre el proyecto como "c:\..." (unidad en minúscula,
 * como hace VS Code), Vitest carga dos copias de sí mismo y los tests fallan con
 * "Vitest failed to find the runner". Este script normaliza la unidad a mayúscula
 * y ejecuta Vitest con los mismos argumentos. En Linux/macOS no cambia nada.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";

const cwd = process.cwd().replace(/^[a-z]:/, (drive) => drive.toUpperCase());
const vitestBin = path.join(cwd, "node_modules", "vitest", "vitest.mjs");

const result = spawnSync(process.execPath, [vitestBin, ...process.argv.slice(2)], {
  cwd,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
