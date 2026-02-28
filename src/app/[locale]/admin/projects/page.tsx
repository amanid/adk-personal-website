"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, FolderOpen, Star, ExternalLink } from "lucide-react";
import FileUpload from "@/components/admin/FileUpload";

interface Project {
  id: string;
  title: string;
  titleFr: string | null;
  slug: string;
  description: string;
  descriptionFr: string | null;
  coverImage: string | null;
  technologies: string[];
  category: string | null;
  liveUrl: string | null;
  githubUrl: string | null;
  featured: boolean;
  sortOrder: number;
}

const CATEGORIES = ["AI/ML", "Data Engineering", "Data Governance", "Analytics"];

const defaultForm = {
  title: "",
  titleFr: "",
  description: "",
  descriptionFr: "",
  coverImage: "",
  technologies: "",
  category: "",
  liveUrl: "",
  githubUrl: "",
  featured: false,
  sortOrder: 0,
};

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/admin/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const openNewEditor = () => {
    setEditingProject(null);
    setForm(defaultForm);
    setShowEditor(true);
  };

  const openEditEditor = (project: Project) => {
    setEditingProject(project);
    setForm({
      title: project.title,
      titleFr: project.titleFr || "",
      description: project.description,
      descriptionFr: project.descriptionFr || "",
      coverImage: project.coverImage || "",
      technologies: project.technologies.join(", "),
      category: project.category || "",
      liveUrl: project.liveUrl || "",
      githubUrl: project.githubUrl || "",
      featured: project.featured,
      sortOrder: project.sortOrder,
    });
    setShowEditor(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingProject ? "PUT" : "POST";
    const url = editingProject
      ? `/api/admin/projects/${editingProject.id}`
      : "/api/admin/projects";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        technologies: form.technologies
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        sortOrder: Number(form.sortOrder),
      }),
    });

    if (res.ok) {
      setShowEditor(false);
      setEditingProject(null);
      setForm(defaultForm);
      fetchProjects();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      const res = await fetch(`/api/admin/projects/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
      }
    } catch {
      // Handle error
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] gradient-text">
          Projects
        </h1>
        <button
          onClick={openNewEditor}
          className="flex items-center gap-2 px-4 py-2 bg-gold text-charcoal font-medium rounded-lg hover:bg-gold-light transition-all text-sm"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {showEditor && (
        <div className="glass rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {editingProject ? "Edit Project" : "Create New Project"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  onChange={(e) => setForm({ ...form, titleFr: e.target.value })}
                  className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-1">
                Description (EN) *
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none font-mono text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-1">
                Description (FR)
              </label>
              <textarea
                value={form.descriptionFr}
                onChange={(e) =>
                  setForm({ ...form, descriptionFr: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none font-mono text-sm"
              />
            </div>

            <FileUpload
              accept="image/*"
              onUpload={(url) => setForm({ ...form, coverImage: url })}
              currentUrl={form.coverImage}
              label="Cover Image"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">
                  Technologies (comma-separated) *
                </label>
                <input
                  value={form.technologies}
                  onChange={(e) =>
                    setForm({ ...form, technologies: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none"
                  placeholder="Python, TensorFlow, Docker"
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">
                  Live URL
                </label>
                <input
                  value={form.liveUrl}
                  onChange={(e) =>
                    setForm({ ...form, liveUrl: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none"
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">
                  GitHub URL
                </label>
                <input
                  value={form.githubUrl}
                  onChange={(e) =>
                    setForm({ ...form, githubUrl: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none"
                  placeholder="https://github.com/..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) =>
                      setForm({ ...form, featured: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-glass-border"
                  />
                  <span className="text-sm text-text-secondary">Featured</span>
                </label>
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm({ ...form, sortOrder: Number(e.target.value) })
                  }
                  className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-gold text-charcoal font-medium rounded-lg hover:bg-gold-light transition-all text-sm"
              >
                {editingProject ? "Update" : "Create"} Project
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEditor(false);
                  setEditingProject(null);
                }}
                className="px-6 py-2 glass text-text-secondary rounded-lg hover:text-gold transition-all text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="glass rounded-xl p-5 animate-pulse h-24"
            />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-secondary">No projects yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="glass rounded-xl p-5 flex items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-medium truncate">
                    {project.title}
                  </h3>
                  {project.featured && (
                    <Star className="w-3.5 h-3.5 text-gold shrink-0" />
                  )}
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-text-muted hover:text-gold transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-3 text-text-muted text-xs mb-2">
                  {project.category && <span>{project.category}</span>}
                  <span>Order: {project.sortOrder}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {project.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="text-xs px-2 py-0.5 rounded bg-navy-light text-text-secondary"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditEditor(project)}
                  className="p-1.5 text-text-secondary hover:text-gold transition-colors"
                  aria-label="Edit project"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(project.id)}
                  className="p-1.5 text-text-secondary hover:text-red-400 transition-colors"
                  aria-label="Delete project"
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
