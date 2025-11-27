import { NextRequest, NextResponse } from "next/server";
import { getProcessingPhotos } from "@/lib/db";
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

