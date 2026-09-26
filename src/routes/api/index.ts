import { Hono } from "hono";

import { readFile, updateFile } from "../../modules/read_file";
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
