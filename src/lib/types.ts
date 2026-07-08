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
