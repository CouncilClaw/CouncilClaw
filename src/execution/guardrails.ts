export interface GuardrailDecision {
  allowed: boolean;
  reason?: string;
}

const DEFAULT_ALLOWED = ["echo", "ls", "pwd", "cat"];

export function allowedCommands(): string[] {
  const raw = process.env.ALLOWED_SHELL_COMMANDS?.trim();
  if (!raw) return DEFAULT_ALLOWED;
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export function checkCommandPolicy(command: string): GuardrailDecision {
  const cmd = command.trim().split(/\s+/)[0] || "";
  if (!cmd) return { allowed: false, reason: "Empty command" };

  const allow = new Set(allowedCommands());
  if (!allow.has(cmd)) {
    return {
      allowed: false,
      reason: `Command '${cmd}' is not allowlisted. Allowed: ${[...allow].join(", ")}`,
    };
  }

  if (command.includes("&&") || command.includes("|") || command.includes(";")) {
    return { allowed: false, reason: "Command chaining is blocked by policy." };
  }

  return { allowed: true };
}
