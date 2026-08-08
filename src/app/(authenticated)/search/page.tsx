import { SearchPage } from "@/components/workspace/search/search-page";
import { getSearchData } from "@/lib/workspace-data";

export default async function Page() {
  return <SearchPage data={await getSearchData()} />;
}
