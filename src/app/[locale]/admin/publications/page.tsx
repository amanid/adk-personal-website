"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Star, BookOpen, Eye, Download, Lock, Unlock } from "lucide-react";
import FileUpload from "@/components/admin/FileUpload";
import { PUBLICATION_TYPES } from "@/lib/publication-types";

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
  downloadCount: number;
  publicationType: string;
  doi: string | null;
  volume: string | null;
  issue: string | null;
  pages: string | null;
  publisher: string | null;
  publisherFr: string | null;
  conferenceName: string | null;
  conferenceNameFr: string | null;
  conferenceLocation: string | null;
  bookTitle: string | null;
  bookTitleFr: string | null;
  institution: string | null;
  institutionFr: string | null;
  month: number | null;
  url: string | null;
  citationCount: number | null;
  accessLevel: string;
  dataUrl: string | null;
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
  publicationType: "ANALYTICAL_REPORT",
  doi: "",
  volume: "",
  issue: "",
  pages: "",
  publisher: "",
  publisherFr: "",
  conferenceName: "",
  conferenceNameFr: "",
  conferenceLocation: "",
  bookTitle: "",
  bookTitleFr: "",
  institution: "",
  institutionFr: "",
  month: 0,
  url: "",
  citationCount: 0,
  accessLevel: "FREE",
  dataUrl: "",
};

const INPUT_CLASS = "w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none text-sm";

