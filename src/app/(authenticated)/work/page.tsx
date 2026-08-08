import { WorkPage } from "@/components/workspace/work/work-page";
import { getWorkData } from "@/lib/workspace-data";

export default async function Page() {
  return <WorkPage data={await getWorkData()} />;
}
