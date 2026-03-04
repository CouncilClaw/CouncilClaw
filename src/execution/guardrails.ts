export interface GuardrailDecision {
  allowed: boolean;
  reason?: string;
}

const BLOCKLIST = ["shutdown", "reboot", "format", "mkfs"];
const DANGEROUS_PATTERNS = [
  /\brm\s+-[rf]{1,2}\s+\//, // rm -rf /
  /\brm\s+-[rf]{1,2}\s+\*/, // rm -rf *
  /\brm\s+-[rf]{1,2}\s+\.\./, // rm -rf ..
  />\s*\/dev\/sd/, // overwriting disk device
  /mkfs/,
  /dd\s+if=.*of=\/dev\//,
];

export function checkCommandPolicy(command: string): GuardrailDecision {
  const trimmed = command.trim();
  if (!trimmed) return { allowed: false, reason: "Empty command" };

  const firstToken = trimmed.split(/\s+/)[0] || "";
  
  // Load user-defined blocked commands from environment
  const userBlocked = process.env.BLOCKED_SHELL_COMMANDS?.split(",").map(s => s.trim()).filter(Boolean) || [];

  // Check against core blocklist
  if (BLOCKLIST.includes(firstToken)) {
    return {
      allowed: false,
      reason: `Command '${firstToken}' is in the core safety blocklist.`,
    };
  }

  // Check against user-defined blocked commands
  if (userBlocked.includes(firstToken)) {
     return {
        allowed: false,
        reason: `Command '${firstToken}' is blocked by your configuration.`,
     };
  }

  // Check if any blocked command appears anywhere in a chained command
  for (const blocked of [...BLOCKLIST, ...userBlocked]) {
    const pattern = new RegExp(`\\b${blocked}\\b`);
    if (pattern.test(trimmed)) {
       if (blocked === "rm") {
          // Special case: rm is only blocked if recursive/forced via patterns below
          continue;
       }
       return {
         allowed: false,
         reason: `Blocked command '${blocked}' detected in command string.`,
       };
    }
  }

  // Check for dangerous patterns anywhere in the command string (including chains)
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        allowed: false,
        reason: "Command matches a known dangerous pattern and was blocked.",
      };
    }
  }

  return { allowed: true };
}