export default function AdminPublicationsPage() {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPublication, setEditingPublication] = useState<Publication | null>(null);
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
      // Handle silently
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
      publicationType: pub.publicationType || "ANALYTICAL_REPORT",
      doi: pub.doi || "",
      volume: pub.volume || "",
      issue: pub.issue || "",
      pages: pub.pages || "",
      publisher: pub.publisher || "",
      publisherFr: pub.publisherFr || "",
      conferenceName: pub.conferenceName || "",
      conferenceNameFr: pub.conferenceNameFr || "",
      conferenceLocation: pub.conferenceLocation || "",
      bookTitle: pub.bookTitle || "",
      bookTitleFr: pub.bookTitleFr || "",
      institution: pub.institution || "",
      institutionFr: pub.institutionFr || "",
      month: pub.month || 0,
      url: pub.url || "",
      citationCount: pub.citationCount || 0,
      accessLevel: pub.accessLevel || "FREE",
      dataUrl: pub.dataUrl || "",
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
      authors: form.authors.split(",").map((a) => a.trim()).filter(Boolean),
      journal: form.journal || undefined,
      year: form.year,
      category: form.category || undefined,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      featured: form.featured,
      pdfUrl: form.pdfUrl || undefined,
      publicationType: form.publicationType,
      doi: form.doi || undefined,
      volume: form.volume || undefined,
      issue: form.issue || undefined,
      pages: form.pages || undefined,
      publisher: form.publisher || undefined,
      publisherFr: form.publisherFr || undefined,
      conferenceName: form.conferenceName || undefined,
      conferenceNameFr: form.conferenceNameFr || undefined,
      conferenceLocation: form.conferenceLocation || undefined,
      bookTitle: form.bookTitle || undefined,
      bookTitleFr: form.bookTitleFr || undefined,
      institution: form.institution || undefined,
      institutionFr: form.institutionFr || undefined,
      month: form.month || undefined,
      url: form.url || undefined,
      citationCount: form.citationCount || undefined,
      accessLevel: form.accessLevel as "FREE" | "GATED",
      dataUrl: form.dataUrl || undefined,
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
      const res = await fetch(`/api/admin/publications/${id}`, { method: "DELETE" });
      if (res.ok) setPublications((prev) => prev.filter((p) => p.id !== id));
    } catch {
      // Handle silently
    }
  };

  // Determine which conditional fields to show
  const showJournalFields = ["JOURNAL_ARTICLE"].includes(form.publicationType);
  const showConferenceFields = ["CONFERENCE_PAPER"].includes(form.publicationType);
  const showBookFields = ["BOOK_CHAPTER"].includes(form.publicationType);
  const showInstitutionFields = ["THESIS_DISSERTATION", "WORKING_PAPER", "TECHNICAL_REPORT", "ANALYTICAL_REPORT"].includes(form.publicationType);
  const showVolumeIssue = showJournalFields;

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
            {editingPublication ? "Edit Publication" : "Create New Publication"}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Publication Type */}
            <div>
              <label className="block text-sm text-text-secondary mb-1">Publication Type *</label>
              <select
                value={form.publicationType}
                onChange={(e) => setForm({ ...form, publicationType: e.target.value })}
                className={INPUT_CLASS}
              >
                {PUBLICATION_TYPES.map((pt) => (
                  <option key={pt.value} value={pt.value}>{pt.labelEn}</option>
                ))}
              </select>
            </div>

            {/* Title EN / FR */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">Title (EN) *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={INPUT_CLASS} required />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Title (FR)</label>
                <input value={form.titleFr} onChange={(e) => setForm({ ...form, titleFr: e.target.value })} className={INPUT_CLASS} />
              </div>
            </div>

            {/* Abstract EN / FR */}
            <div>
              <label className="block text-sm text-text-secondary mb-1">Abstract (EN) *</label>
              <textarea value={form.abstract} onChange={(e) => setForm({ ...form, abstract: e.target.value })} rows={4} className={INPUT_CLASS} required />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Abstract (FR)</label>
              <textarea value={form.abstractFr} onChange={(e) => setForm({ ...form, abstractFr: e.target.value })} rows={4} className={INPUT_CLASS} />
            </div>

            {/* Authors / Journal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">Authors (comma-separated) *</label>
                <input value={form.authors} onChange={(e) => setForm({ ...form, authors: e.target.value })} className={INPUT_CLASS} placeholder="Author One, Author Two" required />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Journal / Venue</label>
                <input value={form.journal} onChange={(e) => setForm({ ...form, journal: e.target.value })} className={INPUT_CLASS} />
              </div>
            </div>

            {/* Year / Month / Category */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">Year *</label>
                <input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) || 0 })} min={1990} max={2040} className={INPUT_CLASS} required />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Month</label>
                <select value={form.month} onChange={(e) => setForm({ ...form, month: parseInt(e.target.value) })} className={INPUT_CLASS}>
                  <option value={0}>--</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleString("en", { month: "long" })}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={INPUT_CLASS}>
                  <option value="">Select category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">DOI</label>
                <input value={form.doi} onChange={(e) => setForm({ ...form, doi: e.target.value })} className={INPUT_CLASS} placeholder="10.xxxx/xxxxx" />
              </div>
            </div>

            {/* Conditional: Journal fields */}
            {showVolumeIssue && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-blue-500/20 rounded-lg">
                <div>
                  <label className="block text-sm text-blue-400 mb-1">Volume</label>
                  <input value={form.volume} onChange={(e) => setForm({ ...form, volume: e.target.value })} className={INPUT_CLASS} />
                </div>
                <div>
                  <label className="block text-sm text-blue-400 mb-1">Issue</label>
                  <input value={form.issue} onChange={(e) => setForm({ ...form, issue: e.target.value })} className={INPUT_CLASS} />
                </div>
                <div>
                  <label className="block text-sm text-blue-400 mb-1">Pages</label>
                  <input value={form.pages} onChange={(e) => setForm({ ...form, pages: e.target.value })} className={INPUT_CLASS} placeholder="123-145" />
                </div>
              </div>
            )}

            {/* Conditional: Conference fields */}
            {showConferenceFields && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-purple-500/20 rounded-lg">
                <div>
                  <label className="block text-sm text-purple-400 mb-1">Conference Name (EN)</label>
                  <input value={form.conferenceName} onChange={(e) => setForm({ ...form, conferenceName: e.target.value })} className={INPUT_CLASS} />
                </div>
                <div>
                  <label className="block text-sm text-purple-400 mb-1">Conference Name (FR)</label>
                  <input value={form.conferenceNameFr} onChange={(e) => setForm({ ...form, conferenceNameFr: e.target.value })} className={INPUT_CLASS} />
                </div>
                <div>
                  <label className="block text-sm text-purple-400 mb-1">Conference Location</label>
                  <input value={form.conferenceLocation} onChange={(e) => setForm({ ...form, conferenceLocation: e.target.value })} className={INPUT_CLASS} />
                </div>
                <div>
                  <label className="block text-sm text-purple-400 mb-1">Pages</label>
                  <input value={form.pages} onChange={(e) => setForm({ ...form, pages: e.target.value })} className={INPUT_CLASS} />
                </div>
              </div>
            )}

            {/* Conditional: Book Chapter fields */}
            {showBookFields && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-emerald-500/20 rounded-lg">
                <div>
                  <label className="block text-sm text-emerald-400 mb-1">Book Title (EN)</label>
                  <input value={form.bookTitle} onChange={(e) => setForm({ ...form, bookTitle: e.target.value })} className={INPUT_CLASS} />
                </div>
                <div>
                  <label className="block text-sm text-emerald-400 mb-1">Book Title (FR)</label>
                  <input value={form.bookTitleFr} onChange={(e) => setForm({ ...form, bookTitleFr: e.target.value })} className={INPUT_CLASS} />
                </div>
                <div>
                  <label className="block text-sm text-emerald-400 mb-1">Pages</label>
                  <input value={form.pages} onChange={(e) => setForm({ ...form, pages: e.target.value })} className={INPUT_CLASS} />
                </div>
              </div>
            )}

            {/* Conditional: Institution fields */}
            {showInstitutionFields && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-amber-500/20 rounded-lg">
                <div>
                  <label className="block text-sm text-amber-400 mb-1">Institution (EN)</label>
                  <input value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} className={INPUT_CLASS} />
                </div>
                <div>
                  <label className="block text-sm text-amber-400 mb-1">Institution (FR)</label>
                  <input value={form.institutionFr} onChange={(e) => setForm({ ...form, institutionFr: e.target.value })} className={INPUT_CLASS} />
                </div>
              </div>
            )}

            {/* Publisher */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">Publisher (EN)</label>
                <input value={form.publisher} onChange={(e) => setForm({ ...form, publisher: e.target.value })} className={INPUT_CLASS} />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Publisher (FR)</label>
                <input value={form.publisherFr} onChange={(e) => setForm({ ...form, publisherFr: e.target.value })} className={INPUT_CLASS} />
              </div>
            </div>

            {/* Tags / URL / Citation Count */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">Tags (comma-separated)</label>
                <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className={INPUT_CLASS} placeholder="AI, Economics, Trade" />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">External URL</label>
                <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className={INPUT_CLASS} placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Citation Count</label>
                <input type="number" value={form.citationCount} onChange={(e) => setForm({ ...form, citationCount: parseInt(e.target.value) || 0 })} min={0} className={INPUT_CLASS} />
              </div>
            </div>

            {/* Access Level & Data URL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-gold/20 rounded-lg">
              <div>
                <label className="block text-sm text-gold mb-1">Access Level</label>
                <select
                  value={form.accessLevel}
                  onChange={(e) => setForm({ ...form, accessLevel: e.target.value })}
                  className={INPUT_CLASS}
                >
                  <option value="FREE">Free — Open access</option>
                  <option value="GATED">Premium — Subscription required</option>
                </select>
                <p className="text-xs text-text-muted mt-1">
                  {form.accessLevel === "GATED"
                    ? "Users need an active subscription to download/view this publication."
                    : "This publication is freely accessible to all visitors."}
                </p>
              </div>
              <div>
                <label className="block text-sm text-gold mb-1">Data File URL</label>
                <input
                  value={form.dataUrl}
                  onChange={(e) => setForm({ ...form, dataUrl: e.target.value })}
                  className={INPUT_CLASS}
                  placeholder="URL to dataset (CSV, Excel, etc.)"
                />
                <p className="text-xs text-text-muted mt-1">
                  Optional. Link to the underlying data for data-tier subscribers.
                </p>
              </div>
            </div>

            {/* Featured checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="featured"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                className="w-4 h-4 rounded border-glass-border"
              />
              <label htmlFor="featured" className="text-sm text-text-secondary cursor-pointer">
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
                {submitting ? "Saving..." : editingPublication ? "Update Publication" : "Create Publication"}
              </button>
              <button
                type="button"
                onClick={() => { setShowEditor(false); setEditingPublication(null); setError(null); }}
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
            <div key={i} className="glass rounded-xl p-5 animate-pulse h-20" />
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
            <div key={pub.id} className="glass rounded-xl p-5 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-medium uppercase">
                    {PUBLICATION_TYPES.find((t) => t.value === pub.publicationType)?.shortEn || "Report"}
                  </span>
                  {pub.accessLevel === "GATED" ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 font-medium uppercase flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" />Premium
                    </span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium uppercase flex items-center gap-0.5">
                      <Unlock className="w-2.5 h-2.5" />Free
                    </span>
                  )}
                  <h3 className="text-sm font-medium truncate">{pub.title}</h3>
                  {pub.featured && <Star className="w-3.5 h-3.5 text-gold shrink-0" />}
                </div>
                <div className="flex items-center gap-3 text-text-muted text-xs">
                  <span>{pub.year}</span>
                  {pub.category && <span>{pub.category}</span>}
                  {pub.doi && <span className="text-emerald-400">DOI</span>}
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />{pub.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <Download className="w-3 h-3" />{pub.downloadCount || 0}
                  </span>
                  <span>{pub._count?.comments || 0} comments</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => openEdit(pub)} className="p-2 text-text-muted hover:text-gold transition-colors" aria-label="Edit">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(pub.id)} className="p-2 text-text-muted hover:text-red-400 transition-colors" aria-label="Delete">
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
