"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Star,
  BookOpen,
  Eye,
  Download,
  DollarSign,
  ShoppingBag,
  UploadCloud,
  Sparkles,
} from "lucide-react";
import FileUpload from "@/components/admin/FileUpload";
import BookFileUpload, { type BookUploadResult } from "@/components/admin/BookFileUpload";
import { formatPrice } from "@/lib/utils";

interface BookStats {
  views: number;
  unitsSold: number;
  revenueCents: number;
  downloads: number;
}

interface Book {
  id: string;
  title: string;
  titleFr: string | null;
  slug: string;
  subtitle: string | null;
  subtitleFr: string | null;
  description: string;
  descriptionFr: string | null;
  keyInsights: string[];
  keyInsightsFr: string[];
  author: string;
  publicationYear: number;
  isbn: string | null;
  language: string | null;
  pageCount: number | null;
  category: string | null;
  tags: string[];
  priceCents: number;
  currency: string;
  coverImageId: string | null;
  fileId: string | null;
  fileName: string | null;
  fileMimeType: string | null;
  status: string;
  featured: boolean;
  sortOrder: number;
  stats: BookStats;
}

const INPUT_CLASS =
  "w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none text-sm";

const emptyForm = {
  title: "",
  titleFr: "",
  subtitle: "",
  subtitleFr: "",
  description: "",
  descriptionFr: "",
  keyInsights: "",
  keyInsightsFr: "",
  author: "KONAN Amani Dieudonné",
  publicationYear: new Date().getFullYear(),
  isbn: "",
  language: "English",
  pageCount: 0,
  category: "",
  tags: "",
  priceDollars: "50.00",
  status: "DRAFT",
  featured: false,
  sortOrder: 0,
  coverImageId: "",
  fileId: "",
  fileName: "",
  fileMimeType: "",
};

