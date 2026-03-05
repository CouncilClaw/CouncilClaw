/**
 * Telegram bot: long-polling receiver and command handler.
 * Receives updates from Telegram, runs council for /council, and sends replies.
 * Commands are auto-registered on setup and when the server starts (OpenClaw-style).
 */

import { randomUUID } from "node:crypto";
import { runCouncil } from "../council/council-engine.js";
import { logger } from "../telemetry/logger.js";
import { buildTelegramCommandsForMenu } from "./telegram-commands.js";
import type { CouncilRunResult, TaskEnvelope } from "../types/contracts.js";
import type { CouncilClawSettings } from "../config/settings.js";

const TELEGRAM_API = "https://api.telegram.org";

/**
 * Register the bot command menu with Telegram (setMyCommands).
 * Call during setup and when the server starts so users don't need to run sync-commands.
 * @returns true if registration succeeded
 */
export async function registerTelegramCommands(token: string, commandNames: string[]): Promise<boolean> {
  if (!token.trim() || !commandNames.length) return false;
  const commands = buildTelegramCommandsForMenu(commandNames);
  const url = `${TELEGRAM_API}/bot${token.trim()}/setMyCommands`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commands,
        scope: { type: "default" as const },
        language_code: "en",
      }),
    });
    const data = (await res.json()) as { ok?: boolean; description?: string };
    if (!data.ok) {
      logger.warn("telegram-bot", "setMyCommands failed", { description: data.description });
      return false;
    }
    return true;
  } catch (err) {
    logger.warn("telegram-bot", "registerTelegramCommands failed", { error: err instanceof Error ? err.message : String(err) });
    return false;
  }
}

interface MessageEntity {
  type: string;
  offset: number;
  length: number;
}

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: { id: number; username?: string; first_name?: string };
    chat: { id: number; type: string };
    text?: string;
    entities?: MessageEntity[];
  };
}

interface GetUpdatesResponse {
  ok: boolean;
  result?: TelegramUpdate[];
}

function isCommand(entity: MessageEntity, text: string): { command: string; args: string } | null {
  if (entity.type !== "bot_command") return null;
  const cmd = text.slice(entity.offset, entity.offset + entity.length).replace(/^\//, "").trim().toLowerCase();
  const args = text.slice(entity.offset + entity.length).trim();
  return { command: cmd, args };
}

async function sendMessage(botToken: string, chatId: number, text: string): Promise<void> {
  const url = `${TELEGRAM_API}/bot${botToken}/sendMessage`;
  const body = { chat_id: chatId, text, parse_mode: "HTML" as const };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json()) as { description?: string };
    throw new Error(err.description ?? `Telegram API ${res.status}`);
  }
}

async function getUpdates(botToken: string, offset: number, timeoutSeconds: number): Promise<TelegramUpdate[]> {
  const url = `${TELEGRAM_API}/bot${botToken}/getUpdates?offset=${offset}&timeout=${timeoutSeconds}&limit=100`;
  const res = await fetch(url);
  const data = (await res.json()) as GetUpdatesResponse;
  if (!data.ok || !Array.isArray(data.result)) return [];
  return data.result;
}

function formatCouncilResult(result: CouncilRunResult): string {
  const t = result.trace?.timing;
  const totalMs = t ? t.totalMs ?? (t.decompositionMs ?? 0) + (t.firstPassMs ?? 0) + (t.reviewMs ?? 0) + (t.synthesisMs ?? 0) + (t.executionMs ?? 0) : 0;
  const lines: string[] = [];
  lines.push("<b>📋 Council result</b>");
  lines.push("");
  if (result.chairmanPlan?.rationale) {
    lines.push(result.chairmanPlan.rationale.slice(0, 1500));
    if (result.chairmanPlan.rationale.length > 1500) lines.push("…");
  }
  const reports = result.reports ?? [];
  const failed = reports.filter((r) => r.status === "failed");
  if (failed.length > 0) {
    lines.push("");
    lines.push("<b>⚠️ Errors</b>");
    for (const r of failed) {
      if (r.errors?.length) lines.push(`• ${r.errors.slice(0, 2).join("; ")}`);
    }
  }
  if (totalMs > 0) lines.push("");
  lines.push(`<i>⏱ ${Math.round(totalMs / 1000)}s total</i>`);
  return lines.join("\n");
}

