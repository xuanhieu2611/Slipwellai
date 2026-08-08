import { PeopleNotesPage } from "@/components/workspace/people-notes/people-notes-page";
import { getPeopleNotesData } from "@/lib/workspace-data";

export default async function Page() {
  return <PeopleNotesPage data={await getPeopleNotesData()} />;
}
