import { notFound } from "next/navigation";
import { BuildStatePage } from "@/components/build-state-page";
import { Dashboard } from "@/components/dashboard";
import { getDashboardData } from "@/lib/dashboard";
import { requireUser } from "@/lib/supabase/server";

const buildStateSurfaces = new Set(["today", "tasks", "work", "search", "people-notes", "settings"]);

export default async function SurfacePage({ params }: { params: Promise<{ surface: string }> }) {
  const { surface } = await params;
  if (surface === "inbox") {
    const [{ user }, data] = await Promise.all([requireUser(), getDashboardData()]);
    return <Dashboard data={data} email={user?.email ?? "Signed-in account"} />;
  }
  if (!buildStateSurfaces.has(surface)) notFound();
  return <BuildStatePage surface={surface} />;
}
