import { getEventById } from "@/actions/events";
import type { PolymarketMarket } from "@/types/events";
import EventClient from "./event-client";

export type PageProps = {
  params: { id: string };
};

export default async function EventPage({ params }: PageProps) {
  const { id } = params;
  const { event, error } = await getEventById(id);

  if (error) {
    return (
      <div className="max-w-5xl mx-auto py-8 text-sm text-red-600">{error}</div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-5xl mx-auto py-8 text-sm text-muted-foreground">
        Event not found.
      </div>
    );
  }

  const markets: PolymarketMarket[] = Array.isArray(event.markets)
    ? event.markets
    : [];

  return (
    <div className="font-sans items-center justify-items-center min-h-screen">
      <main className="w-full">
        <section className="w-full max-w-5xl mx-auto gap-6 py-6">
          <EventClient event={event} markets={markets} />
        </section>
      </main>
    </div>
  );
}
