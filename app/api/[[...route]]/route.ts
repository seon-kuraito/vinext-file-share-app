import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { files } from "@/db/schema";

// vinext runs server code in workerd, so `cloudflare:workers` is a native module
import { env } from "cloudflare:workers";

// Hono's Next.js route-handler adapter; not Vercel-bound: (req) => app.fetch(req)
import { handle } from "hono/vercel";

// basePath must match the route folder: the Request URL still carries /api
const app = new Hono().basePath("/api");

// Binding name comes from wrangler.jsonc d1_databases[].binding
// Module scope is safe: drizzle() only wraps the binding, it runs no I/O
const db = drizzle(env.DB, { schema: { files } });

app.get("/files", async (c) => {
  // Runs: SELECT id, fileName, filePath, contentType, createdAt, expiresAt FROM files
  // SELECT returns a result set: always an array, even for a single row
  const rows = await db.select().from(files);

  return c.json(rows);
});

app.post("/upload", async (c) => {
  const formData = await c.req.formData();

  const file = formData.get("file");
  const expiration = formData.get("expiration");

  // formData.get returns string | File | null, so narrow before reading File fields
  if (!(file instanceof File) || typeof expiration !== "string") {
    return c.json({
      success: false,
      message: "Missing required fields",
    }, 400);
  }

  // $inferInsert derives the insert shape from the schema, so a wrong key fails here
  const data: typeof files.$inferInsert = {
    // id: the schema $default generates a UUID on insert
    fileName: file.name,
    filePath: `/upload/${Date.now()}-${file.name}`,
    contentType: file.type,
    // createdAt: the schema $default fills it on insert
    expiresAt: new Date(Date.now() + (Number(expiration) * 24 * 60 * 60 * 1000)).toISOString(),
  };

  try {
    // Runs: INSERT INTO files (id, fileName, filePath, contentType, createdAt, expiresAt) VALUES (?, ?, ?, ?, ?, ?)
    // Each ? is a bound parameter: drizzle sends the six values apart from the statement
    await db.insert(files).values(data);
  } catch (error) {
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    }, 500);
  }

  return c.json({
    success: true,
    message: "File uploaded successfully",
    filePath: data.filePath,
    expiresAt: data.expiresAt,
  });
});

// Next.js route handlers export one function per HTTP method, not a default export
export const GET = handle(app);
export const POST = handle(app);
