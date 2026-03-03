import { mkdir, appendFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { CouncilRunResult, TaskEnvelope } from "../types/contracts.js";
import { ENV } from "../config/env.js";

interface TraceRecord {
  ts: string;
  task: Pick<TaskEnvelope, "id" | "userId" | "channel" | "text">;
  decision: CouncilRunResult["decision"];
  chairmanModel: string;
  dissent?: string;
  winners: string[];
}

export async function persistTrace(task: TaskEnvelope, result: CouncilRunResult): Promise<void> {
  const record: TraceRecord = {
    ts: new Date().toISOString(),
    task: {
      id: task.id,
      userId: task.userId,
      channel: task.channel,
      text: task.text,
    },
    decision: result.decision,
    chairmanModel: result.trace.selectedChairmanModel,
    dissent: result.trace.dissent,
    winners: result.trace.winners,
  };

  await mkdir(dirname(ENV.traceStorePath), { recursive: true });
  await appendFile(ENV.traceStorePath, `${JSON.stringify(record)}\n`, "utf8");
}
