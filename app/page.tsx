"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Nav } from "@/components/nav";
import { useToast } from "@/hooks/use-toast";

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: "uploading" | "success" | "error";
  error?: string;
}

export default function UploadPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const uploadFile = useCallback(async (file: File) => {
    const id = Math.random().toString(36).substring(7);
    const uploadFile: UploadFile = {
      file,
      id,
      progress: 0,
      status: "uploading",
    };

    setFiles((prev) => [...prev, uploadFile]);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setFiles((prev) =>
            prev.map((f) =>
              f.id === id ? { ...f, progress } : f
            )
          );
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === id ? { ...f, status: "success", progress: 100 } : f
            )
          );
          toast({
            title: "Upload successful",
            description: `${file.name} has been uploaded and queued for processing.`,
            variant: "success",
          });
          setTimeout(() => {
            setFiles((prev) => prev.filter((f) => f.id !== id));
            router.push("/processing");
          }, 1500);
        } else {
          throw new Error("Upload failed");
        }
      });

      xhr.addEventListener("error", () => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === id
              ? { ...f, status: "error", error: "Upload failed" }
              : f
          )
        );
        toast({
          title: "Upload failed",
          description: `Failed to upload ${file.name}. Please try again.`,
          variant: "destructive",
        });
      });

      xhr.open("POST", "/api/upload");
      xhr.send(formData);
    } catch (error) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === id
            ? { ...f, status: "error", error: "Upload failed" }
            : f
        )
      );
      toast({
        title: "Upload failed",
        description: `Failed to upload ${file.name}. Please try again.`,
        variant: "destructive",
      });
    }
  }, [router, toast]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/")
      );

      droppedFiles.forEach((file) => uploadFile(file));
    },
    [uploadFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []).filter((file) =>
        file.type.startsWith("image/")
      );
      selectedFiles.forEach((file) => uploadFile(file));
    },
    [uploadFile]
  );

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="min-h-screen bg-background">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md">
        Skip to main content
      </a>
      <Nav />
      <main id="main-content" className="container mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Upload Photos</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Drag and drop your images or tap to browse
            </p>
          </div>

          <Card
            className={`border-2 border-dashed transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <CardContent className="p-6 sm:p-8 md:p-12">
              <div className="flex flex-col items-center justify-center gap-4 sm:gap-6">
                <div className="rounded-full bg-primary/10 p-4 sm:p-6">
                  <Upload className="h-8 w-8 sm:h-12 sm:w-12 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-base sm:text-lg font-semibold mb-2">
                    Drop your photos here
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
                    or tap to browse
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                    id="file-upload"
                    aria-label="Select image files to upload"
                  />
                  <Button asChild size="lg" className="min-h-[44px] px-6">
                    <label htmlFor="file-upload" className="cursor-pointer" role="button" tabIndex={0} onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        document.getElementById("file-upload")?.click();
                      }
                    }}>
                      Select Files
                    </label>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {files.length > 0 && (
            <div className="mt-6 sm:mt-8 space-y-3 sm:space-y-4">
              <h2 className="text-lg sm:text-xl font-semibold">Uploading Files</h2>
              {files.map((uploadFile) => (
                <Card key={uploadFile.id}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2 gap-2">
                          <p className="text-sm sm:text-base font-medium truncate">
                            {uploadFile.file.name}
                          </p>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {uploadFile.status === "success" && (
                              <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
                            )}
                            {uploadFile.status === "error" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="min-h-[44px] min-w-[44px]"
                                onClick={() => removeFile(uploadFile.id)}
                                aria-label={`Remove ${uploadFile.file.name} from upload queue`}
                              >
                                <X className="h-5 w-5" aria-hidden="true" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <Progress value={uploadFile.progress} className="h-2 sm:h-2.5" />
                        <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                          {uploadFile.progress}% •{" "}
                          {uploadFile.status === "uploading"
                            ? "Uploading..."
                            : uploadFile.status === "success"
                            ? "Uploaded successfully"
                            : uploadFile.error}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {files.length > 0 && `${files.length} file${files.length !== 1 ? "s" : ""} uploading`}
      </div>
    </div>
  );
}

