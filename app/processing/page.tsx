"use client";

import { useEffect, useState } from "react";
import { Nav } from "@/components/nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, ChevronUp, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import type { Photo } from "@/lib/db";

export default function ProcessingPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Initial fetch
    fetch("/api/photos")
      .then((res) => res.json())
      .then((data) => {
        const processing = data.filter(
          (p: Photo) => p.status === "queued" || p.status === "processing"
        );
        setPhotos(processing);
      });

    // SSE connection
    const eventSource = new EventSource("/api/events");

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "update") {
        setPhotos(data.photos);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      // Reconnect after 3 seconds
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getStatusBadge = (status: Photo["status"]) => {
    switch (status) {
      case "queued":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Queued
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="default" className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Processing
          </Badge>
        );
      case "done":
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Done
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Failed
          </Badge>
        );
    }
  };

  if (photos.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md">
          Skip to main content
        </a>
        <Nav />
        <main id="main-content" className="container mx-auto px-4 sm:px-6 py-6 sm:py-12">
          <Card>
            <CardContent className="p-6 sm:p-12 text-center">
              <p className="text-sm sm:text-base text-muted-foreground">
                No photos in the processing queue. Upload some photos to get started!
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md">
        Skip to main content
      </a>
      <Nav />
      <main id="main-content" className="container mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Processing Queue</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {photos.length} photo{photos.length !== 1 ? "s" : ""} in queue
          </p>
        </div>

        <div className="space-y-4">
          {photos.map((photo) => (
            <Card key={photo.id}>
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={photo.url}
                        alt={`Thumbnail of ${photo.name}`}
                        fill
                        sizes="64px"
                        className="object-cover"
                        loading="lazy"
                        quality={75}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg truncate">
                        {photo.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {getStatusBadge(photo.status)}
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          {photo.progress}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="min-h-[44px] min-w-[44px] flex-shrink-0"
                    onClick={() => toggleExpand(photo.id)}
                    aria-label={expanded.has(photo.id) ? `Collapse details for ${photo.name}` : `Expand details for ${photo.name}`}
                    aria-expanded={expanded.has(photo.id)}
                  >
                    {expanded.has(photo.id) ? (
                      <ChevronUp className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="h-5 w-5" aria-hidden="true" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm sm:text-base font-medium" id={`progress-label-${photo.id}`}>
                        Progress
                      </span>
                      <span className="text-sm sm:text-base text-muted-foreground" aria-live="polite" aria-atomic="true">
                        {photo.progress}%
                      </span>
                    </div>
                    <Progress 
                      value={photo.progress} 
                      className="h-2 sm:h-2.5" 
                      aria-labelledby={`progress-label-${photo.id}`}
                      aria-valuenow={photo.progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>

                  {expanded.has(photo.id) && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-semibold mb-2">
                        Processing Log
                      </h4>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {photo.logs && photo.logs.length > 0 ? (
                          photo.logs.map((log, idx) => (
                            <div
                              key={idx}
                              className="text-xs text-muted-foreground font-mono flex items-start gap-2"
                            >
                              <span className="text-muted-foreground/50">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </span>
                              <span>{log.message}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            No log entries yet
                          </p>
                        )}
                      </div>
                      {photo.error && (
                        <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                          Error: {photo.error}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {photos.length > 0 && `${photos.length} photo${photos.length !== 1 ? "s" : ""} in processing queue`}
      </div>
    </div>
  );
}

