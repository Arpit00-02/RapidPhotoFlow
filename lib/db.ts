import { prisma } from "./prisma";

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
    // Prisma will create the table automatically when we push the schema
    await prisma.$connect();
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  }
}

export async function createPhoto(
  id: string,
  name: string,
  url: string
): Promise<void> {
  await prisma.photo.create({
    data: {
      id,
      name,
      url,
      status: "queued",
      progress: 0,
      logs: [],
    },
  });
}

export async function getPhoto(id: string): Promise<Photo | null> {
  const photo = await prisma.photo.findUnique({
    where: { id },
  });
  if (!photo) return null;
  
  return {
    id: photo.id,
    name: photo.name,
    url: photo.url,
    status: photo.status as Photo["status"],
    progress: photo.progress,
    uploaded_at: photo.uploaded_at.toISOString(),
    processed_at: photo.processed_at?.toISOString() || null,
    error: photo.error,
    logs: (photo.logs as any) || [],
  };
}

export async function getAllPhotos(): Promise<Photo[]> {
  const photos = await prisma.photo.findMany({
    orderBy: { uploaded_at: "desc" },
  });
  
  return photos.map((photo) => ({
    id: photo.id,
    name: photo.name,
    url: photo.url,
    status: photo.status as Photo["status"],
    progress: photo.progress,
    uploaded_at: photo.uploaded_at.toISOString(),
    processed_at: photo.processed_at?.toISOString() || null,
    error: photo.error,
    logs: (photo.logs as any) || [],
  }));
}

export async function getProcessingPhotos(): Promise<Photo[]> {
  const photos = await prisma.photo.findMany({
    where: {
      status: {
        in: ["queued", "processing"],
      },
    },
    orderBy: { uploaded_at: "asc" },
  });
  
  return photos.map((photo) => ({
    id: photo.id,
    name: photo.name,
    url: photo.url,
    status: photo.status as Photo["status"],
    progress: photo.progress,
    uploaded_at: photo.uploaded_at.toISOString(),
    processed_at: photo.processed_at?.toISOString() || null,
    error: photo.error,
    logs: (photo.logs as any) || [],
  }));
}

export async function getDonePhotos(): Promise<Photo[]> {
  const photos = await prisma.photo.findMany({
    where: {
      status: "done",
    },
    orderBy: { processed_at: "desc" },
  });
  
  return photos.map((photo) => ({
    id: photo.id,
    name: photo.name,
    url: photo.url,
    status: photo.status as Photo["status"],
    progress: photo.progress,
    uploaded_at: photo.uploaded_at.toISOString(),
    processed_at: photo.processed_at?.toISOString() || null,
    error: photo.error,
    logs: (photo.logs as any) || [],
  }));
}

export async function updatePhoto(
  id: string,
  updates: Partial<{
    status: string;
    progress: number;
    processed_at: string | null;
    error: string | null;
    logs: Array<{ timestamp: string; message: string }>;
    retry_count: number;
    url: string;
  }>
): Promise<void> {
  const data: any = {};
  
  if (updates.status !== undefined) {
    data.status = updates.status;
  }
  if (updates.progress !== undefined) {
    data.progress = updates.progress;
  }
  if (updates.processed_at !== undefined) {
    data.processed_at = updates.processed_at ? new Date(updates.processed_at) : null;
  }
  if (updates.error !== undefined) {
    data.error = updates.error;
  }
  if (updates.logs !== undefined) {
    data.logs = updates.logs;
  }
  if (updates.retry_count !== undefined) {
    data.retry_count = updates.retry_count;
  }
  if (updates.url !== undefined) {
    data.url = updates.url;
  }
  
  await prisma.photo.update({
    where: { id },
    data,
  });
}

export async function getFailedPhotos(): Promise<Photo[]> {
  const photos = await prisma.photo.findMany({
    where: {
      status: "failed",
      retry_count: {
        lt: 3, // Only get photos that haven't exceeded max retries
      },
    } as any,
    orderBy: { uploaded_at: "asc" },
  });
  
  return photos.map((photo) => ({
    id: photo.id,
    name: photo.name,
    url: photo.url,
    status: photo.status as Photo["status"],
    progress: photo.progress,
    uploaded_at: photo.uploaded_at.toISOString(),
    processed_at: photo.processed_at?.toISOString() || null,
    error: photo.error,
    logs: (photo.logs as any) || [],
  }));
}

export async function deletePhotos(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await prisma.photo.deleteMany({
    where: {
      id: {
        in: ids,
      },
    },
  });
}
