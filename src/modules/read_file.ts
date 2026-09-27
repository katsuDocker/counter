import path from "node:path";

export const readFile = async () => {
  const file = Bun.file("./db.json");
  const json = await file.json();

  if (!Array.isArray(json.goal_log)) {
    json.goal_log = [];
  }

  return json;
};

export const updateFile = async (data: any) => {
  const file = Bun.file("./db.json");
  const json = await file.json();

  if (!Array.isArray(json.update)) {
    json.update = [];
  }

  json.update.push(data);
  json.current = data.current;
  await Bun.write(file, JSON.stringify(json, null, 2));

  return await Bun.file("./db.json").json();
};

export const updateGoal = async (payload: {
  head_target: number;
  day_end: number;
}) => {
  const file = Bun.file("./db.json");
  const json = await file.json();

  if (!Array.isArray(json.goal_log)) {
    json.goal_log = [];
  }

  if (!Array.isArray(json.update)) {
    json.update = [];
  }

  const resetTimestamp = new Date().toISOString();
  json.goal_log.push({
    id: resetTimestamp,
    head_target: payload.head_target,
    day_end: payload.day_end,
  });

  json.update.push({
    id: resetTimestamp,
    current: 0,
  });

  json.head_target = payload.head_target;
  json.day_end = payload.day_end;
  json.current = 0;
  await Bun.write(file, JSON.stringify(json, null, 2));

  return await Bun.file("./db.json").json();
};
