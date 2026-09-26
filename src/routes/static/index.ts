import { Hono } from "hono";

const staticRoutes = new Hono();

staticRoutes.get("/", (c) => {
  return c.text("Hello Hono!");
});

export default staticRoutes;
