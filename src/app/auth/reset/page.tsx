import { redirect } from "next/navigation";
import { ResetPassword } from "@/components/reset-password";
import { requireUser } from "@/lib/supabase/server";

export default async function ResetPasswordPage() {
  const { user } = await requireUser();
  if (!user) redirect("/?auth=recovery_required");
  return <ResetPassword />;
}
