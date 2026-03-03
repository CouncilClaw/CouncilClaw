export interface SupportedModel {
  id: string;
  label: string;
  tier: "fast" | "balanced" | "premium";
}

export const SUPPORTED_MODELS: SupportedModel[] = [
  { id: "openai/gpt-4.1-mini", label: "GPT-4.1 Mini", tier: "fast" },
  { id: "openai/gpt-4.1", label: "GPT-4.1", tier: "balanced" },
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", tier: "fast" },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", tier: "premium" },
  { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet", tier: "balanced" },
  { id: "anthropic/claude-3.7-sonnet", label: "Claude 3.7 Sonnet", tier: "premium" },
  { id: "x-ai/grok-4", label: "Grok 4", tier: "premium" },
  { id: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B", tier: "balanced" },
];

export function isSupportedModel(model: string): boolean {
  return SUPPORTED_MODELS.some((m) => m.id === model);
}
