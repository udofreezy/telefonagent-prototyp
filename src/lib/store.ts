import { AgentConfig, Appointment, CallLog, CallStatus } from "@/types";
import { Redis } from "@upstash/redis";
import { promises as fs } from "fs";
import path from "path";

const AGENT_KEY = "agent-config";
const CALLS_KEY = "call-logs";
const CALL_STATUS_KEY = "call-status";
const APPOINTMENTS_KEY = "appointments";

// --- Redis storage (Vercel / Production) ---

function getRedis() {
  return new Redis({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
  });
}

function useRedis(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

// --- File storage (Local development) ---

const DATA_DIR = path.join(/* turbopackIgnore: true */ process.cwd(), "data");
const AGENT_FILE = path.join(DATA_DIR, "agent.json");
const CALLS_FILE = path.join(DATA_DIR, "calls.json");
const APPOINTMENTS_FILE = path.join(DATA_DIR, "appointments.json");

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // directory exists
  }
}

// --- Agent Config ---

export async function getAgentConfig(): Promise<AgentConfig | null> {
  if (useRedis()) {
    const redis = getRedis();
    return await redis.get<AgentConfig>(AGENT_KEY);
  }

  await ensureDataDir();
  try {
    const data = await fs.readFile(AGENT_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function saveAgentConfig(config: AgentConfig): Promise<AgentConfig> {
  const existing = await getAgentConfig();
  const updated: AgentConfig = {
    ...existing,
    ...config,
    updatedAt: new Date().toISOString(),
    createdAt: existing?.createdAt || new Date().toISOString(),
  };

  if (useRedis()) {
    const redis = getRedis();
    await redis.set(AGENT_KEY, updated);
  } else {
    await ensureDataDir();
    await fs.writeFile(AGENT_FILE, JSON.stringify(updated, null, 2), "utf-8");
  }

  return updated;
}

// --- Call Logs ---

export async function getCallLogs(): Promise<CallLog[]> {
  if (useRedis()) {
    const redis = getRedis();
    return (await redis.get<CallLog[]>(CALLS_KEY)) || [];
  }

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

  if (useRedis()) {
    const redis = getRedis();
    await redis.set(CALLS_KEY, logs);
  } else {
    await ensureDataDir();
    await fs.writeFile(CALLS_FILE, JSON.stringify(logs, null, 2), "utf-8");
  }
}

// --- Call Status (Live) ---

const STATUS_FILE = path.join(DATA_DIR, "call-status.json");

export async function getCallStatus(): Promise<CallStatus> {
  if (useRedis()) {
    const redis = getRedis();
    return (await redis.get<CallStatus>(CALL_STATUS_KEY)) || { active: false };
  }

  await ensureDataDir();
  try {
    const data = await fs.readFile(STATUS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return { active: false };
  }
}

export async function saveCallStatus(status: CallStatus): Promise<void> {
  if (useRedis()) {
    const redis = getRedis();
    await redis.set(CALL_STATUS_KEY, status);
  } else {
    await ensureDataDir();
    await fs.writeFile(STATUS_FILE, JSON.stringify(status, null, 2), "utf-8");
  }
}

// --- Clear Call Logs ---

export async function clearCallLogs(): Promise<void> {
  if (useRedis()) {
    const redis = getRedis();
    await redis.set(CALLS_KEY, []);
  } else {
    await ensureDataDir();
    await fs.writeFile(CALLS_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

// --- Appointments ---

export async function getAppointments(): Promise<Appointment[]> {
  if (useRedis()) {
    const redis = getRedis();
    return (await redis.get<Appointment[]>(APPOINTMENTS_KEY)) || [];
  }

  await ensureDataDir();
  try {
    const data = await fs.readFile(APPOINTMENTS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function saveAppointment(appointment: Appointment): Promise<void> {
  const appointments = await getAppointments();
  const existingIndex = appointments.findIndex((a) => a.id === appointment.id);
  if (existingIndex >= 0) {
    appointments[existingIndex] = { ...appointments[existingIndex], ...appointment };
  } else {
    appointments.unshift(appointment);
  }

  if (useRedis()) {
    const redis = getRedis();
    await redis.set(APPOINTMENTS_KEY, appointments);
  } else {
    await ensureDataDir();
    await fs.writeFile(APPOINTMENTS_FILE, JSON.stringify(appointments, null, 2), "utf-8");
  }
}

export async function deleteAppointment(id: string): Promise<void> {
  const appointments = await getAppointments();
  const filtered = appointments.filter((a) => a.id !== id);

  if (useRedis()) {
    const redis = getRedis();
    await redis.set(APPOINTMENTS_KEY, filtered);
  } else {
    await ensureDataDir();
    await fs.writeFile(APPOINTMENTS_FILE, JSON.stringify(filtered, null, 2), "utf-8");
  }
}
