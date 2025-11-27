"use client";

import { useEffect, useState, useRef } from "react";
import { Nav } from "@/components/nav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Download, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import Image from "next/image";
import confetti from "canvas-confetti";
import type { Photo } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";

export default function GalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const confettiTriggered = useRef(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPhotos = () => {
      fetch("/api/gallery")
        .then((res) => res.json())
        .then((data) => {
          setPhotos((prevPhotos) => {
            const prevAllDone = prevPhotos.length > 0 && prevPhotos.every((p) => p.status === "done");
            const currentAllDone = data.length > 0 && data.every((p: Photo) => p.status === "done");
            
            // Trigger confetti only when transitioning to all done state
            if (!confettiTriggered.current && !prevAllDone && currentAllDone) {
              confettiTriggered.current = true;
              setTimeout(() => {
                confetti({
                  particleCount: 100,
                  spread: 70,
                  origin: { y: 0.6 },
                });
              }, 500);
            }
            
            return data;
          });
        });
    };

    fetchPhotos();
    const interval = setInterval(fetchPhotos, 2000);

    return () => clearInterval(interval);
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

  const handleBulkApprove = async () => {
    if (selected.size === 0) return;
    toast({
      title: "Photos approved",
      description: `${selected.size} photo(s) have been approved.`,
    });
    setSelected(new Set());
  };

  const handleBulkReject = async () => {
    if (selected.size === 0) return;
    toast({
      title: "Photos rejected",
      description: `${selected.size} photo(s) have been rejected.`,
    });
    setSelected(new Set());
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
      <Nav />
      <div className="container mx-auto px-4 py-12">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gallery</h1>
            <p className="text-muted-foreground">
              {photos.length} processed photo{photos.length !== 1 ? "s" : ""}
            </p>
          </div>
          {selected.size > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAll}
                className="mr-2"
              >
                {selected.size === photos.length ? "Deselect All" : "Select All"}
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleBulkApprove}
                className="gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve ({selected.size})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkReject}
                className="gap-2"
              >
                <XCircle className="h-4 w-4" />
                Reject ({selected.size})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDownload}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download ({selected.size})
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete ({selected.size})
              </Button>
            </div>
          )}
        </div>

        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4">
          {photos.map((photo) => (
            <Card
              key={photo.id}
              className={`mb-4 break-inside-avoid cursor-pointer transition-all hover:shadow-lg ${
                selected.has(photo.id) ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => toggleSelect(photo.id)}
            >
              <CardContent className="p-0">
                <div className="relative aspect-square">
                  <Image
                    src={photo.url}
                    alt={photo.name}
                    fill
                    className="object-cover rounded-t-lg"
                  />
                  <div className="absolute top-2 left-2">
                    <Checkbox
                      checked={selected.has(photo.id)}
                      onCheckedChange={() => toggleSelect(photo.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-background/80 backdrop-blur-sm"
                    />
                  </div>
                  <div className="absolute top-2 right-2">
                    <Badge
                      variant={
                        photo.status === "done" ? "success" : "destructive"
                      }
                    >
                      {photo.status === "done" ? (
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {photo.status}
                    </Badge>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium truncate">{photo.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(photo.processed_at || photo.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

