import { promises as fs } from "fs";
import path from "path";
import { AgentConfig, CallLog } from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");
const AGENT_FILE = path.join(DATA_DIR, "agent.json");
const CALLS_FILE = path.join(DATA_DIR, "calls.json");

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // directory exists
  }
}

// Agent Config

export async function getAgentConfig(): Promise<AgentConfig | null> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(AGENT_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function saveAgentConfig(config: AgentConfig): Promise<AgentConfig> {
  await ensureDataDir();
  const existing = await getAgentConfig();
  const updated: AgentConfig = {
    ...existing,
    ...config,
    updatedAt: new Date().toISOString(),
    createdAt: existing?.createdAt || new Date().toISOString(),
  };
  await fs.writeFile(AGENT_FILE, JSON.stringify(updated, null, 2), "utf-8");
  return updated;
}

// Call Logs

export async function getCallLogs(): Promise<CallLog[]> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(CALLS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function saveCallLog(log: CallLog): Promise<void> {
  const logs = await getCallLogs();
  const existingIndex = logs.findIndex((l) => l.id === log.id);
  if (existingIndex >= 0) {
    logs[existingIndex] = { ...logs[existingIndex], ...log };
  } else {
    logs.unshift(log);
  }
  await fs.writeFile(CALLS_FILE, JSON.stringify(logs, null, 2), "utf-8");
}
