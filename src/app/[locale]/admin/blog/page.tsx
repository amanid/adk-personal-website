"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Eye, EyeOff, Clock, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import dynamic from "next/dynamic";
import FileUpload from "@/components/admin/FileUpload";

const RichTextEditor = dynamic(
  () => import("@/components/admin/RichTextEditor"),
  { ssr: false }
);

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  category: string | null;
  views: number;
  createdAt: string;
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    title: "",
    titleFr: "",
    content: "",
    contentFr: "",
    excerpt: "",
    excerptFr: "",
    coverImage: "",
    category: "",
    tags: "",
    published: false,
  });

  const estimateReadingTime = (html: string) => {
    const text = html.replace(/<[^>]*>/g, "");
    const words = text.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const res = await fetch("/api/admin/blog");
    if (res.ok) {
      const data = await res.json();
      setPosts(data.posts || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const method = editingPost ? "PUT" : "POST";
      const url = editingPost ? `/api/admin/blog/${editingPost.id}` : "/api/blog";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tags: form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });

      if (res.ok) {
        setSuccess(editingPost ? "Post updated successfully!" : "Post created successfully!");
        setShowEditor(false);
        setEditingPost(null);
        setForm({
          title: "",
          titleFr: "",
          content: "",
          contentFr: "",
          excerpt: "",
          excerptFr: "",
          coverImage: "",
          category: "",
          tags: "",
          published: false,
        });
        fetchPosts();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to save post. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setSaving(false);
    }
  };

  const deletePost = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    const res = await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
    if (res.ok) fetchPosts();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] gradient-text">
          Blog Management
        </h1>
        <button
          onClick={() => {
            setShowEditor(true);
            setEditingPost(null);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gold text-charcoal font-medium rounded-lg hover:bg-gold-light transition-all text-sm"
        >
          <Plus className="w-4 h-4" />
          New Post
        </button>
      </div>

      {showEditor && (
        <div className="glass rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {editingPost ? "Edit Post" : "Create New Post"}
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

            {/* Cover Image */}
            <div>
              <label className="block text-sm text-text-secondary mb-1">
                Cover Image
              </label>
              <FileUpload
                accept="image/*"
                onUpload={(url) => setForm({ ...form, coverImage: url })}
                currentUrl={form.coverImage}
                label="Cover Image"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm text-text-secondary">
                  Content (EN) *
                </label>
                {form.content && (
                  <span className="flex items-center gap-1 text-xs text-text-muted">
                    <Clock className="w-3 h-3" />
                    ~{estimateReadingTime(form.content)} min read
                  </span>
                )}
              </div>
              <RichTextEditor
                content={form.content}
                onChange={(html) => setForm({ ...form, content: html })}
                placeholder="Write your blog post content..."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm text-text-secondary">
                  Content (FR)
                </label>
                {form.contentFr && (
                  <span className="flex items-center gap-1 text-xs text-text-muted">
                    <Clock className="w-3 h-3" />
                    ~{estimateReadingTime(form.contentFr)} min read
                  </span>
                )}
              </div>
              <RichTextEditor
                content={form.contentFr}
                onChange={(html) => setForm({ ...form, contentFr: html })}
                placeholder="Écrivez le contenu en français..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">
                  Excerpt (EN)
                </label>
                <textarea
                  value={form.excerpt}
                  onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                  className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none resize-none"
                  rows={3}
                  placeholder="Brief summary for blog cards and SEO..."
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">
                  Excerpt (FR)
                </label>
                <textarea
                  value={form.excerptFr}
                  onChange={(e) => setForm({ ...form, excerptFr: e.target.value })}
                  className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none resize-none"
                  rows={3}
                  placeholder="Résumé bref pour les cartes et le SEO..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">
                  Category
                </label>
                <input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none"
                  placeholder="AI, Machine Learning, Data"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={(e) =>
                      setForm({ ...form, published: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-glass-border"
                  />
                  <span className="text-sm text-text-secondary">Published</span>
                </label>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-gold text-charcoal font-medium rounded-lg hover:bg-gold-light transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? "Saving..." : `${editingPost ? "Update" : "Create"} Post`}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setShowEditor(false);
                  setEditingPost(null);
                  setError("");
                }}
                className="px-6 py-2 glass text-text-secondary rounded-lg hover:text-gold transition-all text-sm disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 px-4 py-3 mb-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {success}
        </div>
      )}

      {/* Posts List */}
      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-glass-border">
              <th className="text-left px-4 py-3 text-sm text-text-secondary font-medium">
                Title
              </th>
              <th className="text-left px-4 py-3 text-sm text-text-secondary font-medium hidden md:table-cell">
                Category
              </th>
              <th className="text-left px-4 py-3 text-sm text-text-secondary font-medium hidden md:table-cell">
                Status
              </th>
              <th className="text-left px-4 py-3 text-sm text-text-secondary font-medium hidden md:table-cell">
                Views
              </th>
              <th className="text-right px-4 py-3 text-sm text-text-secondary font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr
                key={post.id}
                className="border-b border-glass-border hover:bg-white/[0.02]"
              >
                <td className="px-4 py-3">
                  <p className="text-sm font-medium">{post.title}</p>
                  <p className="text-text-muted text-xs mt-0.5">
                    {formatDate(post.createdAt)}
                  </p>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-xs px-2 py-0.5 rounded bg-navy-light text-text-secondary">
                    {post.category || "—"}
                  </span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  {post.published ? (
                    <span className="flex items-center gap-1 text-xs text-green-400">
                      <Eye className="w-3 h-3" />
                      Published
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-text-muted">
                      <EyeOff className="w-3 h-3" />
                      Draft
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-text-secondary hidden md:table-cell">
                  {post.views}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={async () => {
                        setEditingPost(post);
                        setShowEditor(true);
                        try {
                          const res = await fetch(`/api/blog/${post.slug}`);
                          if (res.ok) {
                            const data = await res.json();
                            const p = data.post;
                            setForm({
                              title: p.title || "",
                              titleFr: p.titleFr || "",
                              content: p.content || "",
                              contentFr: p.contentFr || "",
                              excerpt: p.excerpt || "",
                              excerptFr: p.excerptFr || "",
                              coverImage: p.coverImage || "",
                              category: p.category || "",
                              tags: (p.tags || []).join(", "),
                              published: p.published || false,
                            });
                          }
                        } catch { /* ignore */ }
                      }}
                      className="p-1.5 text-text-secondary hover:text-gold transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deletePost(post.id)}
                      className="p-1.5 text-text-secondary hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {posts.length === 0 && (
          <p className="text-center py-8 text-text-secondary text-sm">
            No blog posts yet.
          </p>
        )}
      </div>
    </div>
  );
}
