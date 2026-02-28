"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { formatDate } from "@/lib/utils";

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
  const [form, setForm] = useState({
    title: "",
    titleFr: "",
    content: "",
    contentFr: "",
    excerpt: "",
    excerptFr: "",
    category: "",
    tags: "",
    published: false,
  });

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
      setShowEditor(false);
      setEditingPost(null);
      setForm({
        title: "",
        titleFr: "",
        content: "",
        contentFr: "",
        excerpt: "",
        excerptFr: "",
        category: "",
        tags: "",
        published: false,
      });
      fetchPosts();
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

            <div>
              <label className="block text-sm text-text-secondary mb-1">
                Content (EN) *
              </label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={10}
                className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none font-mono text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-1">
                Content (FR)
              </label>
              <textarea
                value={form.contentFr}
                onChange={(e) => setForm({ ...form, contentFr: e.target.value })}
                rows={10}
                className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none font-mono text-sm"
              />
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

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-gold text-charcoal font-medium rounded-lg hover:bg-gold-light transition-all text-sm"
              >
                {editingPost ? "Update" : "Create"} Post
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEditor(false);
                  setEditingPost(null);
                }}
                className="px-6 py-2 glass text-text-secondary rounded-lg hover:text-gold transition-all text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
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
                      onClick={() => {
                        setEditingPost(post);
                        setShowEditor(true);
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
