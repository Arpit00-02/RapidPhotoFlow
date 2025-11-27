import { NextRequest } from "next/server";
import { getProcessingPhotos } from "@/lib/db";
import { processStep, startProcessing } from "@/lib/processing";

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let isClosed = false;
      let interval: NodeJS.Timeout | null = null;

      const close = () => {
        if (isClosed) return;
        isClosed = true;
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
        try {
          controller.close();
        } catch (error) {
          // Controller might already be closed, ignore
        }
      };

      const send = (data: any) => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (error) {
          // Controller might be closed, cleanup
          close();
        }
      };

      interval = setInterval(async () => {
        if (isClosed) {
          if (interval) {
            clearInterval(interval);
            interval = null;
          }
          return;
        }

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
          close();
        }
      }, 1000);

      // Send initial data
      try {
        const photos = await getProcessingPhotos();
        send({ type: "update", photos });
      } catch (error) {
        console.error("SSE initial error:", error);
        close();
      }

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        close();
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

