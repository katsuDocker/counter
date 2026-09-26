import { Hono } from "hono";

import { readFile, updateFile, updateGoal } from "../../modules/read_file";
import type { iPayload } from "../../modules/interface/payload";

const apiRoutes = new Hono();

apiRoutes.get("/", (c) => {
  return c.text("Hello Hono!");
});

apiRoutes.get("/read", async (c) => {
  console.log(await readFile());

  return c.text("Hello Hono test!");
});

apiRoutes.get("/daily", async (c) => {
  const data = await readFile();
  return c.json(data);
});

apiRoutes.post("/goals", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Request body must be valid JSON." }, 400);
  }

  if (typeof body !== "object" || body === null) {
    return c.json({ error: "Request body must contain goal values." }, 400);
  }

  const { head_target, day_end } = body as {
    head_target?: number;
    day_end?: number;
  };

  if (
    typeof head_target !== "number" ||
    !Number.isFinite(head_target) ||
    head_target < 0
  ) {
    return c.json({ error: "Target must be a non-negative number." }, 400);
  }

  if (
    typeof day_end !== "number" ||
    !Number.isFinite(day_end) ||
    day_end <= 0
  ) {
    return c.json({ error: "Deadline must be a positive timestamp." }, 400);
  }

  const updated = await updateGoal({ head_target, day_end });
  return c.json(updated);
});

apiRoutes.post("/updates", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Request body must be valid JSON." }, 400);
  }

  if (typeof body !== "object" || body === null) {
    return c.json({ error: "Request body must contain an update." }, 400);
  }

  const { id, current } = body as Partial<iPayload>;
  if (typeof id !== "string" || id.trim().length === 0) {
    return c.json({ error: "Update id is required." }, 400);
  }
  if (
    typeof current !== "number" ||
    !Number.isSafeInteger(current) ||
    current < 0
  ) {
    return c.json(
      { error: "Current total must be a non-negative whole number." },
      400,
    );
  }

  const updated = await updateFile({ id: id.trim(), current });
  return c.json(updated);
});

export default apiRoutes;
