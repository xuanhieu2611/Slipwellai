import { AccountSecurity } from "@/components/account-security";
import { requireUser } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function Page({ searchParams }: { searchParams: Promise<{ revoke?: string }> }) {
  const { user } = await requireUser();
  if (!user) notFound();
  const providers = user.identities?.map((identity) => identity.provider) ?? [];
  return (
    <AccountSecurity
      email={user.email ?? "this account"}
      hasEmailPassword={providers.includes("email")}
      hasGoogle={providers.includes("google")}
      revokeAfterGoogle={(await searchParams).revoke === "google"}
    />
  );
}
