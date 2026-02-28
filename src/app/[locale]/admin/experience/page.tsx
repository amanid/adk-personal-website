"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Edit, Trash2, Building2, MapPin, Calendar } from "lucide-react";

interface Experience {
  id: string;
  role: string;
  roleFr: string | null;
  organization: string;
  location: string;
  startDate: string;
  endDate: string | null;
  description: string[];
  descriptionFr: string[];
  logo: string | null;
  sortOrder: number;
}

interface ExperienceForm {
  role: string;
  roleFr: string;
  organization: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  descriptionFr: string;
  logo: string;
  sortOrder: number;
}

const emptyForm: ExperienceForm = {
  role: "",
  roleFr: "",
  organization: "",
  location: "",
  startDate: "",
  endDate: "",
  description: "",
  descriptionFr: "",
  logo: "",
  sortOrder: 0,
};

export default function AdminExperiencePage() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ExperienceForm>(emptyForm);

  const fetchExperiences = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/experience");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setExperiences(data.experiences);
    } catch {
      setError("Failed to load experiences");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExperiences();
  }, [fetchExperiences]);

  const handleEdit = (exp: Experience) => {
    setEditingId(exp.id);
    setForm({
      role: exp.role,
      roleFr: exp.roleFr || "",
      organization: exp.organization,
      location: exp.location,
      startDate: exp.startDate,
      endDate: exp.endDate || "",
      description: exp.description.join("\n"),
      descriptionFr: exp.descriptionFr.join("\n"),
      logo: exp.logo || "",
      sortOrder: exp.sortOrder,
    });
    setShowForm(true);
    setError("");
  };

  const handleNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setError("");
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      role: form.role,
      roleFr: form.roleFr || undefined,
      organization: form.organization,
      location: form.location,
      startDate: form.startDate,
      endDate: form.endDate || null,
      description: form.description.split("\n").filter((line) => line.trim() !== ""),
      descriptionFr: form.descriptionFr
        ? form.descriptionFr.split("\n").filter((line) => line.trim() !== "")
        : [],
      logo: form.logo || undefined,
      sortOrder: form.sortOrder,
    };

    try {
      const url = editingId
        ? `/api/admin/experience/${editingId}`
        : "/api/admin/experience";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      await fetchExperiences();
      handleCancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save experience");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this experience?")) return;

    try {
      const res = await fetch(`/api/admin/experience/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      await fetchExperiences();
    } catch {
      setError("Failed to delete experience");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-text-muted">Loading experiences...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] gradient-text">
          Experience Management
        </h1>
        {!showForm && (
          <button onClick={handleNew} className="flex items-center gap-2 px-4 py-2 bg-gold text-charcoal font-medium rounded-lg hover:bg-gold-light transition-all text-sm">
            <Plus size={16} />
            New Experience
          </button>
        )}
      </div>

      {error && (
        <div className="glass rounded-xl p-4 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {showForm && (
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            {editingId ? "Edit Experience" : "New Experience"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">
                  Role *
                </label>
                <input
                  type="text"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none"
                  placeholder="e.g. Data Scientist"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">
                  Role (French)
                </label>
                <input
                  type="text"
                  value={form.roleFr}
                  onChange={(e) => setForm({ ...form, roleFr: e.target.value })}
                  className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none"
                  placeholder="e.g. Scientifique des Données"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">
                  Organization *
                </label>
                <input
                  type="text"
                  value={form.organization}
                  onChange={(e) => setForm({ ...form, organization: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none"
                  placeholder="e.g. Afreximbank"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">
                  Location *
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none"
                  placeholder="e.g. Cairo, Egypt"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">
                  Start Date *
                </label>
                <input
                  type="text"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none"
                  placeholder="e.g. Jan 2023"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">
                  End Date
                </label>
                <input
                  type="text"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none"
                  placeholder="e.g. Present (leave empty for current)"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-1">
                Logo URL
              </label>
              <input
                type="text"
                value={form.logo}
                onChange={(e) => setForm({ ...form, logo: e.target.value })}
                className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none"
                placeholder="e.g. /images/logos/org.png"
              />
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-1">
                Description * (one bullet point per line)
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
                rows={5}
                className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none font-mono text-sm"
                placeholder={"Led data analytics team of 5 members\nDeveloped ML models for risk assessment\nAutomated reporting pipelines"}
              />
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-1">
                Description French (one bullet point per line)
              </label>
              <textarea
                value={form.descriptionFr}
                onChange={(e) => setForm({ ...form, descriptionFr: e.target.value })}
                rows={5}
                className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none font-mono text-sm"
                placeholder={"Direction de l'équipe d'analyse de données\nDéveloppement de modèles ML\nAutomatisation des rapports"}
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-gold text-charcoal font-medium rounded-lg hover:bg-gold-light transition-all text-sm disabled:opacity-50"
              >
                {saving ? "Saving..." : editingId ? "Update Experience" : "Create Experience"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 glass text-text-secondary rounded-lg hover:text-gold transition-all text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {experiences.length === 0 ? (
          <div className="glass rounded-xl p-6 text-center text-text-muted">
            No experiences found. Click &quot;New Experience&quot; to add one.
          </div>
        ) : (
          experiences.map((exp) => (
            <div
              key={exp.id}
              className="glass rounded-xl p-5 hover:bg-white/[0.02] transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-text-primary font-semibold truncate">
                      {exp.role}
                    </h3>
                    <span className="text-text-muted text-xs">
                      #{exp.sortOrder}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                    <span className="flex items-center gap-1.5 text-sm text-gold">
                      <Building2 size={14} />
                      {exp.organization}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm text-text-secondary">
                      <MapPin size={14} />
                      {exp.location}
                    </span>
                    <span className="flex items-center gap-1.5 text-text-muted text-xs">
                      <Calendar size={14} />
                      {exp.startDate} &mdash; {exp.endDate || "Present"}
                    </span>
                  </div>
                  {exp.description.length > 0 && (
                    <ul className="mt-2 space-y-0.5">
                      {exp.description.slice(0, 3).map((item, idx) => (
                        <li
                          key={idx}
                          className="text-text-muted text-xs truncate"
                        >
                          &bull; {item}
                        </li>
                      ))}
                      {exp.description.length > 3 && (
                        <li className="text-text-muted text-xs">
                          &hellip; +{exp.description.length - 3} more
                        </li>
                      )}
                    </ul>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleEdit(exp)}
                    className="p-2 glass rounded-lg text-text-secondary hover:text-gold transition-all"
                    title="Edit"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(exp.id)}
                    className="p-2 glass rounded-lg text-text-secondary hover:text-red-400 transition-all"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
