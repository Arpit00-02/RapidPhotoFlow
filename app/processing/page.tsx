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
        <Nav />
        <div className="container mx-auto px-4 py-12">
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                No photos in the processing queue. Upload some photos to get started!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <div className="container mx-auto px-4 py-12">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Processing Queue</h1>
          <p className="text-muted-foreground">
            {photos.length} photo{photos.length !== 1 ? "s" : ""} in queue
          </p>
        </div>

        <div className="space-y-4">
          {photos.map((photo) => (
            <Card key={photo.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={photo.url}
                        alt={photo.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">
                        {photo.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(photo.status)}
                        <span className="text-sm text-muted-foreground">
                          {photo.progress}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleExpand(photo.id)}
                  >
                    {expanded.has(photo.id) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm text-muted-foreground">
                        {photo.progress}%
                      </span>
                    </div>
                    <Progress value={photo.progress} />
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
      </div>
    </div>
  );
}

