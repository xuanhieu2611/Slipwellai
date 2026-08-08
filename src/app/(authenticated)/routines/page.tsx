import { RoutinesPage } from "@/components/workspace/routines/routines-page";
import { getRoutinesData } from "@/lib/workspace-data";

export default async function Page() {
  return <RoutinesPage data={await getRoutinesData()} />;
}
