import { NextRequest } from "next/server";
import { getProcessingPhotos } from "@/lib/db";
import { processStep, startProcessing } from "@/lib/processing";

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const interval = setInterval(async () => {
        try {
          // Process photos
          const photos = await getProcessingPhotos();
          for (const photo of photos) {
            if (photo.status === "queued") {
              startProcessing(photo.id);
            } else if (photo.status === "processing") {
              await processStep(photo.id);
            }
          }

          // Get updated photos
          const updatedPhotos = await getProcessingPhotos();
          send({ type: "update", photos: updatedPhotos });
        } catch (error) {
          console.error("SSE error:", error);
          clearInterval(interval);
          controller.close();
        }
      }, 1000);

      // Send initial data
      try {
        const photos = await getProcessingPhotos();
        send({ type: "update", photos });
      } catch (error) {
        console.error("SSE initial error:", error);
      }

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

