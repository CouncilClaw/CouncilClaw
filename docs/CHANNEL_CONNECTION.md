# Channel Connection Guide

This guide explains how to connect each supported channel to CouncilClaw so you can send commands and run council tasks from that channel.

---

## Overview

- **Telegram**: CouncilClaw runs a built-in bot that receives messages via long polling. You configure the bot token once; when the server is running, you can send `/council`, `/help`, etc. in Telegram and get responses.
- **Slack, Discord, Teams, etc.**: These channels do not have a built-in listener. You integrate by sending HTTP requests to CouncilClaw’s `POST /task` API (e.g. from a Slack app, Discord bot, or middleware). The connection process is: configure the external app, then point it at your CouncilClaw server.

---

## Telegram

Telegram is fully integrated: the server runs a bot that receives updates and executes commands.

### 1. Create a bot and get the token

1. Open Telegram and search for **@BotFather**.
2. Send `/newbot` and follow the prompts (name and username).
3. Copy the **token** BotFather returns (e.g. `123456789:ABCdefGHI...`).

### 2. Configure CouncilClaw

```bash
councilclaw setup
# or: npm run setup
```

1. Complete **API & Workspace** (OpenRouter API key).
2. In **Channels**, select **Telegram**.
3. When asked for the Telegram bot token, paste the token from BotFather.
4. Save and exit. This writes the token to `~/.config/councilclaw/config.json` and enables the Telegram channel.

### 3. Commands are registered automatically

CouncilClaw registers the command menu when you complete setup and when you start the server (like OpenClaw). No separate sync step. Open a **private** chat with your bot, send `/start`, then type `/` to see the list. To manually refresh: `councilclaw telegram sync-commands`.

### 4. Run the service (or enable at startup)

The program **starts the service by default**—webhook + Telegram start as soon as you run it. No separate "server mode."

**Run now (foreground):**
```bash
export OPENROUTER_API_KEY="your-key"
npm start
# or: councilclaw start
```

**Run at boot (OpenClaw-style):** So you never have to start anything after a reboot—just open Telegram. See **[Run at startup](STARTUP.md)** (systemd on Linux, launchd on macOS).

You should see:
- `CouncilClaw webhook listening on http://localhost:8787`
- `Telegram long polling started` (if Telegram is enabled and token is set)

### 5. Use the bot in Telegram

1. Open Telegram and find your bot (by its username).
2. Start a chat and send `/start` or `/help`.
3. Send a task: `/council Design a REST API for user auth`
4. The bot will run the council and reply with the result.

### Summary (Telegram)

| Step | Action |
|------|--------|
| 1 | Create bot in @BotFather, copy token |
| 2 | `councilclaw setup` → Channels → Telegram → paste token, save (commands register automatically) |
| 3 | `npm start` or `councilclaw start` (or [enable at startup](STARTUP.md) so you never start manually) |
| 4 | In Telegram: open bot, send `/start` then `/council your task` |

### Optional: Webhook instead of polling

By default the bot uses **long polling** (the server calls Telegram’s `getUpdates`). For production you can switch to a **webhook** so Telegram pushes updates to your server. That requires:

- A public HTTPS URL.
- Adding a route (e.g. `POST /telegram/webhook`) that receives Telegram updates and handles them the same way as the poller.

The connection process above (token, setup, sync-commands, run service) is the same; only the way the service receives updates changes.

---

## Slack

CouncilClaw does not run a Slack app itself. You connect Slack by having Slack send events or slash commands to your CouncilClaw server.

### Connection process

