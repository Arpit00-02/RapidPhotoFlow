import { sql } from "@vercel/postgres";

export interface Photo {
  id: string;
  name: string;
  url: string;
  status: "queued" | "processing" | "done" | "failed";
  progress: number;
  uploaded_at: string;
  processed_at: string | null;
  error: string | null;
  logs: Array<{ timestamp: string; message: string }>;
}

export async function initDatabase() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS photos (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'queued',
        progress INTEGER NOT NULL DEFAULT 0,
        uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
        processed_at TIMESTAMP,
        error TEXT,
        logs JSONB DEFAULT '[]'::jsonb
      )
    `;
  } catch (error) {
    console.error("Database initialization error:", error);
  }
}

export async function createPhoto(
  id: string,
  name: string,
  url: string
): Promise<void> {
  await sql`
    INSERT INTO photos (id, name, url, status, progress, logs)
    VALUES (${id}, ${name}, ${url}, 'queued', 0, '[]'::jsonb)
  `;
}

export async function getPhoto(id: string): Promise<Photo | null> {
  const result = await sql`
    SELECT * FROM photos WHERE id = ${id}
  `;
  if (result.rows.length === 0) return null;
  return result.rows[0] as Photo;
}

export async function getAllPhotos(): Promise<Photo[]> {
  const result = await sql`
    SELECT * FROM photos ORDER BY uploaded_at DESC
  `;
  return result.rows as Photo[];
}

export async function getProcessingPhotos(): Promise<Photo[]> {
  const result = await sql`
    SELECT * FROM photos 
    WHERE status IN ('queued', 'processing')
    ORDER BY uploaded_at ASC
  `;
  return result.rows as Photo[];
}

export async function getDonePhotos(): Promise<Photo[]> {
  const result = await sql`
    SELECT * FROM photos 
    WHERE status = 'done'
    ORDER BY processed_at DESC
  `;
  return result.rows as Photo[];
}

export async function updatePhoto(
  id: string,
  updates: Partial<{
    status: string;
    progress: number;
    processed_at: string | null;
    error: string | null;
    logs: Array<{ timestamp: string; message: string }>;
  }>
): Promise<void> {
  if (updates.status !== undefined) {
    await sql`UPDATE photos SET status = ${updates.status} WHERE id = ${id}`;
  }
  if (updates.progress !== undefined) {
    await sql`UPDATE photos SET progress = ${updates.progress} WHERE id = ${id}`;
  }
  if (updates.processed_at !== undefined) {
    await sql`UPDATE photos SET processed_at = ${updates.processed_at} WHERE id = ${id}`;
  }
  if (updates.error !== undefined) {
    await sql`UPDATE photos SET error = ${updates.error} WHERE id = ${id}`;
  }
  if (updates.logs !== undefined) {
    await sql`UPDATE photos SET logs = ${JSON.stringify(updates.logs)}::jsonb WHERE id = ${id}`;
  }
}

export async function deletePhotos(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  // Delete one by one to avoid SQL injection issues with arrays
  for (const id of ids) {
    await sql`DELETE FROM photos WHERE id = ${id}`;
  }
}