async function handleCommand(
  cfg: CouncilClawSettings,
  botToken: string,
  chatId: number,
  userId: string,
  command: string,
  args: string,
): Promise<void> {
  switch (command) {
    case "start": {
      const helpUrl = "https://github.com/CouncilClaw/CouncilClaw#-telegram-bot-commands";
      await sendMessage(
        botToken,
        chatId,
        "<b>CouncilClaw</b> – Multi-model deliberation, single-agent execution.\n\n" +
          "Send <code>/council your task here</code> to run the council.\n" +
          "<code>/help</code> – list commands.\n\n" +
          `Docs: ${helpUrl}`,
      );
      return;
    }
    case "help":
    case "commands": {
      const list =
        "<b>Commands</b>\n" +
        "/start – Welcome\n" +
        "/council &lt;task&gt; – Run council (e.g. /council Design a REST API)\n" +
        "/help – This message\n" +
        "/models – List models (run councilclaw models in CLI for full list)\n" +
        "/status – Session status (CLI for full session)\n\n" +
        "Other options (model, thinking, verbose) are configured via <code>councilclaw setup</code> or the webhook API.";
      await sendMessage(botToken, chatId, list);
      return;
    }
    case "council": {
      const text = args.trim();
      if (!text) {
        await sendMessage(botToken, chatId, "Usage: /council &lt;your task&gt;\nExample: /council Design a caching layer for an API");
        return;
      }
      await sendMessage(botToken, chatId, "🔄 Running council…");
      const task: TaskEnvelope = {
        id: randomUUID(),
        userId,
        channel: "telegram",
        text,
        createdAt: new Date().toISOString(),
        options: cfg.chairmanModel ? { chairmanModel: cfg.chairmanModel } : undefined,
      };
      try {
        const result = await runCouncil(task);
        const msg = formatCouncilResult(result);
        await sendMessage(botToken, chatId, msg);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error("telegram-bot", "Council run failed", err instanceof Error ? err : new Error(msg), { chatId, userId });
        await sendMessage(botToken, chatId, `❌ Error: ${msg.slice(0, 500)}`);
      }
      return;
    }
    case "models": {
      const hint = "Run <code>councilclaw models</code> in the CLI for the full list. Current chairman: " + (cfg.chairmanModel || "not set");
      await sendMessage(botToken, chatId, hint);
      return;
    }
    case "status": {
      const status = `Chairman: ${cfg.chairmanModel || "not set"}\nCouncil size: ${cfg.councilModels?.length ?? 0}\nConfigure sessions via CLI or webhook.`;
      await sendMessage(botToken, chatId, status);
      return;
    }
    default: {
      await sendMessage(
        botToken,
        chatId,
        `Unknown command /${command}. Use /help. To run a task: /council &lt;your task&gt;`,
      );
    }
  }
}

export async function runTelegramPolling(cfg: CouncilClawSettings): Promise<void> {
  const tcfg = cfg.channelConfigs?.telegram;
  if (!tcfg?.enabled || !tcfg.token?.trim()) {
    logger.debug("telegram-bot", "Telegram disabled or no token; skipping polling");
    return;
  }
  const token = tcfg.token.trim();
  const commandNames = cfg.telegramCommands?.length ? cfg.telegramCommands : ["start", "council", "help", "commands", "status", "models"];
  const registered = await registerTelegramCommands(token, commandNames);
  if (registered) logger.info("telegram-bot", "Telegram commands registered (menu will show when you open the bot)");
  let offset = 0;
  const timeoutSeconds = 30;
  logger.info("telegram-bot", "Telegram long polling started");

  for (;;) {
    try {
      const updates = await getUpdates(token, offset, timeoutSeconds);
      for (const u of updates) {
        offset = Math.max(offset, u.update_id + 1);
        const msg = u.message;
        if (!msg?.text || !msg.chat) continue;
        const chatId = msg.chat.id;
        const from = msg.from;
        const userId = from ? `tg:${from.id}` : `tg:${chatId}`;
        const entities = msg.entities ?? [];
        const cmdEntity = entities.find((e) => e.type === "bot_command");
        if (cmdEntity) {
          const parsed = isCommand(cmdEntity, msg.text);
          if (parsed) {
            await handleCommand(cfg, token, chatId, userId, parsed.command, parsed.args);
          }
        } else {
          await sendMessage(
            token,
            chatId,
            "Send a command: /help for list, or /council &lt;task&gt; to run the council.",
          );
        }
      }
    } catch (err) {
      logger.error("telegram-bot", "Polling error", err instanceof Error ? err : new Error(String(err)));
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}
