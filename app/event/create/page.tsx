import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/jwt";
import CreateEventForm from "./create-event-form";

export default async function CreateEventPage() {
  const ck = await cookies();
  const token = ck.get("session")?.value;
  if (!token) redirect("/");
  try {
    await verifySession(token);
  } catch {
    redirect("/");
  }

  return (
    <div className="font-sans items-center justify-items-center min-h-screen">
      <main className="w-full px-3">
        <section className="w-full max-w-5xl mx-auto gap-6 py-6">
          <h1 className="text-xl font-semibold mb-4">Create event</h1>
          <CreateEventForm />
        </section>
      </main>
    </div>
  );
}
