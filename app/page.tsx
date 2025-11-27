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
      <Nav />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Upload Photos</h1>
            <p className="text-muted-foreground">
              Drag and drop your images or click to browse
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
            <CardContent className="p-12">
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="rounded-full bg-primary/10 p-6">
                  <Upload className="h-12 w-12 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold mb-2">
                    Drop your photos here
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    or click to browse
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button asChild>
                    <label htmlFor="file-upload" className="cursor-pointer">
                      Select Files
                    </label>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {files.length > 0 && (
            <div className="mt-8 space-y-4">
              <h2 className="text-xl font-semibold">Uploading Files</h2>
              {files.map((uploadFile) => (
                <Card key={uploadFile.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium truncate">
                            {uploadFile.file.name}
                          </p>
                          <div className="flex items-center gap-2">
                            {uploadFile.status === "success" && (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            )}
                            {uploadFile.status === "error" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeFile(uploadFile.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <Progress value={uploadFile.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
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
      </div>
    </div>
  );
}

