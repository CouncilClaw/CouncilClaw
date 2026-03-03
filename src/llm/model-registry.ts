export interface ModelRegistry {
  councilModels: string[];
  chairmanModel: string;
}

const DEFAULT_COUNCIL_MODELS = [
  "openai/gpt-4.1-mini",
  "google/gemini-2.5-flash",
  "anthropic/claude-3.5-sonnet",
];

const DEFAULT_CHAIRMAN_MODEL = "openai/gpt-4.1";

export function loadModelRegistry(): ModelRegistry {
  const councilRaw = process.env.COUNCIL_MODELS?.trim();
  const councilModels = councilRaw
    ? councilRaw.split(",").map((m) => m.trim()).filter(Boolean)
    : DEFAULT_COUNCIL_MODELS;

  return {
    councilModels,
    chairmanModel: process.env.CHAIRMAN_MODEL?.trim() || DEFAULT_CHAIRMAN_MODEL,
  };
}
