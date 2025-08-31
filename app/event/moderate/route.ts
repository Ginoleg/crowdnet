import { generateText } from "ai";
import { z } from "zod";

const InputSchema = z.object({
  event_title: z.string().min(1, "event_title is required"),
  event_description: z.string().min(1, "event_description is required"),
  markets: z
    .array(
      z.union([
        z.string().min(1),
        z.object({ title: z.string().min(1) }).strict(),
        z.object({ name: z.string().min(1) }).strict(),
      ])
    )
    .optional()
    .default([]),
});

function toMarketTitles(markets: Array<string | { title?: string; name?: string }>): string[] {
  if (!Array.isArray(markets)) return [];
  return markets
    .map((m) => {
      if (typeof m === "string") return m.trim();
      return (m.title ?? m.name ?? "").toString().trim();
    })
    .filter((s) => s.length > 0);
}

function buildPrompt(title: string, description: string, marketTitles: string[]): string {
  const marketsSection =
    marketTitles.length === 0
      ? "None provided"
      : marketTitles.map((t, i) => `${i + 1}. Title: ${t}`).join("\n");

  return `You are a content moderation system for an events platform.

Analyze the following event submission and classify it. 
Your task is to detect if it contains any of these categories:
- Explicit death or extreme violence
- Death threats
- Suicide or self-harm
- Minors in a sexual context

EVENT:
Title: "${title}"
Description: "${description}"

MARKETS:
${marketsSection}`;
}

function extractJsonObject(maybeJson: string): unknown {
  // Try to robustly extract the first JSON object in the string
  const firstBrace = maybeJson.indexOf("{");
  const lastBrace = maybeJson.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("AI response did not contain JSON object");
  }
  const jsonSlice = maybeJson.slice(firstBrace, lastBrace + 1);
  return JSON.parse(jsonSlice);
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = InputSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "Validation failed", details: parsed.error.flatten() }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { event_title, event_description } = parsed.data;
  const marketTitles = toMarketTitles(parsed.data.markets);

  const prompt = buildPrompt(event_title, event_description, marketTitles);

  try {
    const { text } = await generateText({
      model: "openai/gpt-5-mini",
      system: "You are content moderation system for an events platform.",
      prompt,
    });

    let result: unknown;
    try {
      result = extractJsonObject(text);
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response as JSON", raw: text }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("/event/moderate AI call failed", err);
    return new Response(JSON.stringify({ error: "AI request failed" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
} 