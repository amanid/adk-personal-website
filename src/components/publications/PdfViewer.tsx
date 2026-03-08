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
    <div className="glass rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-glass-border">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gold" />
          <span className="font-medium text-sm">PDF Document</span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-md hover:bg-gold/10 text-text-secondary hover:text-gold transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-md hover:bg-gold/10 text-text-secondary hover:text-gold transition-colors"
            title={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <iframe
        src={url}
        title={title}
        className={`w-full border-0 transition-all duration-300 ${expanded ? "h-[80vh]" : "h-[500px]"}`}
      />
    </div>
  );
}
