"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  Calendar,
  MapPin,
  ExternalLink,
  FlaskConical,
  Lock,
  Unlock,
  FileText,
  Database,
  Paperclip,
  Eye,
  EyeOff,
} from "lucide-react";
import FileUpload from "@/components/admin/FileUpload";
import type { ResearchActivityType } from "@/types";

interface Activity {
  id: string;
  type: ResearchActivityType;
  title: string;
  titleFr: string | null;
  description: string | null;
  descriptionFr: string | null;
  date: string;
  location: string | null;
  locationFr: string | null;
  url: string | null;
  paperUrl: string | null;
  dataUrl: string | null;
  supplementaryUrl: string | null;
  accessLevel: string;
  published: boolean;
}

const ACTIVITY_TYPES: { value: ResearchActivityType; label: string; group: string }[] = [
  // Publications & Outputs
  { value: "RESEARCH_PAPER", label: "Research Paper", group: "Publications" },
  { value: "JOURNAL_ARTICLE", label: "Journal Article", group: "Publications" },
  { value: "CONFERENCE_PAPER", label: "Conference Paper", group: "Publications" },
  { value: "WORKING_PAPER", label: "Working Paper", group: "Publications" },
  { value: "TECHNICAL_REPORT", label: "Technical Report", group: "Publications" },
  { value: "BOOK_CHAPTER", label: "Book Chapter", group: "Publications" },
  { value: "DATASET_RELEASE", label: "Dataset Release", group: "Publications" },
  { value: "SOFTWARE_RELEASE", label: "Software Release", group: "Publications" },
  { value: "PATENT", label: "Patent", group: "Publications" },
  // Events & Engagement
  { value: "CONFERENCE_ATTENDED", label: "Conference Attended", group: "Events" },
  { value: "TALK_GIVEN", label: "Talk / Presentation Given", group: "Events" },
  { value: "WORKSHOP", label: "Workshop", group: "Events" },
  // Academic & Professional
  { value: "PEER_REVIEW", label: "Peer Review", group: "Academic" },
  { value: "GRANT_RECEIVED", label: "Grant Received", group: "Academic" },
  { value: "TEACHING", label: "Teaching / Lecturing", group: "Academic" },
  { value: "SUPERVISION", label: "Thesis / Student Supervision", group: "Academic" },
  { value: "COLLABORATION", label: "Research Collaboration", group: "Academic" },
  // Other
  { value: "AWARD", label: "Award / Honour", group: "Other" },
  { value: "MILESTONE", label: "Milestone", group: "Other" },
  { value: "OTHER", label: "Other", group: "Other" },
];

const emptyForm = {
  type: "RESEARCH_PAPER" as ResearchActivityType,
  title: "",
  titleFr: "",
  description: "",
  descriptionFr: "",
  date: new Date().toISOString().split("T")[0],
  location: "",
  locationFr: "",
  url: "",
  paperUrl: "",
  dataUrl: "",
  supplementaryUrl: "",
  accessLevel: "FREE",
  published: false,
};

const INPUT_CLASS = "w-full px-3 py-2 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none text-sm";

