// Datos base del cronograma de obra — Casa AE
// Fechas calculadas en días hábiles (L-V), excluyendo festivos oficiales mexicanos.

export type Task = {
  id: string;
  label: string;
  requiresClientValidation?: boolean;
  requiresPayment?: boolean;
};

export type Stage = {
  id: string;
  name: string;
  shortLabel: string;
  start: string; // ISO date
  end: string; // ISO date
  accent: string; // css var name
  tasks: Task[];
};

export type Milestone = {
  id: string;
  label: string;
  date: string; // ISO date
};

export const STAGES: Stage[] = [
  {
    id: "riego",
    name: "Riego",
    shortLabel: "RIEGO",
    start: "2026-07-06",
    end: "2026-07-24",
    accent: "var(--stage-riego)",
    tasks: [
      { id: "riego-1", label: "Colocación de controlador" },
      { id: "riego-2", label: "Colocación de relay de arranque" },
      { id: "riego-3", label: "Cableado de válvulas solenoides" },
      { id: "riego-4", label: "Derivación de troncal principal" },
      { id: "riego-5", label: "Derivación de ramales" },
      { id: "riego-6", label: "Tendido de manguera con microaspersión" },
      { id: "riego-7", label: "Colocación de aspersores" },
      { id: "riego-8", label: "Calibración y programación de sistema de riego" },
    ],
  },
  {
    id: "suministro",
    name: "Suministro",
    shortLabel: "SUMINISTRO",
    start: "2026-07-13",
    end: "2026-07-17",
    accent: "var(--stage-suministro)",
    tasks: [
      { id: "sum-1", label: "Entrega de sustrato (4 camiones de 14m³)" },
      { id: "sum-2", label: "Entrega de tezontle (1 camión de 14m³)" },
      { id: "sum-3", label: "Entrega de mulch natural (2 camiones de 14m³)" },
      { id: "sum-4", label: "Entrega de arbolado" },
      { id: "sum-5", label: "Entrega de arbustos y herbáceas" },
    ],
  },
  {
    id: "plantacion",
    name: "Plantación",
    shortLabel: "PLANTACIÓN",
    start: "2026-07-15",
    end: "2026-07-29",
    accent: "var(--stage-plantacion)",
    tasks: [
      {
        id: "plant-1",
        label: "Colocación de arbolado",
        requiresClientValidation: true,
      },
      { id: "plant-2", label: "Excavación de cepas para arbolado" },
      {
        id: "plant-3",
        label: "Plantación de arbolado y plantas de gran formato",
      },
      {
        id: "plant-4",
        label: "Colocación de arbustos y herbáceas",
        requiresClientValidation: true,
      },
      { id: "plant-5", label: "Plantación general" },
      {
        id: "plant-6",
        label: "Entrega de obra",
        requiresClientValidation: true,
        requiresPayment: true,
      },
    ],
  },
];

export const MILESTONES: Milestone[] = [
  { id: "visita-1", label: "Visita de mantenimiento 1 de 3", date: "2026-08-31" },
  { id: "visita-2", label: "Visita de mantenimiento 2 de 3", date: "2026-09-29" },
  { id: "visita-3", label: "Visita de mantenimiento 3 de 3", date: "2026-10-29" },
];

export function allTaskIds(): string[] {
  return STAGES.flatMap((s) => s.tasks.map((t) => t.id));
}

export function allMilestoneIds(): string[] {
  return MILESTONES.map((m) => m.id);
}

export function findTask(taskId: string): { stage: Stage; task: Task } | null {
  for (const stage of STAGES) {
    const task = stage.tasks.find((t) => t.id === taskId);
    if (task) return { stage, task };
  }
  return null;
}
