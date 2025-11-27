import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { createPhoto, initDatabase } from "@/lib/db";
import { startProcessing } from "@/lib/processing";
import { nanoid } from "nanoid";

export async function POST(request: NextRequest) {
  try {
    await initDatabase();

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const id = nanoid();
    const filename = `${id}-${file.name}`;

    // Upload to Vercel Blob Storage
    const blob = await put(filename, file, {
      access: "public",
      contentType: file.type,
    });

    // Create database record
    await createPhoto(id, file.name, blob.url);

    // Start processing
    startProcessing(id);

    return NextResponse.json({
      id,
      url: blob.url,
      name: file.name,
    });
  } catch (error) {
    console.error("Upload error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to upload file", details: errorMessage },
      { status: 500 }
    );
  }
}

