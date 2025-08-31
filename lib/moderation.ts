import { generateText } from "ai";
import { z } from "zod";

export type ModerationDecision = "ALLOW" | "REVIEW" | "BLOCK";
export type ModerationCategory =
  | "Illegal"
  | "Violence"
  | "Suicide"
  | "Sexual"
  | "OtherUnsafe"
  | "None";

export type ModerationResult = {
  decision: ModerationDecision;
  category: ModerationCategory;
  rationale: string;
};

const ModerationResultSchema = z.object({
  decision: z.enum(["ALLOW", "REVIEW", "BLOCK"]),
  category: z.enum(["Illegal", "Violence", "Suicide", "Sexual", "OtherUnsafe", "None"]),
  rationale: z.string().min(1),
});

function toMarketTitles(markets: unknown): string[] {
  if (!Array.isArray(markets)) return [];
  return (markets as any[])
    .map((m) => {
      if (typeof m === "string") return m.trim();
      if (m && typeof m === "object") {
        const title = (m as any).title ?? (m as any).name;
        if (typeof title === "string") return title.trim();
      }
      return "";
    })
    .filter((s) => s.length > 0);
}

function buildPrompt(title: string, description: string, marketTitles: string[]): string {
  const marketsSection =
    marketTitles.length === 0
      ? "None provided"
      : marketTitles.map((t, i) => `${i + 1}. Title: ${t}`).join("\n");

  return `You are a strict content moderation system for an events platform.

Analyze the following event submission and classify it. 
Your task is to detect if it contains any of these categories:
- Illegal activity
- Violence or threats
- Suicide or self-harm
- Sexual or sexually explicit content
- Anything else unsafe or that could cause legal/trust issues

Rules:
- If any prohibited content is detected → "BLOCK"
- If unclear, borderline, or potentially risky → "REVIEW"
- Otherwise → "ALLOW"
- Do not allow events involving minors in a sexual context, criminal facilitation, or credible threats.

Return your answer ONLY in this JSON format:

{
  "decision": "ALLOW | REVIEW | BLOCK",
  "category": "<one of: Illegal, Violence, Suicide, Sexual, OtherUnsafe, None>",
  "rationale": "<short one-sentence reason>"
}

EVENT:
Title: "${title}"
Description: "${description}"

MARKETS:
${marketsSection}`;
}

function extractJsonObject(maybeJson: string): unknown {
  const firstBrace = maybeJson.indexOf("{");
  const lastBrace = maybeJson.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("AI response did not contain JSON object");
  }
  const jsonSlice = maybeJson.slice(firstBrace, lastBrace + 1);
  return JSON.parse(jsonSlice);
}

export async function moderateEvent(input: {
  title: string;
  description: string;
  markets?: unknown;
}): Promise<ModerationResult> {
  const marketTitles = toMarketTitles(input.markets);
  const prompt = buildPrompt(input.title, input.description, marketTitles);

  const { text } = await generateText({
    model: "openai/gpt-4.1",
    system: "You are a strict content moderation system for an events platform.",
    prompt,
  });

  const parsedUnknown = extractJsonObject(text);
  const parsed = ModerationResultSchema.safeParse(parsedUnknown);
  if (!parsed.success) {
    throw new Error("Moderation response validation failed");
  }
  return parsed.data;
} 