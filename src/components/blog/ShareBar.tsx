"use client";

import { useState } from "react";
import { Share2, Copy, Check, Linkedin } from "lucide-react";

interface ShareBarProps {
  title: string;
  slug: string;
}

export default function ShareBar({ title, slug }: ShareBarProps) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined"
    ? window.location.href
    : `https://www.konanamanidieudonne.org/en/blog/${slug}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const links = [
    {
      label: "LinkedIn",
      icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
    {
      label: "Twitter",
      icon: Share2,
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    },
  ];

  return (
    <div className="flex items-center gap-2 py-4 border-t border-glass-border">
      <span className="text-text-muted text-xs mr-1">Share:</span>
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 h-8 rounded-lg glass flex items-center justify-center text-text-muted hover:text-gold transition-colors"
          title={link.label}
        >
          <link.icon className="w-3.5 h-3.5" />
        </a>
      ))}
      <button
        onClick={handleCopy}
        className="w-8 h-8 rounded-lg glass flex items-center justify-center text-text-muted hover:text-gold transition-colors"
        title="Copy link"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}
