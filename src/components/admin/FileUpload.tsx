"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, FileText, Image as ImageIcon } from "lucide-react";

interface FileUploadProps {
  accept?: string;
  onUpload: (url: string) => void;
  currentUrl?: string;
  label?: string;
}

export default function FileUpload({
  accept = "image/*",
  onUpload,
  currentUrl,
  label = "Upload file",
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isImage = accept.includes("image");

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Upload failed");
        }

        const { url } = await res.json();
        setPreview(isImage ? url : file.name);
        onUpload(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [onUpload, isImage]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const clear = () => {
    setPreview(null);
    setError(null);
    onUpload("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm text-text-secondary">{label}</label>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
          dragOver
            ? "border-gold bg-gold/5"
            : "border-glass-border hover:border-gold/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-text-secondary">Uploading...</span>
          </div>
        ) : preview ? (
          <div className="flex items-center gap-3">
            {isImage ? (
              <img
                src={preview}
                alt="Preview"
                className="w-16 h-16 object-cover rounded"
              />
            ) : (
              <FileText className="w-8 h-8 text-gold" />
            )}
            <span className="text-sm text-text-primary truncate flex-1">
              {isImage ? "Image uploaded" : preview}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                clear();
              }}
              className="p-1 text-text-muted hover:text-red-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {isImage ? (
              <ImageIcon className="w-8 h-8 text-text-muted" />
            ) : (
              <Upload className="w-8 h-8 text-text-muted" />
            )}
            <span className="text-sm text-text-secondary">
              Drop file here or click to browse
            </span>
            <span className="text-xs text-text-muted">Max 10MB</span>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