export default function AdminResearchActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchActivities = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/research-activities");
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (activity: Activity) => {
    setForm({
      type: activity.type,
      title: activity.title,
      titleFr: activity.titleFr || "",
      description: activity.description || "",
      descriptionFr: activity.descriptionFr || "",
      date: activity.date.split("T")[0],
      location: activity.location || "",
      locationFr: activity.locationFr || "",
      url: activity.url || "",
      paperUrl: activity.paperUrl || "",
      dataUrl: activity.dataUrl || "",
      supplementaryUrl: activity.supplementaryUrl || "",
      accessLevel: activity.accessLevel || "FREE",
      published: activity.published ?? false,
    });
    setEditingId(activity.id);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        titleFr: form.titleFr || undefined,
        description: form.description || undefined,
        descriptionFr: form.descriptionFr || undefined,
        location: form.location || undefined,
        locationFr: form.locationFr || undefined,
        url: form.url || undefined,
        paperUrl: form.paperUrl || undefined,
        dataUrl: form.dataUrl || undefined,
        supplementaryUrl: form.supplementaryUrl || undefined,
        accessLevel: form.accessLevel as "FREE" | "GATED",
        published: form.published,
      };

      const url = editingId
        ? `/api/admin/research-activities/${editingId}`
        : "/api/admin/research-activities";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        resetForm();
        fetchActivities();
      }
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this activity?")) return;
    try {
      const res = await fetch(`/api/admin/research-activities/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setActivities((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] gradient-text">
          Research Activities
        </h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gold text-charcoal font-medium text-sm rounded-lg hover:bg-gold-light transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Activity
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSave} className="glass rounded-xl p-6 mb-8 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">
              {editingId ? "Edit Activity" : "New Activity"}
            </h2>
            <button type="button" onClick={resetForm} className="text-text-muted hover:text-text-primary">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Type & Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as ResearchActivityType })}
                className={INPUT_CLASS}
              >
                {["Publications", "Events", "Academic", "Other"].map((group) => (
                  <optgroup key={group} label={group}>
                    {ACTIVITY_TYPES.filter((t) => t.group === group).map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className={INPUT_CLASS}
                required
              />
            </div>
          </div>

          {/* Title EN/FR */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Title (EN) *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={INPUT_CLASS}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Title (FR)</label>
              <input
                type="text"
                value={form.titleFr}
                onChange={(e) => setForm({ ...form, titleFr: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          {/* Description EN/FR */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Description (EN)</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className={INPUT_CLASS + " resize-none"}
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Description (FR)</label>
              <textarea
                value={form.descriptionFr}
                onChange={(e) => setForm({ ...form, descriptionFr: e.target.value })}
                rows={3}
                className={INPUT_CLASS + " resize-none"}
              />
            </div>
          </div>

          {/* File Uploads — Paper, Data, Supplementary */}
          <div className="p-4 border border-gold/20 rounded-lg bg-gold/[0.02] space-y-4">
            <h3 className="text-sm font-medium text-gold flex items-center gap-2">
              <Paperclip className="w-4 h-4" />
              File Attachments
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <FileUpload
                  accept=".pdf,application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onUpload={(url) => setForm({ ...form, paperUrl: url })}
                  currentUrl={form.paperUrl}
                  label="Research Paper (PDF, Word)"
                />
              </div>
              <div>
                <FileUpload
                  accept=".csv,.xls,.xlsx,.json,.zip,.dta,.sav,.sps,.r,.rmd,.py,.ipynb,.do,text/csv,application/json,application/zip"
                  onUpload={(url) => setForm({ ...form, dataUrl: url })}
                  currentUrl={form.dataUrl}
                  label="Dataset (CSV, Excel, Stata, R, ZIP)"
                />
              </div>
              <div>
                <FileUpload
                  accept=".tex,.bib,.sty,.cls,.bst,.zip,.tar,.gz,.ppt,.pptx,.txt,application/zip,application/x-tex"
                  onUpload={(url) => setForm({ ...form, supplementaryUrl: url })}
                  currentUrl={form.supplementaryUrl}
                  label="Supplementary (LaTeX, Slides, ZIP)"
                />
              </div>
            </div>
          </div>

          {/* Access Level & Publish */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Access Level</label>
              <select
                value={form.accessLevel}
                onChange={(e) => setForm({ ...form, accessLevel: e.target.value })}
                className={INPUT_CLASS}
              >
                <option value="FREE">Free — Open access</option>
                <option value="GATED">Premium — Subscription required</option>
              </select>
            </div>
            <div className="flex items-end pb-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="published"
                  checked={form.published}
                  onChange={(e) => setForm({ ...form, published: e.target.checked })}
                  className="w-4 h-4 rounded border-glass-border"
                />
                <label htmlFor="published" className="text-sm text-text-secondary cursor-pointer">
                  Publish to Publications page
                </label>
              </div>
            </div>
          </div>

          {/* Location EN/FR */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Location (EN)</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Location (FR)</label>
              <input
                type="text"
                value={form.locationFr}
                onChange={(e) => setForm({ ...form, locationFr: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          {/* URL */}
          <div>
            <label className="block text-sm text-text-secondary mb-1">External URL (optional)</label>
            <input
              type="url"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              className={INPUT_CLASS}
              placeholder="https://..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 glass rounded-lg text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-gold text-charcoal font-medium text-sm rounded-lg hover:bg-gold-light transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : editingId ? "Update" : "Create"}
            </button>
          </div>
        </form>
      )}

      {/* Activities List */}
      {activities.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <FlaskConical className="w-8 h-8 text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary">No research activities yet.</p>
          <p className="text-text-muted text-sm mt-1">
            Track conferences, talks, peer reviews, grants, and milestones.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div key={activity.id} className="glass rounded-xl p-5 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/10 text-gold font-medium uppercase tracking-wider">
                    {ACTIVITY_TYPES.find((t) => t.value === activity.type)?.label || activity.type}
                  </span>
                  {activity.published ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-medium uppercase flex items-center gap-0.5">
                      <Eye className="w-2.5 h-2.5" />Published
                    </span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-500/10 text-zinc-400 font-medium uppercase flex items-center gap-0.5">
                      <EyeOff className="w-2.5 h-2.5" />Draft
                    </span>
                  )}
                  {activity.accessLevel === "GATED" ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 font-medium uppercase flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" />Premium
                    </span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium uppercase flex items-center gap-0.5">
                      <Unlock className="w-2.5 h-2.5" />Free
                    </span>
                  )}
                  <span className="text-xs text-text-muted flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(activity.date).toLocaleDateString()}
                  </span>
                  {activity.location && (
                    <span className="text-xs text-text-muted flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {activity.location}
                    </span>
                  )}
                </div>
                <h3 className="font-medium">{activity.title}</h3>
                {activity.titleFr && (
                  <p className="text-text-muted text-sm">{activity.titleFr}</p>
                )}
                {activity.description && (
                  <p className="text-text-secondary text-sm mt-1 line-clamp-2">{activity.description}</p>
                )}
                {/* File attachment indicators */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {activity.paperUrl && (
                    <span className="inline-flex items-center gap-1 text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                      <FileText className="w-3 h-3" />Paper
                    </span>
                  )}
                  {activity.dataUrl && (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      <Database className="w-3 h-3" />Dataset
                    </span>
                  )}
                  {activity.supplementaryUrl && (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                      <Paperclip className="w-3 h-3" />Supplementary
                    </span>
                  )}
                  {activity.url && (
                    <a
                      href={activity.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-gold hover:text-gold-light transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Link
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(activity)}
                  className="p-2 text-text-muted hover:text-gold transition-colors"
                  title="Edit"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(activity.id)}
                  className="p-2 text-text-muted hover:text-red-400 transition-colors"
                  title="Delete"
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
