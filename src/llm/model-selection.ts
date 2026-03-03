import type { TaskEnvelope } from "../types/contracts.js";
import type { ModelRegistry } from "./model-registry.js";

export interface ChairmanSelection {
  model: string;
  source: "user" | "default";
  note?: string;
}

export function resolveChairmanModel(task: TaskEnvelope, registry: ModelRegistry): ChairmanSelection {
  const requested = task.options?.chairmanModel?.trim();
  if (!requested) {
    return { model: registry.chairmanModel, source: "default" };
  }

  const allowlist = new Set([registry.chairmanModel, ...registry.councilModels]);
  const envAllow = process.env.ALLOWED_CHAIRMAN_MODELS?.split(",").map((m) => m.trim()).filter(Boolean) || [];
  envAllow.forEach((m) => allowlist.add(m));

  if (allowlist.has(requested)) {
    return { model: requested, source: "user" };
  }

  return {
    model: registry.chairmanModel,
    source: "default",
    note: `Requested chairman model '${requested}' is not allowed; reverted to default chairman.`,
  };
}
