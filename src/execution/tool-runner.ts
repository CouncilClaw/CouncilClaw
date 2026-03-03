import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface CommandRunResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  error?: string;
}

export async function runCommand(command: string): Promise<CommandRunResult> {
  const parts = command.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) {
    return { ok: false, stdout: "", stderr: "", error: "Empty command" };
  }

  const [bin, ...args] = parts;

  try {
    const { stdout, stderr } = await execFileAsync(bin, args, {
      timeout: Number(process.env.EXEC_TIMEOUT_MS || 12000),
      maxBuffer: 256 * 1024,
      cwd: process.cwd(),
    });
    return { ok: true, stdout: String(stdout || ""), stderr: String(stderr || "") };
  } catch (err) {
    const e = err as Error & { stdout?: string; stderr?: string };
    return {
      ok: false,
      stdout: String(e.stdout || ""),
      stderr: String(e.stderr || ""),
      error: e.message,
    };
  }
}
