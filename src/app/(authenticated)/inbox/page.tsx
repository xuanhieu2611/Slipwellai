import { InboxPage } from "@/components/inbox/inbox-page";
import { getDashboardData } from "@/lib/dashboard";

export default async function Page() {
  return <InboxPage data={await getDashboardData()} />;
}
