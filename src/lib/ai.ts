import Anthropic from "@anthropic-ai/sdk";

export const aiConfigured = !!process.env.ANTHROPIC_API_KEY;
export const anthropic = aiConfigured
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  : null;

export type AiTask =
  | "property_description"
  | "lead_reply"
  | "market_price"
  | "lead_match"
  | "complex_reply";

export function pickModel(task: AiTask): string {
  const sonnetTasks: AiTask[] = ["market_price", "lead_match", "complex_reply"];
  return sonnetTasks.includes(task)
    ? "claude-sonnet-4-6"
    : "claude-haiku-4-5-20251001";
}
