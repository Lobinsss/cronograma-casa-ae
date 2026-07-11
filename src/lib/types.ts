export type TaskState = {
  done: boolean;
  doneAt?: string;
  validated: boolean;
  validatedAt?: string;
  pagoConfirmado?: boolean;
  pagoAt?: string;
};

export type MilestoneState = {
  done: boolean;
  doneAt?: string;
};

export type FullState = {
  tasks: Record<string, TaskState>;
  milestones: Record<string, MilestoneState>;
};

export type Role = "macondo" | "cliente";

export type CommentReply = {
  id: string;
  author: Role;
  text: string;
  createdAt: string;
};

export type PlanPin = {
  id: string;
  planId: string;
  page: number;
  x: number;
  y: number;
  author: Role;
  text: string;
  createdAt: string;
  resolved: boolean;
  replies: CommentReply[];
};

export type PlanGeneralComment = {
  id: string;
  planId: string;
  page: number;
  author: Role;
  text: string;
  createdAt: string;
  replies: CommentReply[];
};

export type PlanosState = {
  pins: PlanPin[];
  generalComments: PlanGeneralComment[];
};

export type DashboardTab = "cronograma" | "planos" | "entrega";

export type InsumoStatus = "igual" | "cambio";

export type InsumoEditable = {
  status: InsumoStatus;
  nuevoConcepto?: string;
  nuevaCantidad?: number;
  comentario?: string;
};

export type InsumoAdicional = {
  id: string;
  espacio: string;
  producto: string;
  cantidad: number;
  comentario?: string;
  addedAt: string;
};

export type EntregaRecepcionState = {
  items: Record<string, InsumoEditable>;
  adicionales: InsumoAdicional[];
};

export type InsumoRow = {
  id: string;
  espacio: string;
  producto: string;
  cantidad: number;
  status: InsumoStatus;
  nuevoConcepto?: string;
  nuevaCantidad?: number;
  comentario?: string;
  isAdicional: boolean;
  preMarked: boolean;
};

export type EntregaSummary = {
  totalItems: number;
  enCambio: number;
  cantidadPlaneada: number;
  cantidadActual: number;
};

export type StageDateChange = {
  id: string;
  stageId: string;
  stageName: string;
  prevStart: string;
  prevEnd: string;
  newStart: string;
  newEnd: string;
  author: Role;
  changedAt: string;
  note?: string;
};

export type ScheduleDatesState = {
  overrides: Record<string, { start: string; end: string }>;
  history: StageDateChange[];
};

export type ScheduleStageView = {
  id: string;
  name: string;
  shortLabel: string;
  start: string;
  end: string;
  accent: string;
};

export type ScheduleView = {
  stages: ScheduleStageView[];
  rangeStart: string;
  rangeEnd: string;
  history: StageDateChange[];
};
