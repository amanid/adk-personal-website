"use client";

import { useState } from "react";
import { Share2, Copy, Check, ExternalLink } from "lucide-react";

interface ShareButtonsProps {
  title: string;
  url: string;
  doi?: string;
}

export default function ShareButtons({ title, url, doi }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const fullUrl = typeof window !== "undefined" ? window.location.href : url;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLinks = [
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`,
      color: "hover:text-blue-400",
    },
    {
      label: "Twitter",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(fullUrl)}`,
      color: "hover:text-sky-400",
    },
    {
      label: "ResearchGate",
      href: `https://www.researchgate.net/publication/search?q=${encodeURIComponent(title)}`,
      color: "hover:text-teal-400",
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Share2 className="w-4 h-4 text-text-secondary" />
      {shareLinks.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`px-3 py-1.5 text-sm glass rounded-lg text-text-secondary ${link.color} transition-colors`}
        >
          {link.label}
        </a>
      ))}
      {doi && (
        <a
          href={`https://doi.org/${doi}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 text-sm glass rounded-lg text-text-secondary hover:text-gold transition-colors flex items-center gap-1"
        >
          DOI <ExternalLink className="w-3 h-3" />
        </a>
      )}
      <button
        onClick={handleCopy}
        className="px-3 py-1.5 text-sm glass rounded-lg text-text-secondary hover:text-gold transition-colors flex items-center gap-1"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? "Copied" : "Copy Link"}
      </button>
    </div>
  );
}
