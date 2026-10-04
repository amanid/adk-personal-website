"use client";

import { useRef, useState } from "react";
import { Upload, FileText, X } from "lucide-react";
import { uploadInPieces } from "@/lib/chunked-upload";

export interface BookUploadResult {
  fileId: string;
  fileName: string;
  fileMimeType: string;
  /** The file has facts or a cover to read (PDF, EPUB, Word, PowerPoint, Excel). */
  analysable: boolean;
  /** AI drafting is configured on the server. */
  aiAvailable: boolean;
}

interface BookFileUploadProps {
  currentFileName?: string | null;
  onUpload: (result: BookUploadResult) => void;
  onClear: () => void;
}

/** Uploads the downloadable product file to /api/admin/books/upload (server allowlist decides). */
export default function BookFileUpload({
  currentFileName,
  onUpload,
  onClear,
}: BookFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(currentFileName || null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ fraction: number; step: string } | null>(null);

  // Reject oversized files before spending minutes uploading bytes the server
  // will refuse anyway.
  const MAX_BYTES = 50 * 1024 * 1024;

  const handleFile = async (file: File) => {
    setError(null);
    if (file.size > MAX_BYTES) {
      setError(
        `"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)}MB. The limit is 50MB — ` +
          `compress the PDF (or upload the EPUB) and try again.`
      );
      return;
    }

    setUploading(true);
    setProgress(null);
    try {
      // In 4MB pieces, each verified: no request ever carries the whole file.
      const data = await uploadInPieces(file, (fraction, step) => setProgress({ fraction, step }));
      setFileName(data.fileName);
      onUpload({
        fileId: data.fileId,
        fileName: data.fileName,
        fileMimeType: data.fileMimeType,
        analysable: data.analysable,
        aiAvailable: data.aiAvailable,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      setProgress(null);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm text-text-secondary">
        Product file — the secured download
      </label>
      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-glass-border hover:border-gold/50 rounded-lg p-6 text-center cursor-pointer transition-all"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.epub,.csv,.xlsx,.xls,.docx,.pptx,.zip,.json,.txt,.md,.ipynb,.parquet,.dta"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
          className="hidden"
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-text-secondary">{progress?.step ?? "Uploading…"}</span>
            {progress && (
              <div className="w-full max-w-xs h-1.5 rounded-full bg-glass-border/60" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress.fraction * 100)}>
                <div className="h-1.5 rounded-full bg-gold transition-all" style={{ width: `${Math.round(progress.fraction * 100)}%` }} />
              </div>
            )}
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
            <span className="text-xs text-text-muted">PDF, EPUB, CSV, Excel, Word, PowerPoint, ZIP, JSON, notebook… · Max 50MB</span>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
