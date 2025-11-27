import { updatePhoto, getPhoto } from "./db";

// Store processing state in memory (will be reset on serverless cold start, but that's okay for demo)
const processingState = new Map<
  string,
  {
    startTime: number;
    duration: number;
    willFail: boolean;
    logEvents: Array<{ timestamp: string; message: string }>;
  }
>();

export function startProcessing(photoId: string) {
  if (processingState.has(photoId)) {
    return; // Already processing
  }

  const duration = 8000 + Math.random() * 22000; // 8-30 seconds
  const willFail = Math.random() < 0.05; // 5% failure rate
  const startTime = Date.now();
  const logEvents: Array<{ timestamp: string; message: string }> = [];

  processingState.set(photoId, {
    startTime,
    duration,
    willFail,
    logEvents,
  });

  const addLog = (message: string) => {
    logEvents.push({
      timestamp: new Date().toISOString(),
      message,
    });
  };

  addLog("Processing started");
  updatePhoto(photoId, {
    status: "processing",
    progress: 0,
    logs: logEvents,
  });
}

export async function processStep(photoId: string): Promise<boolean> {
  const state = processingState.get(photoId);
  if (!state) {
    // Try to get from DB and restart if needed
    const photo = await getPhoto(photoId);
    if (photo && (photo.status === "queued" || photo.status === "processing")) {
      startProcessing(photoId);
      return true;
    }
    return false;
  }

  const { startTime, duration, willFail, logEvents } = state;
  const elapsed = Date.now() - startTime;
  const progress = Math.min(100, Math.floor((elapsed / duration) * 100));

  const addLog = (message: string) => {
    logEvents.push({
      timestamp: new Date().toISOString(),
      message,
    });
  };

  if (willFail && progress > 30 && progress < 70) {
    // Random failure between 30-70%
    processingState.delete(photoId);
    
    // Get current retry count from database
    const photo = await getPhoto(photoId);
    const currentRetryCount = (photo as any)?.retry_count || 0;
    const MAX_PROCESSING_RETRIES = 3;
    const newRetryCount = currentRetryCount + 1;
    
    addLog(`Processing failed: Unexpected error occurred (Attempt ${newRetryCount}/${MAX_PROCESSING_RETRIES})`);
    
    if (newRetryCount < MAX_PROCESSING_RETRIES) {
      // Can retry - set status to queued and reset progress
      await updatePhoto(photoId, {
        status: "queued",
        progress: 0,
        error: null,
        logs: logEvents,
        retry_count: newRetryCount,
      });
      addLog("Retrying processing...");
      // Restart processing
      startProcessing(photoId);
      return true; // Continue processing
    } else {
      // Max retries reached
      await updatePhoto(photoId, {
        status: "failed",
        progress: progress,
        error: "Processing failed after multiple attempts",
        logs: logEvents,
        retry_count: newRetryCount,
      });
      return false;
    }
  }

  if (progress < 20) {
    if (logEvents.length === 1) addLog("Analyzing image metadata");
  } else if (progress < 40) {
    if (logEvents.length === 2) addLog("Extracting features");
  } else if (progress < 60) {
    if (logEvents.length === 3) addLog("Applying enhancements");
  } else if (progress < 80) {
    if (logEvents.length === 4) addLog("Optimizing image");
  } else if (progress < 95) {
    if (logEvents.length === 5) addLog("Finalizing output");
  }

  if (progress >= 100) {
    processingState.delete(photoId);
    addLog("Processing completed successfully");
    await updatePhoto(photoId, {
      status: "done",
      progress: 100,
      logs: logEvents,
      processed_at: new Date().toISOString(),
    });
    return false;
  }

  await updatePhoto(photoId, {
    status: "processing",
    progress: progress,
    logs: logEvents,
  });

  return true;
}

