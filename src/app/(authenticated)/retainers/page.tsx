import { RetainersPage } from "@/components/workspace/retainers/retainers-page";
import { getRetainersData } from "@/lib/workspace-data";

export default async function Page() {
  return <RetainersPage data={await getRetainersData()} />;
}