1. **Create a Slack app**  
   [api.slack.com/apps](https://api.slack.com/apps) → Create New App → From scratch.

2. **Enable incoming data** (one of):
   - **Slash Commands**: Add a command (e.g. `/council`) that sends the user’s text to your server.
   - **Event Subscriptions**: Subscribe to message events and forward chosen messages to your server.
   - **Incoming Webhooks**: Outgoing only; to run council from Slack you still need a Slash Command or Event that calls your backend.

3. **Point the app at CouncilClaw**  
   Your backend must:
   - Receive the Slack request (e.g. slash command payload or event).
   - Build a JSON body: `{ "text": "<task from user>", "channel": "slack", "userId": "<slack_user_id>" }`.
   - Call CouncilClaw:
     ```bash
     curl -X POST http://localhost:8787/task \
       -H "Content-Type: application/json" \
       -H "Authorization: Bearer $COUNCILCLAW_WEBHOOK_TOKEN" \
       -d '{"text":"Design an API","channel":"slack","userId":"U123"}'
     ```
   - Optionally send the council result back to Slack (e.g. in the channel or as an ephemeral message).

4. **Run CouncilClaw**  
   Start the service (`npm start` or `councilclaw start`). Your Slack app’s request URL must be reachable from Slack (public URL or tunnel like ngrok during development).

### Summary (Slack)

| Step | Action |
|------|--------|
| 1 | Create Slack app, add Slash Command or Event Subscriptions |
| 2 | Implement a backend that receives Slack payloads and calls `POST /task` with `channel: "slack"` |
| 3 | Run CouncilClaw server and expose it so Slack can reach your backend |

---

## Discord

CouncilClaw does not run a Discord bot. You connect by running a small Discord bot (or webhook receiver) that forwards commands to CouncilClaw.

### Connection process

1. **Create a Discord application and bot**  
   [Discord Developer Portal](https://discord.com/developers/applications) → New Application → Bot → copy token.

2. **Implement a bridge** that:
   - Listens for Discord messages or slash commands (e.g. `/council`).
   - For each task, calls CouncilClaw:
     ```bash
     curl -X POST http://localhost:8787/task \
       -H "Content-Type: application/json" \
       -H "Authorization: Bearer $COUNCILCLAW_WEBHOOK_TOKEN" \
       -d '{"text":"Design an API","channel":"discord","userId":"discord_user_id"}'
     ```
   - Sends the council result back to the Discord channel (e.g. reply or follow-up).

3. **Run CouncilClaw**  
   Start the service (`npm start` or `councilclaw start`). Your Discord bot runs separately and uses the CouncilClaw API.

### Summary (Discord)

| Step | Action |
|------|--------|
| 1 | Create Discord app and bot, copy token |
| 2 | Build a bot that receives messages/commands and calls `POST /task` with `channel: "discord"` |
| 3 | Run CouncilClaw server; run your Discord bot |

---

## Microsoft Teams

Connect by having Teams send user input to your backend, which then calls CouncilClaw.

### Connection process

1. **Create a Teams app** (e.g. Messaging Extension or Bot) in the [Teams Developer Portal](https://dev.teams.microsoft.com/) or Azure Bot Service.
2. **Implement a backend** that:
   - Receives requests from Teams (e.g. bot messages or command payloads).
   - Calls `POST /task` with `"channel": "teams"` and the user’s task text and ID.
   - Returns the council result to Teams.
3. Run CouncilClaw (`npm start` or `councilclaw start`) and expose your backend so Teams can reach it.

---

## HTTP / Webhook (generic)

Any client that can send HTTP requests can use CouncilClaw.

### Connection process

1. **Start CouncilClaw service**: `npm start` or `councilclaw start`
2. **Optional**: Set `COUNCILCLAW_WEBHOOK_TOKEN` and send `Authorization: Bearer <token>` on requests.
3. **Send tasks**:
   ```bash
   curl -X POST http://localhost:8787/task \
     -H "Content-Type: application/json" \
     -d '{"text":"Your task here","channel":"http","userId":"your-app-user-id"}'
   ```

Use `channel: "webhook"` if you prefer that label. No extra connection steps; the “connection” is the HTTP client and server URL.

---

## Other channels (email, WhatsApp, Matrix, IRC, gRPC)

For **email**, **WhatsApp**, **matrix**, **irc**, **grpc**, and **cli**:

- CouncilClaw does not run a listener for these. The `channel` field is a **label** for where the task originated.
- To “connect” a channel:
  1. Run CouncilClaw server and (for Telegram) enable the Telegram bot as in the Telegram section.
  2. Build or use a bridge (script, bot, or service) that:
     - Receives input from that channel (e.g. email, Matrix message).
     - Calls `POST /task` with `text`, `channel` set to the appropriate value (`email`, `whatsapp`, `matrix`, `irc`, `grpc`, or `cli`), and `userId`.
  3. Optionally deliver the council result back over that channel.

The connection process is always: **configure the external system → have it call CouncilClaw’s API → run the server**.

---

## Quick reference

| Channel   | Built-in listener? | How to connect |
|----------|--------------------|----------------|
| Telegram | Yes (long polling)  | Token in setup → sync-commands → run server → use bot in Telegram |
| Slack    | No                 | Slack app → your backend → `POST /task` with `channel: "slack"` |
| Discord  | No                 | Discord bot → your backend → `POST /task` with `channel: "discord"` |
| Teams    | No                 | Teams app → your backend → `POST /task` with `channel: "teams"` |
| HTTP     | Yes (webhook API)  | Run server → any client calls `POST /task` with `channel: "http"` or `"webhook"` |
| Others   | No                 | Your bridge → `POST /task` with the right `channel` label |

See [API.md](API.md) for full `POST /task` request and response format.
