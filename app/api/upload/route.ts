import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { createPhoto, initDatabase, getPhoto, updatePhoto } from "@/lib/db";
import { startProcessing } from "@/lib/processing";
import { nanoid } from "nanoid";

const MAX_RETRIES = 3;

export async function POST(request: NextRequest) {
  try {
    await initDatabase();

    const formData = await request.formData();
    const file = formData.get("file") as File;
    let photoId = formData.get("photoId") as string | null; // For retries

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // If this is a retry, check retry count from database
    let currentRetryCount = 0;
    if (photoId) {
      const existingPhoto = await getPhoto(photoId);
      if (existingPhoto) {
        currentRetryCount = (existingPhoto as any).retry_count || 0;
        if (currentRetryCount >= MAX_RETRIES) {
          return NextResponse.json(
            { error: "Max retries exceeded", retryCount: currentRetryCount },
            { status: 400 }
          );
        }
      } else {
        // Photo doesn't exist, treat as new upload
        photoId = null;
      }
    }

    const id = photoId || nanoid();
    const filename = `${id}-${file.name}`;

    try {
      // Upload to Vercel Blob Storage
      const blob = await put(filename, file, {
        access: "public",
        contentType: file.type,
      });

      // Create or update database record
      if (photoId) {
        // This is a retry - update existing record
        const existingPhoto = await getPhoto(photoId);
        const existingRetryCount = (existingPhoto as any)?.retry_count || 0;
        await updatePhoto(photoId, {
          status: "queued",
          progress: 0,
          error: null,
          url: blob.url, // Update URL on successful retry
          retry_count: existingRetryCount, // Keep the same retry count, it will be incremented on failure
        });
      } else {
        // New upload
        await createPhoto(id, file.name, blob.url);
      }

      // Start processing
      startProcessing(id);

      return NextResponse.json({
        id,
        url: blob.url,
        name: file.name,
      });
    } catch (uploadError) {
      // Upload failed - increment retry count
      const errorMessage = uploadError instanceof Error ? uploadError.message : "Unknown error";
      const newRetryCount = currentRetryCount + 1;
      
      if (photoId) {
        // This is a retry that failed - increment retry count
        await updatePhoto(photoId, {
          status: "failed",
          error: `Upload failed: ${errorMessage}`,
          retry_count: newRetryCount,
        });

        if (newRetryCount < MAX_RETRIES) {
          // Can be retried again
          return NextResponse.json(
            { error: "Upload failed, can retry", retryCount: newRetryCount, id: photoId, canRetry: true },
            { status: 500 }
          );
        } else {
          // Max retries reached
          return NextResponse.json(
            { error: "Max retries exceeded", retryCount: newRetryCount, id: photoId, canRetry: false },
            { status: 500 }
          );
        }
      } else {
        // New upload failed - create failed record with retry_count = 1
        try {
          await createPhoto(id, file.name, "");
          await updatePhoto(id, {
            status: "failed",
            error: `Upload failed: ${errorMessage}`,
            retry_count: 1,
          });
        } catch (dbError) {
          // If photo already exists, just update it
          await updatePhoto(id, {
            status: "failed",
            error: `Upload failed: ${errorMessage}`,
            retry_count: 1,
          });
        }
        
        return NextResponse.json(
          { error: "Failed to upload file", details: errorMessage, id, retryCount: 1, canRetry: true },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error("Upload error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to upload file", details: errorMessage },
      { status: 500 }
    );
  }
}

