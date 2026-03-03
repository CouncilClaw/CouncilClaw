export interface SupportedModel {
  id: string;
  label: string;
  tier: "fast" | "balanced" | "premium";
  provider: string;
}

export const SUPPORTED_MODELS: SupportedModel[] = [
  // OpenAI
  { id: "openai/gpt-4.1-mini", label: "GPT-4.1 Mini", tier: "fast", provider: "OpenAI" },
  { id: "openai/gpt-4.1", label: "GPT-4.1", tier: "balanced", provider: "OpenAI" },
  { id: "openai/gpt-4o", label: "GPT-4o", tier: "premium", provider: "OpenAI" },
  { id: "openai/gpt-4o-mini", label: "GPT-4o Mini", tier: "fast", provider: "OpenAI" },
  { id: "openai/o1-mini", label: "O1 Mini", tier: "premium", provider: "OpenAI" },
  { id: "openai/o1", label: "O1", tier: "premium", provider: "OpenAI" },
  
  // Google
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", tier: "fast", provider: "Google" },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", tier: "premium", provider: "Google" },
  { id: "google/gemini-2.0-flash", label: "Gemini 2.0 Flash", tier: "fast", provider: "Google" },
  { id: "google/gemini-1.5-flash", label: "Gemini 1.5 Flash", tier: "fast", provider: "Google" },
  { id: "google/gemini-1.5-pro", label: "Gemini 1.5 Pro", tier: "balanced", provider: "Google" },
  
  // Anthropic
  { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet", tier: "balanced", provider: "Anthropic" },
  { id: "anthropic/claude-3.7-sonnet", label: "Claude 3.7 Sonnet", tier: "premium", provider: "Anthropic" },
  { id: "anthropic/claude-3-opus", label: "Claude 3 Opus", tier: "premium", provider: "Anthropic" },
  { id: "anthropic/claude-3-haiku", label: "Claude 3 Haiku", tier: "fast", provider: "Anthropic" },
  
  // xAI
  { id: "x-ai/grok-4", label: "Grok 4", tier: "premium", provider: "xAI" },
  { id: "x-ai/grok-3", label: "Grok 3", tier: "balanced", provider: "xAI" },
  { id: "x-ai/grok-2", label: "Grok 2", tier: "fast", provider: "xAI" },
  
  // Meta
  { id: "meta-llama/llama-2-70b-chat", label: "Llama 2 70B Chat", tier: "balanced", provider: "Meta" },
  { id: "meta-llama/llama-3-8b-instruct", label: "Llama 3 8B", tier: "fast", provider: "Meta" },
  { id: "meta-llama/llama-3-70b-instruct", label: "Llama 3 70B", tier: "balanced", provider: "Meta" },
  { id: "meta-llama/llama-3.1-8b-instruct", label: "Llama 3.1 8B", tier: "fast", provider: "Meta" },
  { id: "meta-llama/llama-3.1-70b-instruct", label: "Llama 3.1 70B", tier: "balanced", provider: "Meta" },
  { id: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B", tier: "balanced", provider: "Meta" },
  
  // Mistral
  { id: "mistralai/mistral-7b-instruct", label: "Mistral 7B", tier: "fast", provider: "Mistral" },
  { id: "mistralai/mistral-large", label: "Mistral Large", tier: "balanced", provider: "Mistral" },
  { id: "mistralai/mixtral-8x7b-instruct", label: "Mixtral 8x7B", tier: "balanced", provider: "Mistral" },
  
  // Qwen
  { id: "qwen/qwen-110b-chat", label: "Qwen 110B", tier: "premium", provider: "Qwen" },
  { id: "qwen/qwen-32b-chat", label: "Qwen 32B", tier: "balanced", provider: "Qwen" },
  { id: "qwen/qwen-14b-chat", label: "Qwen 14B", tier: "fast", provider: "Qwen" },
  
  // Cohere
  { id: "cohere/command-r", label: "Command R", tier: "balanced", provider: "Cohere" },
  { id: "cohere/command-r-plus", label: "Command R+", tier: "premium", provider: "Cohere" },
  
  // Together AI (open models)
  { id: "togethercomputer/stripedhyena-nous-7b", label: "Striped Hyena 7B", tier: "fast", provider: "Together" },
];

export function isSupportedModel(model: string): boolean {
  return SUPPORTED_MODELS.some((m) => m.id === model);
}

export const MAX_COUNCIL_MODELS = 8;
export const MIN_COUNCIL_MODELS = 1;
