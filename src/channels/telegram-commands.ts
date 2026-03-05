/**
 * Telegram bot command names and short descriptions for setMyCommands.
 * Descriptions must be 3–256 characters for the command menu to display correctly.
 */

export const TELEGRAM_COMMAND_DESCRIPTIONS: Record<string, string> = {
  start: "Start the bot and see welcome message",
  council: "Run council deliberation (e.g. /council Design an API)",
  help: "Show all commands",
  commands: "List slash commands",
  status: "Show session and model status",
  new: "Start a new session",
  session: "Manage session settings",
  reset: "Reset session context",
  stop: "Stop running council",
  chairman: "View or switch chairman model",
  model: "View or set chairman model",
  models: "List available models",
  thinking: "Set thinking level (shallow/normal/deep)",
  t: "Shortcut for /thinking",
  verbose: "Toggle verbose mode",
  v: "Shortcut for /verbose",
  context: "Explain memory context",
  whoami: "Show your user ID",
  usage: "Show usage statistics",
  compact: "Compress session context",
};

export function buildTelegramCommandsForMenu(commandNames: string[]): { command: string; description: string }[] {
  return commandNames.map((raw) => {
    const name = raw.replace(/^\//, "").trim().toLowerCase();
    const description = TELEGRAM_COMMAND_DESCRIPTIONS[name] ?? `CouncilClaw ${raw}`;
    return { command: name, description };
  });
}
