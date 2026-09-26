import path from "node:path";

export const readFile = async () => {
  const file = Bun.file("./db.json");
  const json = await file.json();

  return json;
};

export const updateFile = async (data: any) => {
  const file = Bun.file("./db.json");
  const json = await file.json();

  json.update.push(data);
  json.current = data.current;
  await Bun.write(file, JSON.stringify(json));

  return await Bun.file("./db.json").json();
};

export const updateGoal = async (payload: {
  head_target: number;
  day_end: number;
}) => {
  const file = Bun.file("./db.json");
  const json = await file.json();

  json.head_target = payload.head_target;
  json.day_end = payload.day_end;
  await Bun.write(file, JSON.stringify(json));

  return await Bun.file("./db.json").json();
};
