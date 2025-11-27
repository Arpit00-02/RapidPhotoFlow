import { NextRequest, NextResponse } from "next/server";
import { getProcessingPhotos, getPhoto } from "@/lib/db";
import { processStep, startProcessing } from "@/lib/processing";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    const photos = await getProcessingPhotos();

    for (const photo of photos) {
      if (photo.status === "queued") {
        startProcessing(photo.id);
      } else if (photo.status === "processing") {
        await processStep(photo.id);
      }
    }
    
    // Check for failed photos that can be retried (processing failures, not upload failures)
    // Failed photos with a URL means upload succeeded but processing failed
    const { prisma } = await import("@/lib/prisma");
    const failedPhotos = await prisma.photo.findMany({
      where: {
        status: "failed",
        url: { not: "" }, // Has URL means upload succeeded
      },
    });
    
    for (const photo of failedPhotos) {
      const photoData = await getPhoto(photo.id);
      const retryCount = (photoData as any)?.retry_count || 0;
      if (retryCount < 3) {
        // Retry processing by setting status back to queued
        await import("@/lib/db").then(({ updatePhoto }) => 
          updatePhoto(photo.id, {
            status: "queued",
            progress: 0,
            error: null,
          })
        );
        startProcessing(photo.id);
      }
    }

    revalidatePath("/processing");
    revalidatePath("/gallery");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Processing error:", error);
    return NextResponse.json(
      { error: "Failed to process photos" },
      { status: 500 }
    );
  }
}

