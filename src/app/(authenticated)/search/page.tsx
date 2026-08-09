import { SearchPage } from "@/components/workspace/search/search-page";
import { getConfigValue } from "@/lib/config";
import { appConfigReader } from "@/lib/supabase/app-config-repository";
import { getSearchData } from "@/lib/workspace-data";

export default async function Page() {
  const [data, resultLimit] = await Promise.all([
    getSearchData(),
    getConfigValue(appConfigReader, "search.result_limit"),
  ]);
  return <SearchPage data={data} resultLimit={resultLimit} />;
}
