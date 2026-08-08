import { notFound } from "next/navigation";
import { AccountSecurity } from "@/components/account-security";
import { BuildStatePage } from "@/components/build-state-page";
import { Dashboard } from "@/components/dashboard";
import { Workspace } from "@/components/workspace";
import { getDashboardData } from "@/lib/dashboard";
import { requireUser } from "@/lib/supabase/server";
import { getWorkspaceData } from "@/lib/workspace-data";

const buildStateSurfaces = new Set(["today", "tasks", "work", "retainers", "search", "people-notes", "routines", "settings"]);
const workspaceSurfaces = new Set(["today", "tasks", "work", "retainers", "search", "people-notes", "routines"]);

export default async function SurfacePage({ params, searchParams }: { params: Promise<{ surface: string }>; searchParams: Promise<{ revoke?: string }> }) {
  const { surface } = await params;
  if (surface === "inbox") return <Dashboard data={await getDashboardData()} />;
  if (!buildStateSurfaces.has(surface)) notFound();
  if (surface === "settings") {
    const { user } = await requireUser();
    if (!user) notFound();
    const providers = user.identities?.map((identity) => identity.provider) ?? [];
    return <AccountSecurity email={user.email ?? "this account"} hasEmailPassword={providers.includes("email")} hasGoogle={providers.includes("google")} revokeAfterGoogle={(await searchParams).revoke === "google"} />;
  }
  if (workspaceSurfaces.has(surface)) {
    const data = await getWorkspaceData();
    return <Workspace surface={surface as "today" | "tasks" | "work" | "retainers" | "search" | "people-notes" | "routines"} data={data} />;
  }
  return <BuildStatePage surface={surface} />;
}
