"use client";

interface BlogJsonLdProps {
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  updatedAt?: string;
  authorName: string;
  coverImage?: string;
  tags?: string[];
}

export default function BlogJsonLd({
  title,
  description,
  slug,
  publishedAt,
  updatedAt,
  authorName,
  coverImage,
  tags,
}: BlogJsonLdProps) {
  const url = `https://www.konanamanidieudonne.org/en/blog/${slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description: description,
    url: url,
    datePublished: publishedAt,
    dateModified: updatedAt || publishedAt,
    author: {
      "@type": "Person",
      name: authorName,
      url: "https://www.konanamanidieudonne.org",
    },
    publisher: {
      "@type": "Person",
      name: "KONAN Amani Dieudonné",
      url: "https://www.konanamanidieudonne.org",
      image: "https://www.konanamanidieudonne.org/images/profile.jpg",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    ...(coverImage && {
      image: coverImage.startsWith("http")
        ? coverImage
        : `https://www.konanamanidieudonne.org${coverImage}`,
    }),
    ...(tags && tags.length > 0 && { keywords: tags.join(", ") }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