export default function AdminStorePage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkResult, setBulkResult] = useState<string | null>(null);
  const bulkInputRef = useRef<HTMLInputElement>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const editorPanelRef = useRef<HTMLDivElement>(null);
  const editorTriggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    fetchBooks();
  }, []);

  // Accessible modal behavior for the book editor: focus the first field on open,
  // trap Tab within the panel, close on Escape, and restore focus on close.
  useEffect(() => {
    if (!showEditor) return;
    editorTriggerRef.current = document.activeElement as HTMLElement | null;
    const panel = editorPanelRef.current;
    const selector =
      'input,select,textarea,button,[href],[tabindex]:not([tabindex="-1"])';
    const focusables = () =>
      Array.from(panel?.querySelectorAll<HTMLElement>(selector) || []).filter(
        (el) => !el.hasAttribute("disabled") && el.offsetParent !== null
      );
    focusables()[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowEditor(false);
        return;
      }
      if (e.key === "Tab") {
        const items = focusables();
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      editorTriggerRef.current?.focus?.();
    };
  }, [showEditor]);

  const fetchBooks = async () => {
    try {
      const res = await fetch("/api/admin/books");
      if (res.ok) {
        const data = await res.json();
        setBooks(data.books || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setAiError(null);
    setShowEditor(true);
  };

  const openEdit = (b: Book) => {
    setEditingId(b.id);
    setForm({
      title: b.title,
      titleFr: b.titleFr || "",
      subtitle: b.subtitle || "",
      subtitleFr: b.subtitleFr || "",
      description: b.description,
      descriptionFr: b.descriptionFr || "",
      keyInsights: b.keyInsights.join("\n"),
      keyInsightsFr: b.keyInsightsFr.join("\n"),
      author: b.author,
      publicationYear: b.publicationYear,
      isbn: b.isbn || "",
      language: b.language || "English",
      pageCount: b.pageCount || 0,
      category: b.category || "",
      tags: b.tags.join(", "),
      priceDollars: (b.priceCents / 100).toFixed(2),
      status: b.status,
      featured: b.featured,
      sortOrder: b.sortOrder,
      coverImageId: b.coverImageId || "",
      fileId: b.fileId || "",
      fileName: b.fileName || "",
      fileMimeType: b.fileMimeType || "",
    });
    setError(null);
    setAiError(null);
    setShowEditor(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const priceCents = Math.round(parseFloat(form.priceDollars || "0") * 100);
    if (Number.isNaN(priceCents) || priceCents < 0) {
      setError("Please enter a valid price.");
      setSubmitting(false);
      return;
    }

    const payload = {
      title: form.title,
      titleFr: form.titleFr || undefined,
      subtitle: form.subtitle || undefined,
      subtitleFr: form.subtitleFr || undefined,
      description: form.description,
      descriptionFr: form.descriptionFr || undefined,
      keyInsights: form.keyInsights.split("\n").map((s) => s.trim()).filter(Boolean),
      keyInsightsFr: form.keyInsightsFr.split("\n").map((s) => s.trim()).filter(Boolean),
      author: form.author || undefined,
      publicationYear: Number(form.publicationYear),
      isbn: form.isbn || undefined,
      language: form.language || undefined,
      pageCount: form.pageCount ? Number(form.pageCount) : undefined,
      category: form.category || undefined,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      priceCents,
      currency: "USD",
      coverImageId: form.coverImageId || undefined,
      fileId: form.fileId || undefined,
      fileName: form.fileName || undefined,
      fileMimeType: form.fileMimeType || undefined,
      status: form.status,
      featured: form.featured,
      sortOrder: Number(form.sortOrder) || 0,
    };

    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/admin/books/${editingId}` : "/api/admin/books";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Save failed");
      }
      setShowEditor(false);
      fetchBooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-fill empty form fields from parsed file metadata; never overwrite
  // values the admin has already entered.
  const handleBookFileUpload = (result: BookUploadResult) => {
    setForm((prev) => {
      const next = {
        ...prev,
        fileId: result.fileId,
        fileName: result.fileName,
        fileMimeType: result.fileMimeType,
      };
      const m = result.metadata;
      if (m) {
        if (!prev.title.trim() && m.title) next.title = m.title;
        if (!prev.description.trim() && m.description) next.description = m.description;
        if (!prev.isbn.trim() && m.isbn) next.isbn = m.isbn;
        if (m.publicationYear) next.publicationYear = m.publicationYear;
        if ((!prev.pageCount || prev.pageCount === 0) && m.pageCount) next.pageCount = m.pageCount;
        if ((!prev.language.trim() || prev.language === "English") && m.language)
          next.language = m.language;
        if (!prev.keyInsights.trim() && m.keyInsights?.length)
          next.keyInsights = m.keyInsights.join("\n");
      }
      if (result.coverImageId && !prev.coverImageId) {
        next.coverImageId = result.coverImageId;
      }
      return next;
    });
  };

  const handleDraftWithAI = async () => {
    if (!form.fileId) {
      setAiError("Upload the book file first, then draft with AI.");
      return;
    }
    if (
      (form.description.trim() || form.keyInsights.trim()) &&
      !confirm("Replace the current description and key insights with an AI draft?")
    ) {
      return;
    }
    setAiBusy(true);
    setAiError(null);
    try {
      const res = await fetch("/api/admin/books/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: form.fileId,
          title: form.title,
          author: form.author,
          description: form.description,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error || "AI drafting failed");
        return;
      }
      setForm((prev) => ({
        ...prev,
        description: data.description || prev.description,
        keyInsights: (data.keyInsights || []).length
          ? data.keyInsights.join("\n")
          : prev.keyInsights,
      }));
    } catch {
      setAiError("AI drafting failed");
    } finally {
      setAiBusy(false);
    }
  };

  const handleBulkImport = async (fileList: FileList) => {
    if (fileList.length === 0) return;
    setBulkBusy(true);
    setBulkResult(null);
    try {
      const fd = new FormData();
      Array.from(fileList).forEach((f) => fd.append("files", f));
      const res = await fetch("/api/admin/books/bulk", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setBulkResult(data.error || "Import failed");
      } else {
        const okCount = data.created?.length || 0;
        const failCount = data.failed?.length || 0;
        setBulkResult(
          `Imported ${okCount} book${okCount === 1 ? "" : "s"} as drafts` +
            (failCount ? ` · ${failCount} failed` : "") +
            ". Set prices and publish them below."
        );
        fetchBooks();
      }
    } catch {
      setBulkResult("Import failed");
    } finally {
      setBulkBusy(false);
    }
  };

  const handleDelete = async (b: Book) => {
    if (!confirm(`Delete "${b.title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/books/${b.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Delete failed");
        return;
      }
      fetchBooks();
    } catch {
      alert("Delete failed");
    }
  };

  const totalRevenue = books.reduce((s, b) => s + b.stats.revenueCents, 0);
  const totalUnits = books.reduce((s, b) => s + b.stats.unitsSold, 0);

  if (loading) {
    return <div className="text-text-secondary">Loading…</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-gold" />
            Bookstore
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {books.length} books · {totalUnits} sold · {formatPrice(totalRevenue)} revenue
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={bulkInputRef}
            type="file"
            accept=".pdf,.epub,application/pdf,application/epub+zip"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleBulkImport(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => bulkInputRef.current?.click()}
            disabled={bulkBusy}
            className="flex items-center gap-2 px-4 py-2 border border-gold/40 text-gold font-medium rounded-lg hover:bg-gold/10 transition-all disabled:opacity-50"
          >
            <UploadCloud className="w-4 h-4" />
            {bulkBusy ? "Importing…" : "Bulk import"}
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-gold text-charcoal font-semibold rounded-lg hover:bg-gold-light transition-all"
          >
            <Plus className="w-4 h-4" />
            New Book
          </button>
        </div>
      </div>

      {bulkResult && (
        <div className="glass rounded-lg p-3 mb-4 text-sm flex items-start gap-2">
          <UploadCloud className="w-4 h-4 text-gold mt-0.5 shrink-0" />
          <span className="flex-1">{bulkResult}</span>
          <button
            onClick={() => setBulkResult(null)}
            className="text-text-secondary hover:text-gold text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {books.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center text-text-secondary">
          No books yet. Create your first one.
        </div>
      ) : (
        <div className="space-y-3">
          {books.map((b) => (
            <div key={b.id} className="glass rounded-xl p-4 flex gap-4 items-center">
              <div className="w-12 h-16 shrink-0 rounded bg-navy/50 overflow-hidden flex items-center justify-center">
                {b.coverImageId ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/uploads/${b.coverImageId}`}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <BookOpen className="w-5 h-5 text-gold/30" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium truncate">{b.title}</h3>
                  {b.featured && <Star className="w-3.5 h-3.5 text-gold fill-gold" />}
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${
                      b.status === "PUBLISHED"
                        ? "bg-green-500/15 text-green-400"
                        : b.status === "DRAFT"
                          ? "bg-amber-500/15 text-amber-400"
                          : "bg-gray-500/15 text-gray-400"
                    }`}
                  >
                    {b.status}
                  </span>
                  {!b.fileId && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">
                      No file
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-secondary mt-0.5">
                  {b.publicationYear} · {formatPrice(b.priceCents, b.currency)}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-text-secondary">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" /> {b.stats.views} views
                  </span>
                  <span className="flex items-center gap-1">
                    <ShoppingBag className="w-3 h-3" /> {b.stats.unitsSold} sold
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" /> {formatPrice(b.stats.revenueCents)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Download className="w-3 h-3" /> {b.stats.downloads} downloads
                  </span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => openEdit(b)}
                  className="p-2 text-text-secondary hover:text-gold transition-colors"
                  aria-label="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(b)}
                  className="p-2 text-text-secondary hover:text-red-400 transition-colors"
                  aria-label="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor modal */}
      {showEditor && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-4 overflow-y-auto"
          onClick={() => setShowEditor(false)}
        >
          <div
            ref={editorPanelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="book-editor-title"
            onClick={(e) => e.stopPropagation()}
            className="glass-strong rounded-2xl w-full max-w-3xl my-8 p-6"
          >
            <h2 id="book-editor-title" className="text-xl font-bold mb-4">
              {editingId ? "Edit Book" : "New Book"}
            </h2>
            {error && (
              <p className="text-sm text-red-400 border border-red-400/30 rounded-lg p-3 mb-4">
                {error}
              </p>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Title *</label>
                  <input
                    className={INPUT_CLASS}
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Title (FR)</label>
                  <input
                    className={INPUT_CLASS}
                    value={form.titleFr}
                    onChange={(e) => setForm({ ...form, titleFr: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Subtitle</label>
                  <input
                    className={INPUT_CLASS}
                    value={form.subtitle}
                    onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Subtitle (FR)</label>
                  <input
                    className={INPUT_CLASS}
                    value={form.subtitleFr}
                    onChange={(e) => setForm({ ...form, subtitleFr: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm text-text-secondary">Description *</label>
                  <button
                    type="button"
                    onClick={handleDraftWithAI}
                    disabled={aiBusy || !form.fileId}
                    title={
                      form.fileId
                        ? "Draft the description & key insights from the uploaded book file"
                        : "Upload the book file first"
                    }
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-gold/40 text-gold text-xs font-medium hover:bg-gold/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {aiBusy ? "Drafting…" : "Draft with AI"}
                  </button>
                </div>
                <textarea
                  className={INPUT_CLASS}
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                />
                {aiError && <p className="text-xs text-red-400 mt-1">{aiError}</p>}
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Description (FR)</label>
                <textarea
                  className={INPUT_CLASS}
                  rows={3}
                  value={form.descriptionFr}
                  onChange={(e) => setForm({ ...form, descriptionFr: e.target.value })}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-text-secondary mb-1">
                    Key insights (one per line)
                  </label>
                  <textarea
                    className={INPUT_CLASS}
                    rows={4}
                    value={form.keyInsights}
                    onChange={(e) => setForm({ ...form, keyInsights: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">
                    Key insights FR (one per line)
                  </label>
                  <textarea
                    className={INPUT_CLASS}
                    rows={4}
                    value={form.keyInsightsFr}
                    onChange={(e) => setForm({ ...form, keyInsightsFr: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Author</label>
                  <input
                    className={INPUT_CLASS}
                    value={form.author}
                    onChange={(e) => setForm({ ...form, author: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Year *</label>
                  <input
                    type="number"
                    className={INPUT_CLASS}
                    value={form.publicationYear}
                    onChange={(e) =>
                      setForm({ ...form, publicationYear: Number(e.target.value) })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Price (USD) *</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    className={INPUT_CLASS}
                    value={form.priceDollars}
                    onChange={(e) => setForm({ ...form, priceDollars: e.target.value })}
                    placeholder="19.99"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Language</label>
                  <input
                    className={INPUT_CLASS}
                    value={form.language}
                    onChange={(e) => setForm({ ...form, language: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Pages</label>
                  <input
                    type="number"
                    className={INPUT_CLASS}
                    value={form.pageCount}
                    onChange={(e) => setForm({ ...form, pageCount: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">ISBN</label>
                  <input
                    className={INPUT_CLASS}
                    value={form.isbn}
                    onChange={(e) => setForm({ ...form, isbn: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Category</label>
                  <input
                    className={INPUT_CLASS}
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm text-text-secondary mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    className={INPUT_CLASS}
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <FileUpload
                  accept="image/*"
                  label="Cover image"
                  currentUrl={form.coverImageId ? `/api/uploads/${form.coverImageId}` : undefined}
                  onUpload={(url) =>
                    setForm({ ...form, coverImageId: url ? url.split("/").pop() || "" : "" })
                  }
                />
                <BookFileUpload
                  currentFileName={form.fileName || null}
                  onUpload={handleBookFileUpload}
                  onClear={() => setForm({ ...form, fileId: "", fileName: "", fileMimeType: "" })}
                />
              </div>
              <p className="text-xs text-text-secondary -mt-2">
                Uploading a PDF/EPUB auto-fills empty fields (title, author, year, pages, ISBN,
                language, description) — and the cover for EPUBs. Your edits are never overwritten.
              </p>

              <div className="grid sm:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Status</label>
                  <select
                    className={INPUT_CLASS}
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Sort order</label>
                  <input
                    type="number"
                    className={INPUT_CLASS}
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-text-secondary">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                    className="accent-gold"
                  />
                  Featured
                </label>
              </div>

              {form.status === "PUBLISHED" && !form.fileId && (
                <p className="text-sm text-amber-400">
                  Note: a published book without a file cannot be purchased. Upload the book file.
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditor(false)}
                  className="px-4 py-2 rounded-lg border border-glass-border text-sm hover:border-gold/50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-gold text-charcoal font-semibold text-sm hover:bg-gold-light transition-all disabled:opacity-50"
                >
                  {submitting ? "Saving…" : editingId ? "Save changes" : "Create book"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
