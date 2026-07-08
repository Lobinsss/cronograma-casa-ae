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

export type DashboardTab = "cronograma" | "planos";
