export interface GuardrailDecision {
  allowed: boolean;
  reason?: string;
}

const BLOCKLIST = ["rm", "mv", "shutdown", "reboot", "format", "mkfs"];
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

  // Check against blocklist for the primary command
  if (BLOCKLIST.includes(firstToken)) {
    // Special case: allow rm if it's NOT recursive or force on sensitive paths
    if (firstToken === "rm") {
      if (trimmed.includes("-r") || trimmed.includes("-f") || trimmed.includes("-rf")) {
         return {
           allowed: false,
           reason: "Recursive or forced 'rm' is blocked for safety. Use specific file paths without -r/-f.",
         };
      }
    } else {
      return {
        allowed: false,
        reason: `Command '${firstToken}' is in the safety blocklist.`,
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
