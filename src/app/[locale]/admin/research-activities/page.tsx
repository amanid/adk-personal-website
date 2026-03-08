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
} from "lucide-react";
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
}

const ACTIVITY_TYPES: { value: ResearchActivityType; label: string }[] = [
  { value: "CONFERENCE_ATTENDED", label: "Conference Attended" },
  { value: "TALK_GIVEN", label: "Talk Given" },
  { value: "PEER_REVIEW", label: "Peer Review" },
  { value: "GRANT_RECEIVED", label: "Grant Received" },
  { value: "MILESTONE", label: "Milestone" },
  { value: "WORKSHOP", label: "Workshop" },
  { value: "AWARD", label: "Award" },
  { value: "OTHER", label: "Other" },
];

const emptyForm = {
  type: "MILESTONE" as ResearchActivityType,
  title: "",
  titleFr: "",
  description: "",
  descriptionFr: "",
  date: new Date().toISOString().split("T")[0],
  location: "",
  locationFr: "",
  url: "",
};

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as ResearchActivityType })}
                className="w-full px-3 py-2 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none"
              >
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Title (EN) *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Title (FR)</label>
              <input
                type="text"
                value={form.titleFr}
                onChange={(e) => setForm({ ...form, titleFr: e.target.value })}
                className="w-full px-3 py-2 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Description (EN)</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none resize-none"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Description (FR)</label>
              <textarea
                value={form.descriptionFr}
                onChange={(e) => setForm({ ...form, descriptionFr: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none resize-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Location (EN)</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full px-3 py-2 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Location (FR)</label>
              <input
                type="text"
                value={form.locationFr}
                onChange={(e) => setForm({ ...form, locationFr: e.target.value })}
                className="w-full px-3 py-2 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1">URL (optional)</label>
            <input
              type="url"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              className="w-full px-3 py-2 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none"
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
                {activity.url && (
                  <a
                    href={activity.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-gold hover:text-gold-light mt-1 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Link
                  </a>
                )}
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
