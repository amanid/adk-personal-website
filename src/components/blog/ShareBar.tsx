"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Share2, Copy, Check, Linkedin } from "lucide-react";

interface ShareBarProps {
  title: string;
  slug: string;
}

export default function ShareBar({ title, slug }: ShareBarProps) {
  const [copied, setCopied] = useState(false);
  const fr = useLocale() === "fr";
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

  const cls =
    "w-11 h-11 rounded-[var(--radius-sm)] border border-glass-border flex items-center justify-center text-text-secondary hover:text-gold hover:bg-[var(--hover-wash)] transition-colors";

  return (
    <div className="flex items-center gap-2 py-5 border-t border-glass-border">
      <span className="eyebrow text-text-muted mr-2">{fr ? "Partager" : "Share"}</span>
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className={cls}
          title={link.label}
          aria-label={fr ? `Partager sur ${link.label}` : `Share on ${link.label}`}
        >
          <link.icon aria-hidden className="w-4 h-4" />
        </a>
      ))}
      <button
        type="button"
        onClick={handleCopy}
        className={cls}
        aria-label={copied ? (fr ? "Lien copié" : "Link copied") : fr ? "Copier le lien" : "Copy link"}
      >
        {copied ? <Check aria-hidden className="w-4 h-4 text-success" /> : <Copy aria-hidden className="w-4 h-4" />}
      </button>
    </div>
  );
}
