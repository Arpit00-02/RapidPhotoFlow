"use client";

import { useEffect, useState, useRef } from "react";
import { Nav } from "@/components/nav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Download, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import Image from "next/image";
import type { Photo } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";

export default function GalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const confettiTriggered = useRef(false);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;
    
    const fetchPhotos = async () => {
      try {
        const res = await fetch("/api/gallery", {
          cache: "no-store",
        });
        if (!res.ok) return;
        
        const data = await res.json();
        if (!isMounted) return;
        
        setPhotos((prevPhotos) => {
          const prevAllDone = prevPhotos.length > 0 && prevPhotos.every((p) => p.status === "done");
          const currentAllDone = data.length > 0 && data.every((p: Photo) => p.status === "done");
          
          // Trigger confetti only when transitioning to all done state
          if (!confettiTriggered.current && !prevAllDone && currentAllDone) {
            confettiTriggered.current = true;
            setTimeout(async () => {
              const confettiFn = await import("canvas-confetti").then((mod) => mod.default);
              confettiFn({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
              });
            }, 500);
          }
          
          return data;
        });
      } catch (error) {
        console.error("Error fetching photos:", error);
      }
    };

    // Initial fetch
    fetchPhotos();

    // Only poll if we need to check for new processed photos
    // Poll every 5 seconds (reduced from 2 seconds)
    // Stop polling after 2 minutes to save resources
    let pollCount = 0;
    const maxPolls = 24; // 2 minutes at 5 second intervals
    
    const interval = setInterval(() => {
      if (!isMounted) {
        clearInterval(interval);
        return;
      }
      pollCount++;
      if (pollCount >= maxPolls) {
        clearInterval(interval);
        return;
      }
      fetchPhotos();
    }, 5000); // Poll every 5 seconds instead of 2

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === photos.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(photos.map((p) => p.id)));
    }
  };

  const handleBulkDownload = async () => {
    if (selected.size === 0) return;
    const selectedPhotos = photos.filter((p) => selected.has(p.id));
    for (const photo of selectedPhotos) {
      const link = document.createElement("a");
      link.href = photo.url;
      link.download = photo.name;
      link.click();
    }
    toast({
      title: "Download started",
      description: `Downloading ${selected.size} photo(s)...`,
    });
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    try {
      await fetch("/api/gallery", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      setPhotos((prev) => prev.filter((p) => !selected.has(p.id)));
      setSelected(new Set());
    toast({
      title: "Photos deleted",
      description: `${ids.length} photo(s) have been deleted.`,
      variant: "success",
    });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete photos.",
        variant: "destructive",
      });
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
                No processed photos yet. Check the processing page to see your photos being processed!
              </p>
            </CardContent>
          </Card>
        </div>
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
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Gallery</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {photos.length} processed photo{photos.length !== 1 ? "s" : ""}
            </p>
          </div>
          {selected.size > 0 && (
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full sm:w-auto">
              <Button
                variant="outline"
                size="default"
                onClick={selectAll}
                aria-label={selected.size === photos.length ? "Deselect all photos" : "Select all photos"}
                className="min-h-[44px] flex-1 sm:flex-initial text-sm sm:text-base"
              >
                {selected.size === photos.length ? "Deselect All" : "Select All"}
              </Button>
              <Button
                variant="outline"
                size="default"
                onClick={handleBulkDownload}
                aria-label={`Download ${selected.size} selected photo${selected.size !== 1 ? "s" : ""}`}
                className="gap-2 min-h-[44px] flex-1 sm:flex-initial text-sm sm:text-base"
              >
                <Download className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                <span className="hidden xs:inline">Download</span>
                <span className="xs:hidden">({selected.size})</span>
              </Button>
              <Button
                variant="destructive"
                size="default"
                onClick={handleBulkDelete}
                aria-label={`Delete ${selected.size} selected photo${selected.size !== 1 ? "s" : ""}`}
                className="gap-2 min-h-[44px] flex-1 sm:flex-initial text-sm sm:text-base"
              >
                <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                <span className="hidden xs:inline">Delete</span>
                <span className="xs:hidden">({selected.size})</span>
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 gallery-grid">
          {photos.map((photo, index) => (
            <Card
              key={photo.id}
              role="button"
              tabIndex={0}
              aria-label={`Select photo ${photo.name}`}
              aria-pressed={selected.has(photo.id)}
              className={`cursor-pointer transition-all hover:shadow-lg active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                selected.has(photo.id) ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => toggleSelect(photo.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleSelect(photo.id);
                }
              }}
            >
              <CardContent className="p-0">
                <div className="relative aspect-square">
                  <Image
                    src={photo.url}
                    alt={`Photo: ${photo.name}`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover rounded-t-lg"
                    loading={index < 4 ? "eager" : "lazy"}
                    priority={index < 4}
                    quality={85}
                  />
                  <div className="absolute top-2 sm:top-3 left-2 sm:left-3">
                    <Checkbox
                      checked={selected.has(photo.id)}
                      onCheckedChange={() => toggleSelect(photo.id)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Select ${photo.name}`}
                      className="bg-background/80 backdrop-blur-sm h-6 w-6 sm:h-5 sm:w-5 border-2"
                    />
                  </div>
                  <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                    <Badge
                      variant={
                        photo.status === "done" ? "success" : "destructive"
                      }
                      className="text-xs px-2 py-1"
                    >
                      {photo.status === "done" ? (
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      <span className="hidden sm:inline">{photo.status}</span>
                    </Badge>
                  </div>
                </div>
                <div className="p-3 sm:p-4">
                  <p className="text-sm sm:text-base font-medium truncate">{photo.name}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    {new Date(photo.processed_at || photo.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {selected.size > 0 && `${selected.size} photo${selected.size !== 1 ? "s" : ""} selected`}
      </div>
    </div>
  );
}

