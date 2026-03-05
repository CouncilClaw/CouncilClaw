import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVICE_NAME = "councilclaw";
const SERVICE_FILE_PATH = `/etc/systemd/system/${SERVICE_NAME}.service`;

/**
 * Installs CouncilClaw as a systemd service for persistence.
 */
export async function installDaemon(): Promise<void> {
  const projectRoot = path.resolve(__dirname, "../../");
  const nodeBin = process.execPath;
  const entryPoint = path.join(projectRoot, "dist/index.js");
  const user = os.userInfo().username;
  const group = os.userInfo().gid.toString();

  const serviceTemplate = `[Unit]
Description=CouncilClaw – multi-model deliberation service
Documentation=https://github.com/CouncilClaw/CouncilClaw
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=${user}
Group=${group}
WorkingDirectory=${projectRoot}
ExecStart=${nodeBin} ${entryPoint}
Restart=on-failure
RestartSec=10
# Optional: environment variables can be loaded from /etc/default/councilclaw
EnvironmentFile=-/etc/default/councilclaw

[Install]
WantedBy=multi-user.target
`;

  console.log("\n⚙️  Preparing CouncilClaw systemd service...");
  
  if (process.platform !== "linux") {
    console.error("❌ Error: Daemon installation is currently only supported on Linux (systemd).");
    return;
  }

  try {
    const tempFile = path.join(os.tmpdir(), `${SERVICE_NAME}.service`);
    fs.writeFileSync(tempFile, serviceTemplate);
    
    console.log(`\n✅ Created service template at: ${tempFile}`);
    console.log(`\nTo finalize the installation and enable auto-start on boot, run:`);
    console.log(`----------------------------------------------------------------`);
    console.log(`  sudo cp ${tempFile} ${SERVICE_FILE_PATH}`);
    console.log(`  sudo systemctl daemon-reload`);
    console.log(`  sudo systemctl enable ${SERVICE_NAME}`);
    console.log(`  sudo systemctl start ${SERVICE_NAME}`);
    console.log(`----------------------------------------------------------------`);
    console.log(`\nOnce started, you can check status with: sudo systemctl status ${SERVICE_NAME}`);
  } catch (err) {
    console.error("❌ Failed to prepare daemon installation:", err instanceof Error ? err.message : String(err));
  }
}

/**
 * Uninstalls CouncilClaw completely:
 * - Removes systemd service
 * - Removes configuration files
 * - Removes environment variables file
 * - Cleans up all user data
 */
export async function uninstallDaemon(): Promise<void> {
  console.log("\n⚙️  Uninstalling CouncilClaw completely...");

  if (process.platform !== "linux") {
    console.error("❌ Error: Uninstallation is currently only supported on Linux.");
    return;
  }

  try {
    // Remove user config directory
    const configDir = path.join(os.homedir(), ".config", "councilclaw");
    if (fs.existsSync(configDir)) {
      fs.rmSync(configDir, { recursive: true, force: true });
      console.log(`✅ Removed config directory: ${configDir}`);
    }

    // Remove environment file if exists
    const envFile = "/etc/default/councilclaw";
    if (fs.existsSync(envFile)) {
      console.log(`\nℹ️  The environment file exists at: ${envFile}`);
      console.log(`    Run: sudo rm ${envFile}`);
    }

    // Remove systemd service file if exists
    if (fs.existsSync(SERVICE_FILE_PATH)) {
      console.log(`\nℹ️  The systemd service file exists at: ${SERVICE_FILE_PATH}`);
      console.log(`\nTo complete the uninstallation, run these sudo commands:`);
      console.log(`----------------------------------------------------------------`);
      console.log(`  sudo systemctl stop ${SERVICE_NAME}`);
      console.log(`  sudo systemctl disable ${SERVICE_NAME}`);
      console.log(`  sudo rm ${SERVICE_FILE_PATH}`);
      if (fs.existsSync(envFile)) {
        console.log(`  sudo rm ${envFile}`);
      }
      console.log(`  sudo systemctl daemon-reload`);
      console.log(`----------------------------------------------------------------`);
    } else {
      console.log(`✅ Systemd service not found (already removed).`);
    }

    console.log(`\n✅ CouncilClaw configuration and data removed.`);
    console.log(`\n💡 To also remove the npm package globally, run: npm uninstall -g councilclaw`);
  } catch (err) {
    console.error("❌ Failed to uninstall:", err instanceof Error ? err.message : String(err));
  }
}
