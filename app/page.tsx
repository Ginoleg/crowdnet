import { getEvents } from "@/actions/events";
import ClientEventList from "@/components/event-list-client";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function Home({ searchParams = {} }: PageProps) {
  const rawSort = (searchParams?.["sort"] ?? "") as string | string[];
  const sort = Array.isArray(rawSort) ? rawSort[0] : rawSort;
  const selectedSort = sort === "new" ? "new" : "trending";
  const { events, error } = await getEvents(selectedSort);

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
