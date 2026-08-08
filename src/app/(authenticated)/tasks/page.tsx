import { TasksPage } from "@/components/workspace/tasks/tasks-page";
import { getTasksData } from "@/lib/workspace-data";

export default async function Page() {
  return <TasksPage data={await getTasksData()} />;
}
