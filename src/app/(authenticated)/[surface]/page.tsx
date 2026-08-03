import { notFound } from "next/navigation";
import { AccountSecurity } from "@/components/account-security";
import { BuildStatePage } from "@/components/build-state-page";
import { Dashboard } from "@/components/dashboard";
import { getDashboardData } from "@/lib/dashboard";
import { requireUser } from "@/lib/supabase/server";

const buildStateSurfaces = new Set(["today", "tasks", "work", "search", "people-notes", "settings"]);

export default async function SurfacePage({ params, searchParams }: { params: Promise<{ surface: string }>; searchParams: Promise<{ revoke?: string }> }) {
  const { surface } = await params;
  if (surface === "inbox") {
    const [{ user }, data] = await Promise.all([requireUser(), getDashboardData()]);
    return <Dashboard data={data} email={user?.email ?? "Signed-in account"} />;
  }
  if (!buildStateSurfaces.has(surface)) notFound();
  if (surface === "settings") {
    const { user } = await requireUser();
    if (!user) notFound();
    const providers = user.identities?.map((identity) => identity.provider) ?? [];
    return <AccountSecurity email={user.email ?? "this account"} hasEmailPassword={providers.includes("email")} hasGoogle={providers.includes("google")} revokeAfterGoogle={(await searchParams).revoke === "google"} />;
  }
  return <BuildStatePage surface={surface} />;
}
