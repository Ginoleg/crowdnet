import { getEvents, type EventsCategory } from "@/actions/events";
import ClientEventList from "@/components/event-list-client";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Home({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const rawSort = (params["sort"] ?? "") as string | string[];
  const sort = Array.isArray(rawSort) ? rawSort[0] : rawSort;
  const selectedSort = sort === "new" ? "new" : "trending";

  const rawCategory = (params["category"] ?? "") as string | string[];
  const categoryParam = (
    Array.isArray(rawCategory) ? rawCategory[0] : rawCategory
  )?.toLowerCase();

  const allowedSet = new Set([
    "all",
    "politics",
    "sports",
    "crypto",
    "tech",
    "economy",
    "culture",
  ]);
  const selectedCategory = (
    allowedSet.has(categoryParam || "")
      ? (categoryParam as EventsCategory)
      : undefined
  ) as EventsCategory | undefined;

  const rawQ = (params["q"] ?? "") as string | string[];
  const q = Array.isArray(rawQ) ? rawQ[0] : rawQ;

  const { events, error } = await getEvents(selectedSort, {
    category: selectedCategory,
    q,
  });

  return (
    <div className="font-sans items-center justify-items-center min-h-screen">
      <main className="w-full px-3">
        {error ? (
          <div className="w-full text-sm text-red-600">{error}</div>
        ) : (
          <section className="w-full max-w-5xl mx-auto">
            <ClientEventList events={events} />
          </section>
        )}
      </main>
    </div>
  );
}
