import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { files } from "@/db/schema";

// vinext runs server code in workerd, so `cloudflare:workers` is a native module
import { env } from "cloudflare:workers";

// Hono's Next.js route-handler adapter; not Vercel-bound: (req) => app.fetch(req)
import { handle } from "hono/vercel";

// basePath must match the route folder: the Request URL still carries /api
const app = new Hono().basePath("/api");

app.get("/files", async (c) => {
  // Binding name comes from wrangler.jsonc d1_databases[].binding
  const db = drizzle(env.DB, { schema: { files } });

  // SELECT returns a result set: always an array, even for a single row
  const rows = await db.select().from(files);

  return c.json(rows);
});

// Next.js route handlers export one function per HTTP method, not a default export
export const GET = handle(app);
