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
  Archive,
  ArchiveRestore,
  AlertTriangle,
  X,
  CheckSquare,
  Square,
} from "lucide-react";
import FileUpload from "@/components/admin/FileUpload";
import BookFileUpload, { type BookUploadResult } from "@/components/admin/BookFileUpload";
import { formatPrice } from "@/lib/utils";
import { readJson } from "@/lib/api-response";
import { majorToMinor, minorToMajor, SUPPORTED_CURRENCIES } from "@/lib/currency";

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
  free: false,
  priceDollars: "50.00",
  currency: "USD",
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
  // Bulk AI enrichment runs book-by-book; this tracks where it has got to.
  const [enrichRun, setEnrichRun] = useState<null | {
    done: number;
    total: number;
    current: string;
    log: string[];
  }>(null);
  const cancelEnrich = useRef(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  // What a file replacement changed, so the refresh isn't silent.
  const [refreshNote, setRefreshNote] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDialog, setConfirmDialog] = useState<null | {
    title: string;
    message: string;
    confirmLabel: string;
    requireText?: string;
    onConfirm: () => void | Promise<void>;
  }>(null);
  const [confirmText, setConfirmText] = useState("");
  const [confirmBusy, setConfirmBusy] = useState(false);
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
    setRefreshNote(null);
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
      free: b.priceCents === 0,
      priceDollars: String(minorToMajor(b.priceCents, b.currency || "USD")),
      currency: b.currency || "USD",
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
    setRefreshNote(null);
    setShowEditor(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const priceCents = form.free
      ? 0
      : majorToMinor(parseFloat(form.priceDollars || "0"), form.currency);
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
      currency: form.currency,
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
      await readJson(res, "Save failed");
      setShowEditor(false);
      fetchBooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Apply an uploaded file to the editor.
   *
   * A first upload fills whatever is still empty. Replacing the file of a book
   * that already has one is different: page count, cover, ISBN, language and
   * year describe the FILE, so once the file changes the old values are simply
   * wrong — and they are shown to buyers on the storefront. Those are refreshed
   * unconditionally, and the listing prose is redrafted from the new text.
   *
   * The title and subtitle are deliberately left alone. They are the most
   * curated fields, and a PDF's embedded title is frequently junk
   * ("Microsoft Word - final_v3"), so replacing a file must not rename a book.
   *
   * Nothing here is persisted until Save, so an unwanted refresh is undone by
   * closing the editor.
   */
  const handleBookFileUpload = (result: BookUploadResult) => {
    // Derived from the current form rather than inside the setForm updater:
    // React may run an updater twice, which would double-count the changes.
    const prev = form;
    const isReplacement = Boolean(prev.fileId);
    const m = result.metadata;
    const changed: string[] = [];

    const next = {
      ...prev,
      fileId: result.fileId,
      fileName: result.fileName,
      fileMimeType: result.fileMimeType,
    };

    if (m) {
      if (!prev.title.trim() && m.title) next.title = m.title;
      if (!prev.description.trim() && m.description) next.description = m.description;

      // File-derived facts: follow the file on a replacement.
      if (m.isbn && (isReplacement || !prev.isbn.trim())) {
        if (isReplacement && m.isbn !== prev.isbn) changed.push(`ISBN ${m.isbn}`);
        next.isbn = m.isbn;
      }
      if (m.publicationYear) next.publicationYear = m.publicationYear;
      if (m.pageCount && (isReplacement || !prev.pageCount)) {
        if (isReplacement && m.pageCount !== prev.pageCount) {
          changed.push(`${m.pageCount.toLocaleString()} pages`);
        }
        next.pageCount = m.pageCount;
      }
      if (
        m.language &&
        (isReplacement || !prev.language.trim() || prev.language === "English")
      ) {
        if (isReplacement && m.language !== prev.language) changed.push(m.language);
        next.language = m.language;
      }

      if (!prev.keyInsights.trim() && m.keyInsights?.length)
        next.keyInsights = m.keyInsights.join("\n");
      if (!prev.category.trim() && m.category) next.category = m.category;
      if (!prev.tags.trim() && m.tags?.length) next.tags = m.tags.join(", ");
    }

    // A new file means a new first page, so the old rasterised cover no longer
    // represents it.
    if (result.coverImageId && (isReplacement || !prev.coverImageId)) {
      if (isReplacement && result.coverImageId !== prev.coverImageId) changed.push("cover");
      next.coverImageId = result.coverImageId;
    }

    setForm(next);
    setRefreshNote(
      isReplacement
        ? changed.length
          ? `Updated from the new file: ${changed.join(", ")}.` +
            (result.aiPending ? " Redrafting the listing…" : "")
          : "File replaced. Nothing else changed."
        : null
    );

    // AI drafting is a SEPARATE request on purpose. Doing it inside the upload
    // used to push that one request past the proxy's origin timeout on a big
    // PDF, and the browser got an HTML error page instead of JSON.
    if (result.aiPending) {
      void autoDraftWithAI(result, { overwrite: isReplacement });
    }
  };

  /**
   * Draft the description / insights / category / tags from AI right after an
   * upload. Never blocks the editor if it fails.
   *
   * `overwrite` is set when replacing an existing book's file: the prose
   * describes content that has just changed, so leaving the old text in place
   * would leave the listing describing a file that is no longer there.
   */
  const autoDraftWithAI = async (
    result: BookUploadResult,
    { overwrite = false }: { overwrite?: boolean } = {}
  ) => {
    setAiBusy(true);
    setAiError(null);
    try {
      const res = await fetch("/api/admin/books/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: result.fileId,
          title: result.metadata?.title,
          author: result.metadata?.author,
        }),
      });
      const data = await readJson<{
        description?: string;
        keyInsights?: string[];
        category?: string;
        tags?: string[];
      }>(res, "AI drafting failed");

      const take = (hasValue: boolean) => overwrite || !hasValue;
      setForm((prev) => ({
        ...prev,
        description:
          data.description && take(Boolean(prev.description.trim()))
            ? data.description
            : prev.description,
        keyInsights:
          data.keyInsights?.length && take(Boolean(prev.keyInsights.trim()))
            ? data.keyInsights.join("\n")
            : prev.keyInsights,
        category:
          data.category && take(Boolean(prev.category.trim())) ? data.category : prev.category,
        tags:
          data.tags?.length && take(Boolean(prev.tags.trim()))
            ? data.tags.join(", ")
            : prev.tags,
      }));
      if (overwrite) {
        setRefreshNote((note) =>
          note
            ? note.replace("Redrafting the listing…", "Listing redrafted from the new file.")
            : "Listing redrafted from the new file."
        );
      }
    } catch (err) {
      // The file is already saved; a failed draft is not a failed upload.
      setAiError(
        `${err instanceof Error ? err.message : "AI drafting failed"} — the file uploaded fine; ` +
          `write the description yourself or press "Draft with AI".`
      );
    } finally {
      setAiBusy(false);
    }
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
      const data = await readJson<{
        description?: string;
        keyInsights?: string[];
        category?: string;
        tags?: string[];
      }>(res, "AI drafting failed");
      setForm((prev) => ({
        ...prev,
        description: data.description || prev.description,
        keyInsights: data.keyInsights?.length
          ? data.keyInsights.join("\n")
          : prev.keyInsights,
        category: !prev.category.trim() && data.category ? data.category : prev.category,
        tags:
          !prev.tags.trim() && data.tags?.length ? data.tags.join(", ") : prev.tags,
      }));
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "AI drafting failed");
    } finally {
      setAiBusy(false);
    }
  };

  /**
   * Draft catalogue copy for every book, one request per book.
   *
   * Sequential on purpose: each book means extracting its text and waiting on
   * the model, so a single request for the whole catalogue would run past the
   * proxy's ~100s limit and come back as an HTML error page. Doing one at a
   * time also keeps it resumable — stopping or a failure part-way leaves every
   * book already processed saved.
   */
  const runBulkEnrich = async (overwrite: boolean) => {
    const targets = books.map((b) => ({ id: b.id, title: b.title }));
    if (targets.length === 0) return;

    cancelEnrich.current = false;
    setBulkResult(null);
    setEnrichRun({ done: 0, total: targets.length, current: targets[0].title, log: [] });

    let updated = 0;
    let skipped = 0;
    let failed = 0;
    const log: string[] = [];

    for (let i = 0; i < targets.length; i++) {
      if (cancelEnrich.current) {
        log.push(`Stopped after ${i} of ${targets.length}.`);
        break;
      }
      const book = targets[i];
      setEnrichRun({ done: i, total: targets.length, current: book.title, log: [...log] });

      try {
        const res = await fetch(`/api/admin/books/${book.id}/enrich`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ overwrite }),
        });
        const data = await readJson<{
          status?: string;
          fields?: string[];
          reason?: string;
        }>(res, "Enrichment failed");

        if (data.status === "updated") {
          updated++;
          log.push(`✓ ${book.title} — ${(data.fields || []).join(", ")}`);
        } else {
          skipped++;
          log.push(`– ${book.title} — ${data.reason || "skipped"}`);
        }
      } catch (err) {
        failed++;
        log.push(`✗ ${book.title} — ${err instanceof Error ? err.message : "failed"}`);
      }
    }

    setEnrichRun(null);
    setBulkResult(
      `AI drafting finished: ${updated} updated` +
        (skipped ? `, ${skipped} skipped` : "") +
        (failed ? `, ${failed} failed` : "") +
        `.\n${log.join("\n")}`
    );
    fetchBooks();
  };

  const handleBulkImport = async (fileList: FileList) => {
    if (fileList.length === 0) return;
    setBulkBusy(true);
    setBulkResult(null);
    try {
      const fd = new FormData();
      Array.from(fileList).forEach((f) => fd.append("files", f));
      const res = await fetch("/api/admin/books/bulk", { method: "POST", body: fd });
      const data = await readJson<{ created?: unknown[]; failed?: unknown[] }>(
        res,
        "Import failed"
      );
      const okCount = data.created?.length || 0;
      const failCount = data.failed?.length || 0;
      setBulkResult(
        `Imported ${okCount} book${okCount === 1 ? "" : "s"} as drafts` +
          (failCount ? ` · ${failCount} failed` : "") +
          ". Set prices and publish them below."
      );
      fetchBooks();
    } catch (err) {
      setBulkResult(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBulkBusy(false);
    }
  };

  const handleDelete = async (b: Book) => {
    if (!confirm(`Delete "${b.title}"? This cannot be undone.`)) return;
    try {
      let res = await fetch(`/api/admin/books/${b.id}`, { method: "DELETE" });
      if (res.status === 409) {
        // Book has order history — offer to archive, or force-delete.
        const data = await res.json().catch(() => ({}));
        const forceIt = confirm(
          `${data.error || "This book has orders."}\n\n` +
            `OK = delete anyway (also removes those order lines & download links).\n` +
            `Cancel = keep it (tip: use Archive to hide it from the store).`
        );
        if (!forceIt) return;
        res = await fetch(`/api/admin/books/${b.id}?force=true`, { method: "DELETE" });
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Delete failed");
        return;
      }
      fetchBooks();
    } catch {
      alert("Delete failed");
    }
  };

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allSelected = books.length > 0 && selected.size === books.length;
  const toggleSelectAll = () =>
    setSelected(allSelected ? new Set() : new Set(books.map((b) => b.id)));

  // Delete via the bulk endpoint; a 409 (sold books) escalates to a second,
  // explicit force confirmation instead of silently failing.
  const runBulkDelete = async (
    payload: { ids?: string[]; all?: boolean },
    force = false
  ): Promise<void> => {
    const res = await fetch("/api/admin/books/bulk", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, force }),
    });
    if (res.status === 409) {
      const data = await res.json().catch(() => ({}));
      setConfirmDialog({
        title: "Some books have orders",
        message: `${data.error || "Some selected books appear in orders."}\n\nDelete them anyway? This also removes those order lines and buyers' download links.`,
        confirmLabel: "Delete anyway",
        requireText: "DELETE",
        onConfirm: () => runBulkDelete(payload, true),
      });
      return;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Delete failed");
      return;
    }
    setSelected(new Set());
    fetchBooks();
  };

  const confirmDeleteSelected = () => {
    if (selected.size === 0) return;
    const n = selected.size;
    setConfirmDialog({
      title: `Delete ${n} selected book${n === 1 ? "" : "s"}`,
      message: `Permanently delete the ${n} selected book${
        n === 1 ? "" : "s"
      }, including their files and covers? This cannot be undone.`,
      confirmLabel: "Delete",
      onConfirm: () => runBulkDelete({ ids: [...selected] }),
    });
  };

  const confirmDeleteAll = () => {
    if (books.length === 0) return;
    setConfirmDialog({
      title: "Delete ALL books",
      message: `This permanently deletes all ${books.length} book${
        books.length === 1 ? "" : "s"
      }, along with their files and covers. This cannot be undone. Type DELETE to confirm.`,
      confirmLabel: "Delete everything",
      requireText: "DELETE",
      onConfirm: () => runBulkDelete({ all: true }),
    });
  };

  const runConfirm = async () => {
    if (!confirmDialog) return;
    const dialog = confirmDialog;
    setConfirmBusy(true);
    // Close the current dialog first so onConfirm can open a follow-up
    // (e.g. the force-delete escalation) without it being wiped.
    setConfirmDialog(null);
    setConfirmText("");
    try {
      await dialog.onConfirm();
    } finally {
      setConfirmBusy(false);
    }
  };

  const setBookStatus = async (b: Book, status: "PUBLISHED" | "ARCHIVED") => {
    try {
      const res = await fetch(`/api/admin/books/${b.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        alert("Could not update the book status");
        return;
      }
      fetchBooks();
    } catch {
      alert("Could not update the book status");
    }
  };

  const totalUnits = books.reduce((s, b) => s + b.stats.unitsSold, 0);
  const revenueByCurrency = (() => {
    const m = new Map<string, number>();
    for (const b of books) {
      if (b.stats.revenueCents > 0)
        m.set(b.currency, (m.get(b.currency) || 0) + b.stats.revenueCents);
    }
    return [...m.entries()]
      .map(([currency, cents]) => formatPrice(cents, currency))
      .join(" · ");
  })();

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
            {books.length} books · {totalUnits} sold
            {revenueByCurrency ? ` · ${revenueByCurrency} revenue` : ""}
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
            disabled={bulkBusy || enrichRun !== null}
            className="flex items-center gap-2 px-4 py-2 border border-gold/40 text-gold font-medium rounded-lg hover:bg-gold/10 transition-all disabled:opacity-50"
          >
            <UploadCloud className="w-4 h-4" />
            {bulkBusy ? "Importing…" : "Bulk import"}
          </button>
          <button
            onClick={() =>
              setConfirmDialog({
                title: "Draft listings for every book with AI",
                message:
                  `This reads each of the ${books.length} books and rewrites its description from ` +
                  `the actual text. Key insights, category and tags are only filled in where they ` +
                  `are currently empty, so nothing you have written by hand is replaced. Any DOI ` +
                  `in an existing description is carried across.\n\n` +
                  `It runs one book at a time — roughly ${Math.max(1, Math.round(books.length * 10 / 60))}–` +
                  `${Math.max(2, Math.round(books.length * 25 / 60))} minutes for ${books.length}. You can stop it ` +
                  `part-way; books already done stay saved.`,
                confirmLabel: "Draft all listings",
                onConfirm: () => runBulkEnrich(false),
              })
            }
            disabled={bulkBusy || enrichRun !== null || books.length === 0}
            className="flex items-center gap-2 px-4 py-2 border border-gold/40 text-gold font-medium rounded-lg hover:bg-gold/10 transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            Draft all with AI
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

      {enrichRun && (
        <div className="glass rounded-lg p-4 mb-4 text-sm">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-gold shrink-0 animate-pulse" />
            <span className="flex-1">
              Drafting {enrichRun.done + 1} of {enrichRun.total} —{" "}
              <span className="text-text-secondary">{enrichRun.current}</span>
            </span>
            <button
              onClick={() => {
                cancelEnrich.current = true;
              }}
              className="text-xs px-2 py-1 rounded border border-glass-border text-text-secondary hover:text-gold hover:border-gold/40"
            >
              Stop
            </button>
          </div>
          <div
            className="h-1.5 rounded-full bg-navy/60 overflow-hidden"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={enrichRun.total}
            aria-valuenow={enrichRun.done}
            aria-label="Books drafted"
          >
            <div
              className="h-full bg-gold transition-all duration-300"
              style={{ width: `${(enrichRun.done / enrichRun.total) * 100}%` }}
            />
          </div>
          {enrichRun.log.length > 0 && (
            <ul className="mt-3 space-y-0.5 text-xs text-text-secondary max-h-32 overflow-y-auto">
              {enrichRun.log.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {bulkResult && (
        <div className="glass rounded-lg p-3 mb-4 text-sm flex items-start gap-2">
          <UploadCloud className="w-4 h-4 text-gold mt-0.5 shrink-0" />
          <span className="flex-1 whitespace-pre-wrap">{bulkResult}</span>
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
        <>
          {/* Selection / bulk-delete toolbar */}
          <div className="flex items-center flex-wrap gap-3 mb-3 text-sm">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-text-secondary hover:text-gold transition-colors"
            >
              {allSelected ? (
                <CheckSquare className="w-4 h-4 text-gold" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {allSelected ? "Deselect all" : "Select all"}
            </button>
            {selected.size > 0 && (
              <>
                <span className="text-text-muted">·</span>
                <span className="text-text-secondary">{selected.size} selected</span>
                <button
                  onClick={confirmDeleteSelected}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-all font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete selected
                </button>
              </>
            )}
            <div className="flex-1" />
            <button
              onClick={confirmDeleteAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-all font-medium"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Delete all
            </button>
          </div>
          <div className="space-y-3">
          {books.map((b) => (
            <div
              key={b.id}
              className={`glass rounded-xl p-4 flex gap-4 items-center transition-colors ${
                selected.has(b.id) ? "ring-1 ring-gold/50 bg-gold/5" : ""
              }`}
            >
              <button
                onClick={() => toggleSelect(b.id)}
                className="shrink-0 text-text-secondary hover:text-gold transition-colors"
                aria-label={selected.has(b.id) ? "Deselect book" : "Select book"}
                aria-pressed={selected.has(b.id)}
              >
                {selected.has(b.id) ? (
                  <CheckSquare className="w-5 h-5 text-gold" />
                ) : (
                  <Square className="w-5 h-5" />
                )}
              </button>
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
                  {b.publicationYear} ·{" "}
                  {b.priceCents === 0 ? (
                    <span className="text-green-400 font-medium">Free</span>
                  ) : (
                    formatPrice(b.priceCents, b.currency)
                  )}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-text-secondary">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" /> {b.stats.views} views
                  </span>
                  <span className="flex items-center gap-1">
                    <ShoppingBag className="w-3 h-3" /> {b.stats.unitsSold} sold
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" /> {formatPrice(b.stats.revenueCents, b.currency)}
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
                {b.status === "ARCHIVED" ? (
                  <button
                    onClick={() => setBookStatus(b, "PUBLISHED")}
                    className="p-2 text-text-secondary hover:text-green-400 transition-colors"
                    aria-label="Restore (publish)"
                    title="Restore & publish"
                  >
                    <ArchiveRestore className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setBookStatus(b, "ARCHIVED")}
                    className="p-2 text-text-secondary hover:text-amber-400 transition-colors"
                    aria-label="Archive"
                    title="Archive (hide from store)"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                )}
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
        </>
      )}

      {/* Confirmation modal (bulk delete) */}
      {confirmDialog && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
          onClick={() => !confirmBusy && setConfirmDialog(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            onClick={(e) => e.stopPropagation()}
            className="glass-strong rounded-2xl w-full max-w-md p-6"
          >
            <div className="flex items-start gap-3 mb-4">
              <span className="w-10 h-10 rounded-lg bg-red-500/15 text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <h2 id="confirm-title" className="text-lg font-semibold">
                  {confirmDialog.title}
                </h2>
                <p className="text-sm text-text-secondary mt-1 whitespace-pre-line">
                  {confirmDialog.message}
                </p>
              </div>
              <button
                onClick={() => !confirmBusy && setConfirmDialog(null)}
                className="ml-auto p-1 text-text-secondary hover:text-text-primary"
                aria-label="Cancel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {confirmDialog.requireText && (
              <input
                autoFocus
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={`Type ${confirmDialog.requireText} to confirm`}
                className={`${INPUT_CLASS} mb-4`}
              />
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDialog(null)}
                disabled={confirmBusy}
                className="px-4 py-2 rounded-lg border border-glass-border text-text-secondary hover:text-text-primary transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={runConfirm}
                disabled={
                  confirmBusy ||
                  (!!confirmDialog.requireText && confirmText.trim() !== confirmDialog.requireText)
                }
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition-all disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {confirmBusy ? "Deleting…" : confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
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
                  <label className="block text-sm text-text-secondary mb-1">Price *</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    className={`${INPUT_CLASS} ${form.free ? "opacity-50" : ""}`}
                    value={form.free ? "0" : form.priceDollars}
                    onChange={(e) => setForm({ ...form, priceDollars: e.target.value })}
                    placeholder="50"
                    disabled={form.free}
                    required={!form.free}
                  />
                  <label className="flex items-center gap-2 text-sm text-text-secondary mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.free}
                      onChange={(e) => setForm({ ...form, free: e.target.checked })}
                      className="accent-gold"
                    />
                    Make this book free (no payment required)
                  </label>
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Currency *</label>
                  <select
                    className={INPUT_CLASS}
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  >
                    {SUPPORTED_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
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
              {refreshNote && (
                <p className="text-xs text-gold -mt-2 flex items-start gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{refreshNote}</span>
                </p>
              )}
              <p className="text-xs text-text-secondary -mt-2">
                A first upload fills whatever is still empty (title, author, year, pages, ISBN,
                language, description) and sets the cover. <strong>Replacing</strong> the file
                refreshes everything that describes it — pages, ISBN, language, cover — and
                redrafts the listing, since those would otherwise describe the old file. The title
                and subtitle are never changed. Nothing is saved until you press Save.
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
