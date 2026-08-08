import { TodayPage } from "@/components/workspace/today/today-page";
import { getTodayData } from "@/lib/workspace-data";

export default async function Page() {
  return <TodayPage data={await getTodayData()} />;
}
