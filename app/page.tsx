import { getDbEvents } from "@/actions/events";
import ClientEventListEvt from "@/components/event-list-client-evt";

export default async function Home() {
  const { events, error } = await getDbEvents();

  return (
    <div className="font-sans items-center justify-items-center min-h-screen">
      <main className="w-full px-3">
        {error ? (
          <div className="w-full text-sm text-red-600">{error}</div>
        ) : (
          <section className="w-full max-w-5xl mx-auto">
            <ClientEventListEvt events={events} hrefBase="/event" />
          </section>
        )}
      </main>
    </div>
  );
}
