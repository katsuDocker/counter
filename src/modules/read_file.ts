import path from "node:path";
import { Database } from "bun:sqlite";

const DB_PATH = path.resolve(import.meta.dir, "../../db.sqlite");
const LEGACY_DB_PATH = path.resolve(import.meta.dir, "../../db.json");

const ensureDatabase = async () => {
  const legacyFile = Bun.file(LEGACY_DB_PATH);
  const databaseExists = await Bun.file(DB_PATH).exists();
  const legacyExists = await legacyFile.exists();

  if (!databaseExists && legacyExists) {
    const db = new Database(DB_PATH);
    db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS updates (
        id TEXT PRIMARY KEY,
        current INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS goal_log (
        id TEXT PRIMARY KEY,
        head_target INTEGER NOT NULL,
        day_end INTEGER NOT NULL
      );
    `);

    const legacyData = await legacyFile.json();
    if (legacyData && typeof legacyData === "object") {
      const snapshot = legacyData as Record<string, unknown>;
      const settings = [
        ["head_target", String(Number(snapshot.head_target) || 0)],
        ["current", String(Number(snapshot.current) || 0)],
        ["day_end", String(Number(snapshot.day_end) || 0)],
      ] as const;

      for (const [key, value] of settings) {
        db.prepare(
          `INSERT INTO settings (key, value)
           VALUES (?, ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        ).run(key, value);
      }

      const updates = Array.isArray(snapshot.update) ? snapshot.update : [];
      for (const item of updates) {
        if (!item || typeof item !== "object") continue;
        const record = item as { id?: string; current?: number };
        if (typeof record.id !== "string" || record.id.trim().length === 0)
          continue;
        const current = Number(record.current) || 0;
        db.prepare(
          `INSERT INTO updates (id, current)
           VALUES (?, ?)
           ON CONFLICT(id) DO UPDATE SET current = excluded.current`,
        ).run(record.id.trim(), Number.isSafeInteger(current) ? current : 0);
      }

      const goalLogEntries = Array.isArray(snapshot.goal_log)
        ? snapshot.goal_log
        : [];
      for (const item of goalLogEntries) {
        if (!item || typeof item !== "object") continue;
        const record = item as {
          id?: string;
          head_target?: number;
          day_end?: number;
        };
        if (typeof record.id !== "string" || record.id.trim().length === 0)
          continue;
        db.prepare(
          `INSERT INTO goal_log (id, head_target, day_end)
           VALUES (?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET head_target = excluded.head_target, day_end = excluded.day_end`,
        ).run(
          record.id.trim(),
          Number(record.head_target) || 0,
          Number(record.day_end) || 0,
        );
      }
    }

    db.close();
    return;
  }

  const db = new Database(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS updates (
      id TEXT PRIMARY KEY,
      current INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS goal_log (
      id TEXT PRIMARY KEY,
      head_target INTEGER NOT NULL,
      day_end INTEGER NOT NULL
    );
  `);
  db.close();
};

const readDatabase = () => {
  const db = new Database(DB_PATH);
  const settings = db.query("SELECT key, value FROM settings").all() as Array<{
    key: string;
    value: string;
  }>;
  const data: Record<string, unknown> = {
    head_target: 0,
    current: 0,
    day_end: 0,
    update: [],
    goal_log: [],
  };

  for (const { key, value } of settings) {
    if (key === "head_target" || key === "current" || key === "day_end") {
      data[key] = Number(value) || 0;
    }
  }

  data.update = db
    .query("SELECT id, current FROM updates ORDER BY id ASC")
    .all()
    .map((row) => ({
      id: String(row.id),
      current: Number(row.current) || 0,
    }));

  data.goal_log = db
    .query("SELECT id, head_target, day_end FROM goal_log ORDER BY id ASC")
    .all()
    .map((row) => ({
      id: String(row.id),
      head_target: Number(row.head_target) || 0,
      day_end: Number(row.day_end) || 0,
    }));

  db.close();
  return data;
};

export const readFile = async () => {
  await ensureDatabase();
  return readDatabase();
};

export const updateFile = async (data: any) => {
  await ensureDatabase();
  const db = new Database(DB_PATH);

  if (typeof data?.id === "string" && data.id.trim().length > 0) {
    db.prepare(
      `INSERT INTO updates (id, current)
       VALUES (?, ?)
       ON CONFLICT(id) DO UPDATE SET current = excluded.current`,
    ).run(data.id.trim(), Number(data.current) || 0);
    db.prepare(
      `INSERT INTO settings (key, value)
       VALUES ('current', ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    ).run(String(Number(data.current) || 0));
  }

  db.close();
  return await readFile();
};

export const updateGoal = async (payload: {
  head_target: number;
  day_end: number;
}) => {
  await ensureDatabase();
  const db = new Database(DB_PATH);
  const resetTimestamp = new Date().toISOString();

  db.prepare(
    `INSERT INTO goal_log (id, head_target, day_end)
     VALUES (?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET head_target = excluded.head_target, day_end = excluded.day_end`,
  ).run(
    resetTimestamp,
    Number(payload.head_target) || 0,
    Number(payload.day_end) || 0,
  );

  db.prepare(
    `INSERT INTO updates (id, current)
     VALUES (?, ?)
     ON CONFLICT(id) DO UPDATE SET current = excluded.current`,
  ).run(resetTimestamp, 0);

  db.prepare(
    `INSERT INTO settings (key, value)
     VALUES ('head_target', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
  ).run(String(Number(payload.head_target) || 0));

  db.prepare(
    `INSERT INTO settings (key, value)
     VALUES ('day_end', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
  ).run(String(Number(payload.day_end) || 0));

  db.prepare(
    `INSERT INTO settings (key, value)
     VALUES ('current', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
  ).run("0");

  db.close();
  return await readFile();
};
