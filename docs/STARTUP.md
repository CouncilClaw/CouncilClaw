# Running CouncilClaw at Startup (OpenClaw-Style)

CouncilClaw is designed to run as an **always-on service**: you configure it once, enable it at startup, and then use Telegram (or other channels) anytime without running any command. After a reboot, the service starts automatically.

---

## How It Works

- **Default behavior**: Running the program (`npm start`, `node dist/index.js`, or `councilclaw start`) starts the **service**: webhook API + Telegram (and other channel listeners). There is no separate "server mode"—channels start as soon as the program starts.
- **No manual start**: Once the service is enabled at boot, you never need to "start the server"; just open Telegram (or your channel) and send commands.

---

## 1. Run the Service (Foreground)

From the project directory:

```bash
npm start
# or
councilclaw start
```

Or for development (with tsx):

```bash
npm run dev
```

The service starts immediately: webhook on port 8787 (or `PORT`) and Telegram long polling. Use Telegram right away.

---

## 2. Run at System Startup (Linux – systemd)

So that CouncilClaw starts on boot and survives reboots:

1. **Install the systemd service**:

   ```bash
   # From the CouncilClaw project directory:
   npm install -g .  # Install globally first (if not already done)
   councilclaw install --daemon
   ```

   This creates a service template and shows you the sudo commands to finalize installation.

2. **Optional – API key via env file** (so the service has `OPENROUTER_API_KEY`):

   ```bash
   echo 'OPENROUTER_API_KEY=your-key' | sudo tee /etc/default/councilclaw
   ```

3. **Complete the installation** using the sudo commands shown:

   ```bash
   sudo cp /tmp/councilclaw.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable councilclaw
   sudo systemctl start councilclaw
   ```

4. **Check status**:

   ```bash
   sudo systemctl status councilclaw
   ```

After a reboot, CouncilClaw will start automatically. Use Telegram (or other channels) without running anything.

**To uninstall:** Run `councilclaw uninstall` to remove all data, configuration, and optionally the systemd service.

---

## 3. Run at Startup (macOS – launchd)

Create `~/Library/LaunchAgents/com.councilclaw.service.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.councilclaw.service</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/node</string>
    <string>/path/to/CouncilClaw/dist/index.js</string>
  </array>
  <key>WorkingDirectory</key>
  <string>/path/to/CouncilClaw</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>/tmp/councilclaw.log</string>
  <key>StandardErrorPath</key>
  <string>/tmp/councilclaw.err</string>
</dict>
</plist>
```

Replace `/path/to/CouncilClaw` and node path as needed. Then:

```bash
launchctl load ~/Library/LaunchAgents/com.councilclaw.service.plist
```

---

## 4. Demo Mode (One-Off Task)

To run a single demo task instead of the service:

```bash
COUNCILCLAW_MODE=demo npm start
```

---

## Summary

| Goal                         | Command / setup |
|-----------------------------|------------------|
| Run service now (foreground)| `npm start` or `councilclaw start` |
| Run at boot (Linux)         | systemd: `contrib/councilclaw.service` + enable |
| Run at boot (macOS)         | launchd plist in `~/Library/LaunchAgents/` |
| One-off demo                | `COUNCILCLAW_MODE=demo npm start` |

Config lives in `~/.config/councilclaw/config.json`. Run `councilclaw setup` once; after that, the service uses that config and you use channels (e.g. Telegram) without starting anything manually.
