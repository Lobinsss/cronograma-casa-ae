import { getRole } from "@/lib/auth";
import LoginGate from "@/components/LoginGate";
import Dashboard from "@/components/Dashboard";

export default async function Home() {
  const role = await getRole();

  if (!role) {
    return <LoginGate />;
  }

  return <Dashboard role={role} />;
}
