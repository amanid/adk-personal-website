"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Star, BookOpen, Eye } from "lucide-react";
import FileUpload from "@/components/admin/FileUpload";

interface Publication {
  id: string;
  title: string;
  titleFr: string | null;
  slug: string;
  abstract: string;
  abstractFr: string | null;
  authors: string[];
  journal: string | null;
  year: number;
  category: string | null;
  pdfUrl: string | null;
  tags: string[];
  featured: boolean;
  views: number;
  _count: { comments: number };
}

const CATEGORIES = [
  "Africa Economics",
  "Trade Finance",
  "AI & Technology",
  "Digital & Fintech",
  "Agriculture",
  "Macroeconomics",
  "Data Governance",
];

const emptyForm = {
  title: "",
  titleFr: "",
  abstract: "",
  abstractFr: "",
  authors: "",
  journal: "",
  year: new Date().getFullYear(),
  category: "",
  tags: "",
  featured: false,
  pdfUrl: "",
};

export default function AdminPublicationsPage() {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPublication, setEditingPublication] =
    useState<Publication | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPublications();
  }, []);

  const fetchPublications = async () => {
    try {
      const res = await fetch("/api/admin/publications");
      if (res.ok) {
        const data = await res.json();
        setPublications(data.publications || []);
      }
    } catch {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingPublication(null);
    setForm(emptyForm);
    setError(null);
    setShowEditor(true);
  };

  const openEdit = (pub: Publication) => {
    setEditingPublication(pub);
    setForm({
      title: pub.title,
      titleFr: pub.titleFr || "",
      abstract: pub.abstract,
      abstractFr: pub.abstractFr || "",
      authors: pub.authors.join(", "),
      journal: pub.journal || "",
      year: pub.year,
      category: pub.category || "",
      tags: pub.tags.join(", "),
      featured: pub.featured,
      pdfUrl: pub.pdfUrl || "",
    });
    setError(null);
    setShowEditor(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const method = editingPublication ? "PUT" : "POST";
    const url = editingPublication
      ? `/api/admin/publications/${editingPublication.id}`
      : "/api/admin/publications";

    const payload = {
      title: form.title,
      titleFr: form.titleFr || undefined,
      abstract: form.abstract,
      abstractFr: form.abstractFr || undefined,
      authors: form.authors
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
      journal: form.journal || undefined,
      year: form.year,
      category: form.category || undefined,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      featured: form.featured,
      pdfUrl: form.pdfUrl || undefined,
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save publication");
      }

      setShowEditor(false);
      setEditingPublication(null);
      setForm(emptyForm);
      fetchPublications();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this publication?")) return;

    try {
      const res = await fetch(`/api/admin/publications/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPublications((prev) => prev.filter((p) => p.id !== id));
      }
    } catch {
      // Handle error silently
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] gradient-text">
          Publications
        </h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-gold text-charcoal font-medium rounded-lg hover:bg-gold-light transition-all text-sm"
        >
          <Plus className="w-4 h-4" />
          New Publication
        </button>
      </div>

      {/* Editor Form */}
      {showEditor && (
        <div className="glass rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {editingPublication
              ? "Edit Publication"
              : "Create New Publication"}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title EN / FR */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">
                  Title (EN) *
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">
                  Title (FR)
                </label>
                <input
                  value={form.titleFr}
                  onChange={(e) =>
                    setForm({ ...form, titleFr: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none"
                />
              </div>
            </div>

            {/* Abstract EN */}
            <div>
              <label className="block text-sm text-text-secondary mb-1">
                Abstract (EN) *
              </label>
              <textarea
                value={form.abstract}
                onChange={(e) =>
                  setForm({ ...form, abstract: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none"
                required
              />
            </div>

            {/* Abstract FR */}
            <div>
              <label className="block text-sm text-text-secondary mb-1">
                Abstract (FR)
              </label>
              <textarea
                value={form.abstractFr}
                onChange={(e) =>
                  setForm({ ...form, abstractFr: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none"
              />
            </div>

            {/* Authors / Journal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">
                  Authors (comma-separated) *
                </label>
                <input
                  value={form.authors}
                  onChange={(e) =>
                    setForm({ ...form, authors: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none"
                  placeholder="Author One, Author Two"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">
                  Journal
                </label>
                <input
                  value={form.journal}
                  onChange={(e) =>
                    setForm({ ...form, journal: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none"
                />
              </div>
            </div>

            {/* Year / Category / Tags */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">
                  Year *
                </label>
                <input
                  type="number"
                  value={form.year}
                  onChange={(e) =>
                    setForm({ ...form, year: parseInt(e.target.value) || 0 })
                  }
                  min={2000}
                  max={2030}
                  className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none"
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none"
                  placeholder="AI, Economics, Trade"
                />
              </div>
            </div>

            {/* Featured checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="featured"
                checked={form.featured}
                onChange={(e) =>
                  setForm({ ...form, featured: e.target.checked })
                }
                className="w-4 h-4 rounded border-glass-border"
              />
              <label
                htmlFor="featured"
                className="text-sm text-text-secondary cursor-pointer"
              >
                Featured publication
              </label>
            </div>

            {/* PDF Upload */}
            <FileUpload
              accept=".pdf,application/pdf"
              onUpload={(url) => setForm({ ...form, pdfUrl: url })}
              currentUrl={form.pdfUrl}
              label="Publication PDF"
            />

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-gold text-charcoal font-medium rounded-lg hover:bg-gold-light transition-all text-sm disabled:opacity-50"
              >
                {submitting
                  ? "Saving..."
                  : editingPublication
                    ? "Update Publication"
                    : "Create Publication"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEditor(false);
                  setEditingPublication(null);
                  setError(null);
                }}
                className="px-6 py-2 glass text-text-secondary rounded-lg hover:text-gold transition-all text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Publications List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="glass rounded-xl p-5 animate-pulse h-20"
            />
          ))}
        </div>
      ) : publications.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-secondary">No publications yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {publications.map((pub) => (
            <div
              key={pub.id}
              className="glass rounded-xl p-5 flex items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-medium truncate">{pub.title}</h3>
                  {pub.featured && (
                    <Star className="w-3.5 h-3.5 text-gold shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-3 text-text-muted text-xs">
                  <span>{pub.year}</span>
                  {pub.category && <span>{pub.category}</span>}
                  {pub.journal && (
                    <span className="truncate max-w-[150px]">
                      {pub.journal}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {pub.views}
                  </span>
                  <span>{pub._count.comments} comments</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => openEdit(pub)}
                  className="p-2 text-text-muted hover:text-gold transition-colors"
                  aria-label="Edit publication"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(pub.id)}
                  className="p-2 text-text-muted hover:text-red-400 transition-colors"
                  aria-label="Delete publication"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
