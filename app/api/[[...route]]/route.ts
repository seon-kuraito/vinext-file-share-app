import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { files } from "@/db/schema";

// vinext runs server code in the workerd runtime, so `cloudflare:workers` is a native module
import { env } from "cloudflare:workers";

// Hono's Next.js route-handler adapter; not Vercel-bound: (req) => app.fetch(req)
import { handle } from "hono/vercel";

// basePath must match the route folder: the Request URL still carries /api
const app = new Hono().basePath("/api");

// Binding names come from wrangler.jsonc: d1_databases[] and r2_buckets[]
// Module scope is safe: reading a binding is not I/O, and drizzle() only wraps one
const db = drizzle(env.DB, { schema: { files } });
const bucket = env.BUCKET;

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

  // Read the clock once, so filePath, createdAt and expiresAt all mean the same instant
  const now = Date.now();

  // crypto is a Workers global: no import, no nodejs_compat flag
  const id = crypto.randomUUID();
  const fileName = file.name;
  const filePath = `/upload/${now}-${file.name}`;
  const contentType = file.type;
  const createdAt = new Date(now).toISOString();
  const expiresAt = new Date(now + (Number(expiration) * 24 * 60 * 60 * 1000)).toISOString();

  // R2 first: an object with no row is only wasted storage
  try {
    await bucket.put(filePath, file, { httpMetadata: { contentType } });
  } catch (error) {
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    }, 500);
  }

  // D1 second: the row makes the file visible, so it must not exist before the bytes do
  try {
    // $inferInsert derives the insert shape from the schema: a wrong or missing key fails the type check
    const data: typeof files.$inferInsert = {
      id,
      fileName,
      filePath,
      contentType,
      createdAt,
      expiresAt,
    };

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
    // Origin from the request works in dev and production; /api comes from basePath
    url: `${new URL(c.req.url).origin}/api/files/${id}`,
    expiresAt,
  });
});

// Next.js route handlers export one function per HTTP method, not a default export
export const GET = handle(app);
export const POST = handle(app);
