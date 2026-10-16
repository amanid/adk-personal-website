"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Copy, Check, ExternalLink } from "lucide-react";
import { buttonClass } from "@/components/ui/Button";

interface ShareButtonsProps {
  title: string;
  url: string;
  doi?: string;
}

export default function ShareButtons({ title, url, doi }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const fr = useLocale() === "fr";
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
    },
    {
      label: "Twitter",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(fullUrl)}`,
    },
  ];

  const cls = buttonClass("secondary", "md", "md:h-9 md:px-3.5");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="eyebrow text-text-muted mr-2">{fr ? "Partager" : "Share"}</span>
      {shareLinks.map((link) => (
        <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className={cls}>
          {link.label}
        </a>
      ))}
      {doi && (
        <a href={`https://doi.org/${doi}`} target="_blank" rel="noopener noreferrer" className={cls}>
          DOI <ExternalLink aria-hidden className="w-3.5 h-3.5" />
        </a>
      )}
      <button type="button" onClick={handleCopy} className={cls}>
        {copied ? <Check aria-hidden className="w-3.5 h-3.5 text-success" /> : <Copy aria-hidden className="w-3.5 h-3.5" />}
        <span role="status">{copied ? (fr ? "Lien copié" : "Link copied") : fr ? "Copier le lien" : "Copy link"}</span>
      </button>
    </div>
  );
}
