export type PlanDef = {
  id: string;
  name: string;
  file: string;
};

export const PLANS: PlanDef[] = [
  { id: "arbolado", name: "Arbolado", file: "/planos/arbolado.pdf" },
  { id: "terrazas", name: "Terrazas", file: "/planos/terrazas.pdf" },
  {
    id: "arbustivo-herbaceo",
    name: "Arbustivo y herbáceo",
    file: "/planos/arbustivo-herbaceo.pdf",
  },
];

export function findPlan(id: string): PlanDef | undefined {
  return PLANS.find((p) => p.id === id);
}

export function pageKey(planId: string, page: number): string {
  return `${planId}:${page}`;
}
