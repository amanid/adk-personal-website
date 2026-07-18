"use client";

import { useRef, useState } from "react";
import { Upload, FileText, X } from "lucide-react";

export interface ParsedBookMeta {
  title?: string;
  subtitle?: string;
  author?: string;
  publicationYear?: number;
  pageCount?: number;
  language?: string;
  isbn?: string;
  description?: string;
  keyInsights?: string[];
}

export interface BookUploadResult {
  fileId: string;
  fileName: string;
  fileMimeType: string;
  coverImageId?: string | null;
  metadata?: ParsedBookMeta | null;
}

interface BookFileUploadProps {
  currentFileName?: string | null;
  onUpload: (result: BookUploadResult) => void;
  onClear: () => void;
}

/** Uploads the downloadable book file (PDF/EPUB) to /api/admin/books/upload. */
export default function BookFileUpload({
  currentFileName,
  onUpload,
  onClear,
}: BookFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(currentFileName || null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/books/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setFileName(data.fileName);
      onUpload({
        fileId: data.fileId,
        fileName: data.fileName,
        fileMimeType: data.fileMimeType,
        coverImageId: data.coverImageId ?? null,
        metadata: data.metadata ?? null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm text-text-secondary">
        Book file (PDF / EPUB) — the secured download
      </label>
      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-glass-border hover:border-gold/50 rounded-lg p-6 text-center cursor-pointer transition-all"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.epub,application/pdf,application/epub+zip"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
          className="hidden"
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-text-secondary">Uploading…</span>
          </div>
        ) : fileName ? (
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-gold" />
            <span className="text-sm text-text-primary truncate flex-1">{fileName}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFileName(null);
                onClear();
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="p-1 text-text-muted hover:text-red-400"
              aria-label="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-text-muted" />
            <span className="text-sm text-text-secondary">Drop or click to upload the book file</span>
            <span className="text-xs text-text-muted">PDF or EPUB · Max 100MB</span>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
