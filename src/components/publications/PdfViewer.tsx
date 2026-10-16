"use client";

import { useState } from "react";
import { FileText, Maximize2, Minimize2, ExternalLink } from "lucide-react";

interface PdfViewerProps {
  url: string;
  title: string;
}

export default function PdfViewer({ url, title }: PdfViewerProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-glass-border">
        <div className="flex items-center gap-2">
          <FileText aria-hidden className="w-4 h-4 text-gold" />
          <span className="eyebrow text-text-muted">PDF</span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-11 h-11 inline-flex items-center justify-center rounded-[var(--radius-sm)] hover:bg-[var(--hover-wash)] text-text-secondary hover:text-gold transition-colors"
            title="Open in new tab"
            aria-label="Open PDF in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="w-11 h-11 inline-flex items-center justify-center rounded-[var(--radius-sm)] hover:bg-[var(--hover-wash)] text-text-secondary hover:text-gold transition-colors"
            title={expanded ? "Collapse" : "Expand"}
            aria-label={expanded ? "Collapse PDF preview" : "Expand PDF preview"}
          >
            {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <iframe
        src={url}
        title={title}
        className={`w-full border-0 transition-all duration-300 ${expanded ? "h-[85vh]" : "h-[70vh] max-h-[720px]"}`}
      />
    </div>
  );
}
