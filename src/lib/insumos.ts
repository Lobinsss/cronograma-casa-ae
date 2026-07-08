import fs from "fs";
import path from "path";
import crypto from "crypto";

export type InsumoBase = {
  id: string;
  espacio: string;
  producto: string;
  productoRaw: string;
  cantidad: number;
  preMarkedCambio: boolean;
  notaCsv?: string;
};

const CAMBIO_PATTERN = /\s*\/\s*(SE QUITA|SE CAMBIA|CAMBIAR POR.*)$/i;

function stripPrefix(raw: string): string {
  return raw.replace(/^BAC\s*-\s*CASA\s*E\s*\/\s*/i, "").trim();
}

function parseProducto(raw: string): {
  producto: string;
  preMarkedCambio: boolean;
  notaCsv?: string;
} {
  const withoutPrefix = stripPrefix(raw);
  const match = withoutPrefix.match(CAMBIO_PATTERN);
  if (match && match.index !== undefined) {
    return {
      producto: withoutPrefix.slice(0, match.index).trim(),
      preMarkedCambio: true,
      notaCsv: match[1].trim(),
    };
  }
  return { producto: withoutPrefix, preMarkedCambio: false };
}

function parseCantidad(raw: string): number {
  const normalized = raw.trim().replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

function makeId(espacio: string, productoRaw: string): string {
  return crypto
    .createHash("sha256")
    .update(`${espacio}|${productoRaw}`)
    .digest("hex")
    .slice(0, 12);
}

/** Parsea una línea CSV respetando campos entre comillas. */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

let cached: InsumoBase[] | null = null;

export function loadInsumos(): InsumoBase[] {
  if (cached) return cached;

  const filePath = path.join(process.cwd(), "data", "casa-e-cantidades.csv");
  const raw = fs.readFileSync(filePath, "utf-8");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());

  const items: InsumoBase[] = [];
  for (let i = 1; i < lines.length; i++) {
    const [espacio, productoRaw, cantidadRaw] = parseCsvLine(lines[i]);
    if (!espacio || !productoRaw) continue;

    const parsed = parseProducto(productoRaw);
    items.push({
      id: makeId(espacio.trim(), productoRaw.trim()),
      espacio: espacio.trim(),
      producto: parsed.producto,
      productoRaw: productoRaw.trim(),
      cantidad: parseCantidad(cantidadRaw ?? "0"),
      preMarkedCambio: parsed.preMarkedCambio,
      notaCsv: parsed.notaCsv,
    });
  }

  cached = items;
  return items;
}

export function espaciosOrdenados(items: InsumoBase[]): string[] {
  const seen = new Set<string>();
  const order: string[] = [];
  for (const item of items) {
    if (!seen.has(item.espacio)) {
      seen.add(item.espacio);
      order.push(item.espacio);
    }
  }
  return order;
}

export function findInsumo(id: string): InsumoBase | undefined {
  return loadInsumos().find((i) => i.id === id);
}
