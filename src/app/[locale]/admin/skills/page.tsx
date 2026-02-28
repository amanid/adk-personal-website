"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Award,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Skill {
  id: string;
  name: string;
  level: number;
  categoryId: string;
}

interface SkillCategory {
  id: string;
  name: string;
  nameFr: string | null;
  sortOrder: number;
  skills: Skill[];
}

interface Education {
  id: string;
  degree: string;
  degreeFr: string | null;
  institution: string;
  year: string;
  location: string;
  sortOrder: number;
}

interface Certification {
  id: string;
  name: string;
  issuer: string;
  year: string;
  sortOrder: number;
}

type Tab = "skills" | "education" | "certifications";

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminSkillsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("skills");

  // Skills state
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SkillCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: "", nameFr: "", sortOrder: 0 });
  const [showSkillForm, setShowSkillForm] = useState<string | null>(null);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [skillForm, setSkillForm] = useState({ name: "", level: 50 });

  // Education state
  const [education, setEducation] = useState<Education[]>([]);
  const [educationLoading, setEducationLoading] = useState(true);
  const [showEducationForm, setShowEducationForm] = useState(false);
  const [editingEducation, setEditingEducation] = useState<Education | null>(null);
  const [educationForm, setEducationForm] = useState({
    degree: "",
    degreeFr: "",
    institution: "",
    year: "",
    location: "",
    sortOrder: 0,
  });

  // Certifications state
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [certificationsLoading, setCertificationsLoading] = useState(true);
  const [showCertificationForm, setShowCertificationForm] = useState(false);
  const [editingCertification, setEditingCertification] = useState<Certification | null>(null);
  const [certificationForm, setCertificationForm] = useState({
    name: "",
    issuer: "",
    year: "",
    sortOrder: 0,
  });

  // ─── Data Fetching ──────────────────────────────────────────────────────────

  useEffect(() => {
    fetchSkills();
    fetchEducation();
    fetchCertifications();
  }, []);

  const fetchSkills = () => {
    setSkillsLoading(true);
    fetch("/api/admin/skills")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data.categories || []);
        setSkillsLoading(false);
      })
      .catch(() => setSkillsLoading(false));
  };

  const fetchEducation = () => {
    setEducationLoading(true);
    fetch("/api/admin/education")
      .then((res) => res.json())
      .then((data) => {
        setEducation(data.education || []);
        setEducationLoading(false);
      })
      .catch(() => setEducationLoading(false));
  };

  const fetchCertifications = () => {
    setCertificationsLoading(true);
    fetch("/api/admin/certifications")
      .then((res) => res.json())
      .then((data) => {
        setCertifications(data.certifications || []);
        setCertificationsLoading(false);
      })
      .catch(() => setCertificationsLoading(false));
  };

  // ─── Skill Category Handlers ────────────────────────────────────────────────

  const resetCategoryForm = () => {
    setCategoryForm({ name: "", nameFr: "", sortOrder: 0 });
    setShowCategoryForm(false);
    setEditingCategory(null);
  };

  const handleEditCategory = (cat: SkillCategory) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name,
      nameFr: cat.nameFr || "",
      sortOrder: cat.sortOrder,
    });
    setShowCategoryForm(true);
  };

  const handleSaveCategory = async () => {
    const payload = {
      name: categoryForm.name,
      nameFr: categoryForm.nameFr || undefined,
      sortOrder: categoryForm.sortOrder,
    };

    try {
      if (editingCategory) {
        const res = await fetch(`/api/admin/skills/${editingCategory.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          setCategories((prev) =>
            prev.map((c) =>
              c.id === editingCategory.id ? { ...c, ...data.category } : c
            )
          );
        }
      } else {
        const res = await fetch("/api/admin/skills", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          setCategories((prev) => [...prev, { ...data.category, skills: [] }]);
        }
      }
    } catch {
      // Handle error
    }

    resetCategoryForm();
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Delete this category and all its skills?")) return;
    try {
      const res = await fetch(`/api/admin/skills/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
      }
    } catch {
      // Handle error
    }
  };

  // ─── Individual Skill Handlers ──────────────────────────────────────────────

  const resetSkillForm = () => {
    setSkillForm({ name: "", level: 50 });
    setShowSkillForm(null);
    setEditingSkill(null);
  };

  const handleEditSkill = (skill: Skill) => {
    setEditingSkill(skill);
    setSkillForm({ name: skill.name, level: skill.level });
    setShowSkillForm(skill.categoryId);
  };

  const handleSaveSkill = async (categoryId: string) => {
    try {
      if (editingSkill) {
        const res = await fetch(`/api/admin/skills/skill/${editingSkill.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(skillForm),
        });
        if (res.ok) {
          const data = await res.json();
          setCategories((prev) =>
            prev.map((c) =>
              c.id === categoryId
                ? {
                    ...c,
                    skills: c.skills.map((s) =>
                      s.id === editingSkill.id ? { ...s, ...data.skill } : s
                    ),
                  }
                : c
            )
          );
        }
      } else {
        const res = await fetch(`/api/admin/skills/${categoryId}/skills`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(skillForm),
        });
        if (res.ok) {
          const data = await res.json();
          setCategories((prev) =>
            prev.map((c) =>
              c.id === categoryId
                ? { ...c, skills: [...c.skills, data.skill] }
                : c
            )
          );
        }
      }
    } catch {
      // Handle error
    }

    resetSkillForm();
  };

  const handleDeleteSkill = async (skillId: string, categoryId: string) => {
    if (!confirm("Delete this skill?")) return;
    try {
      const res = await fetch(`/api/admin/skills/skill/${skillId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCategories((prev) =>
          prev.map((c) =>
            c.id === categoryId
              ? { ...c, skills: c.skills.filter((s) => s.id !== skillId) }
              : c
          )
        );
      }
    } catch {
      // Handle error
    }
  };

  // ─── Education Handlers ─────────────────────────────────────────────────────

  const resetEducationForm = () => {
    setEducationForm({
      degree: "",
      degreeFr: "",
      institution: "",
      year: "",
      location: "",
      sortOrder: 0,
    });
    setShowEducationForm(false);
    setEditingEducation(null);
  };

  const handleEditEducation = (edu: Education) => {
    setEditingEducation(edu);
    setEducationForm({
      degree: edu.degree,
      degreeFr: edu.degreeFr || "",
      institution: edu.institution,
      year: edu.year,
      location: edu.location,
      sortOrder: edu.sortOrder,
    });
    setShowEducationForm(true);
  };

  const handleSaveEducation = async () => {
    const payload = {
      degree: educationForm.degree,
      degreeFr: educationForm.degreeFr || undefined,
      institution: educationForm.institution,
      year: educationForm.year,
      location: educationForm.location,
      sortOrder: educationForm.sortOrder,
    };

    try {
      if (editingEducation) {
        const res = await fetch(`/api/admin/education/${editingEducation.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          setEducation((prev) =>
            prev.map((e) =>
              e.id === editingEducation.id ? { ...e, ...data.education } : e
            )
          );
        }
      } else {
        const res = await fetch("/api/admin/education", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          setEducation((prev) => [...prev, data.education]);
        }
      }
    } catch {
      // Handle error
    }

    resetEducationForm();
  };

  const handleDeleteEducation = async (id: string) => {
    if (!confirm("Delete this education entry?")) return;
    try {
      const res = await fetch(`/api/admin/education/${id}`, { method: "DELETE" });
      if (res.ok) {
        setEducation((prev) => prev.filter((e) => e.id !== id));
      }
    } catch {
      // Handle error
    }
  };

  // ─── Certification Handlers ─────────────────────────────────────────────────

  const resetCertificationForm = () => {
    setCertificationForm({ name: "", issuer: "", year: "", sortOrder: 0 });
    setShowCertificationForm(false);
    setEditingCertification(null);
  };

  const handleEditCertification = (cert: Certification) => {
    setEditingCertification(cert);
    setCertificationForm({
      name: cert.name,
      issuer: cert.issuer,
      year: cert.year,
      sortOrder: cert.sortOrder,
    });
    setShowCertificationForm(true);
  };

  const handleSaveCertification = async () => {
    const payload = {
      name: certificationForm.name,
      issuer: certificationForm.issuer,
      year: certificationForm.year,
      sortOrder: certificationForm.sortOrder,
    };

    try {
      if (editingCertification) {
        const res = await fetch(
          `/api/admin/certifications/${editingCertification.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        if (res.ok) {
          const data = await res.json();
          setCertifications((prev) =>
            prev.map((c) =>
              c.id === editingCertification.id
                ? { ...c, ...data.certification }
                : c
            )
          );
        }
      } else {
        const res = await fetch("/api/admin/certifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          setCertifications((prev) => [...prev, data.certification]);
        }
      }
    } catch {
      // Handle error
    }

    resetCertificationForm();
  };

  const handleDeleteCertification = async (id: string) => {
    if (!confirm("Delete this certification?")) return;
    try {
      const res = await fetch(`/api/admin/certifications/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCertifications((prev) => prev.filter((c) => c.id !== id));
      }
    } catch {
      // Handle error
    }
  };

  // ─── Tab Config ─────────────────────────────────────────────────────────────

  const tabs: { key: Tab; label: string }[] = [
    { key: "skills", label: "Skills" },
    { key: "education", label: "Education" },
    { key: "certifications", label: "Certifications" },
  ];

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] gradient-text mb-8">
        Skills, Education &amp; Certifications
      </h1>

      {/* Tab Navigation */}
      <div className="flex border-b border-glass-border mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={
              activeTab === tab.key
                ? "px-4 py-2 text-sm font-medium border-b-2 border-gold text-gold"
                : "px-4 py-2 text-sm font-medium text-text-secondary hover:text-gold border-b-2 border-transparent"
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Skills Tab ──────────────────────────────────────────────────────── */}
      {activeTab === "skills" && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <span className="text-text-muted text-sm">
              {categories.length} categories
            </span>
            <button
              onClick={() => {
                resetCategoryForm();
                setShowCategoryForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gold text-charcoal font-medium rounded-lg hover:bg-gold-light transition-all text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Category
            </button>
          </div>

          {/* Category Form */}
          {showCategoryForm && (
            <div className="glass rounded-xl p-5 mb-6">
              <h3 className="text-sm font-medium mb-4">
                {editingCategory ? "Edit Category" : "New Category"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-text-secondary mb-1">
                    Name (EN)
                  </label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, name: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none"
                    placeholder="e.g. Programming Languages"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">
                    Name (FR)
                  </label>
                  <input
                    type="text"
                    value={categoryForm.nameFr}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, nameFr: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none"
                    placeholder="e.g. Langages de programmation"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={categoryForm.sortOrder}
                    onChange={(e) =>
                      setCategoryForm({
                        ...categoryForm,
                        sortOrder: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSaveCategory}
                  className="px-6 py-2 bg-gold text-charcoal font-medium rounded-lg hover:bg-gold-light transition-all text-sm"
                >
                  {editingCategory ? "Update" : "Create"}
                </button>
                <button
                  onClick={resetCategoryForm}
                  className="px-6 py-2 glass text-text-secondary rounded-lg hover:text-gold transition-all text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Categories List */}
          {skillsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="glass rounded-xl p-5 animate-pulse h-20"
                />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-text-secondary">No skill categories yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {categories.map((cat) => (
                <div key={cat.id} className="glass rounded-xl p-5">
                  {/* Category Header */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() =>
                        setExpandedCategory(
                          expandedCategory === cat.id ? null : cat.id
                        )
                      }
                      className="flex items-center gap-3 flex-1 text-left"
                    >
                      {expandedCategory === cat.id ? (
                        <ChevronUp className="w-4 h-4 text-gold" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-text-muted" />
                      )}
                      <div>
                        <h3 className="text-sm font-medium">{cat.name}</h3>
                        <p className="text-xs text-text-muted">
                          {cat.nameFr && `${cat.nameFr} · `}
                          {cat.skills.length} skill
                          {cat.skills.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditCategory(cat)}
                        className="p-2 text-text-muted hover:text-gold transition-colors"
                        aria-label="Edit category"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-2 text-text-muted hover:text-red-400 transition-colors"
                        aria-label="Delete category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Skills */}
                  {expandedCategory === cat.id && (
                    <div className="mt-4 pt-4 border-t border-glass-border">
                      {cat.skills.length > 0 && (
                        <div className="space-y-3 mb-4">
                          {cat.skills.map((skill) => (
                            <div
                              key={skill.id}
                              className="flex items-center gap-4"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm">{skill.name}</span>
                                  <span className="text-xs text-text-muted">
                                    {skill.level}%
                                  </span>
                                </div>
                                <div className="h-2 bg-navy-light rounded-full">
                                  <div
                                    className="h-2 bg-gold rounded-full"
                                    style={{ width: `${skill.level}%` }}
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => handleEditSkill(skill)}
                                  className="p-1.5 text-text-muted hover:text-gold transition-colors"
                                  aria-label="Edit skill"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteSkill(skill.id, cat.id)
                                  }
                                  className="p-1.5 text-text-muted hover:text-red-400 transition-colors"
                                  aria-label="Delete skill"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Skill Form */}
                      {showSkillForm === cat.id ? (
                        <div className="glass rounded-lg p-4">
                          <h4 className="text-xs font-medium mb-3">
                            {editingSkill ? "Edit Skill" : "Add Skill"}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm text-text-secondary mb-1">
                                Skill Name
                              </label>
                              <input
                                type="text"
                                value={skillForm.name}
                                onChange={(e) =>
                                  setSkillForm({
                                    ...skillForm,
                                    name: e.target.value,
                                  })
                                }
                                className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none"
                                placeholder="e.g. Python"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-text-secondary mb-1">
                                Level ({skillForm.level}%)
                              </label>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={skillForm.level}
                                onChange={(e) =>
                                  setSkillForm({
                                    ...skillForm,
                                    level: parseInt(e.target.value),
                                  })
                                }
                                className="w-full mt-2"
                              />
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleSaveSkill(cat.id)}
                              className="px-6 py-2 bg-gold text-charcoal font-medium rounded-lg hover:bg-gold-light transition-all text-sm"
                            >
                              {editingSkill ? "Update" : "Add"}
                            </button>
                            <button
                              onClick={resetSkillForm}
                              className="px-6 py-2 glass text-text-secondary rounded-lg hover:text-gold transition-all text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            resetSkillForm();
                            setShowSkillForm(cat.id);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-gold text-charcoal font-medium rounded-lg hover:bg-gold-light transition-all text-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Skill
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Education Tab ───────────────────────────────────────────────────── */}
      {activeTab === "education" && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <span className="text-text-muted text-sm">
              {education.length} entries
            </span>
            <button
              onClick={() => {
                resetEducationForm();
                setShowEducationForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gold text-charcoal font-medium rounded-lg hover:bg-gold-light transition-all text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Education
            </button>
          </div>

          {/* Education Form */}
          {showEducationForm && (
            <div className="glass rounded-xl p-5 mb-6">
              <h3 className="text-sm font-medium mb-4">
                {editingEducation ? "Edit Education" : "New Education"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-text-secondary mb-1">
                    Degree (EN)
                  </label>
                  <input
                    type="text"
                    value={educationForm.degree}
                    onChange={(e) =>
                      setEducationForm({
                        ...educationForm,
                        degree: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none"
                    placeholder="e.g. Master of Science"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">
                    Degree (FR)
                  </label>
                  <input
                    type="text"
                    value={educationForm.degreeFr}
                    onChange={(e) =>
                      setEducationForm({
                        ...educationForm,
                        degreeFr: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none"
                    placeholder="e.g. Master en sciences"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">
                    Institution
                  </label>
                  <input
                    type="text"
                    value={educationForm.institution}
                    onChange={(e) =>
                      setEducationForm({
                        ...educationForm,
                        institution: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none"
                    placeholder="e.g. MIT"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">
                    Year
                  </label>
                  <input
                    type="text"
                    value={educationForm.year}
                    onChange={(e) =>
                      setEducationForm({
                        ...educationForm,
                        year: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none"
                    placeholder="e.g. 2024"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={educationForm.location}
                    onChange={(e) =>
                      setEducationForm({
                        ...educationForm,
                        location: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none"
                    placeholder="e.g. Cambridge, MA, USA"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={educationForm.sortOrder}
                    onChange={(e) =>
                      setEducationForm({
                        ...educationForm,
                        sortOrder: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSaveEducation}
                  className="px-6 py-2 bg-gold text-charcoal font-medium rounded-lg hover:bg-gold-light transition-all text-sm"
                >
                  {editingEducation ? "Update" : "Create"}
                </button>
                <button
                  onClick={resetEducationForm}
                  className="px-6 py-2 glass text-text-secondary rounded-lg hover:text-gold transition-all text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Education List */}
          {educationLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="glass rounded-xl p-5 animate-pulse h-20"
                />
              ))}
            </div>
          ) : education.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-secondary">No education entries yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {education.map((edu) => (
                <div
                  key={edu.id}
                  className="glass rounded-xl p-5 flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium truncate">
                      {edu.degree}
                    </h3>
                    <div className="flex items-center gap-3 text-text-muted text-xs mt-1">
                      <span>{edu.institution}</span>
                      <span>{edu.year}</span>
                      <span>{edu.location}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleEditEducation(edu)}
                      className="p-2 text-text-muted hover:text-gold transition-colors"
                      aria-label="Edit education"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteEducation(edu.id)}
                      className="p-2 text-text-muted hover:text-red-400 transition-colors"
                      aria-label="Delete education"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Certifications Tab ──────────────────────────────────────────────── */}
      {activeTab === "certifications" && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <span className="text-text-muted text-sm">
              {certifications.length} certifications
            </span>
            <button
              onClick={() => {
                resetCertificationForm();
                setShowCertificationForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gold text-charcoal font-medium rounded-lg hover:bg-gold-light transition-all text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Certification
            </button>
          </div>

          {/* Certification Form */}
          {showCertificationForm && (
            <div className="glass rounded-xl p-5 mb-6">
              <h3 className="text-sm font-medium mb-4">
                {editingCertification
                  ? "Edit Certification"
                  : "New Certification"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-text-secondary mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={certificationForm.name}
                    onChange={(e) =>
                      setCertificationForm({
                        ...certificationForm,
                        name: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none"
                    placeholder="e.g. Data Science Professional"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">
                    Issuer
                  </label>
                  <input
                    type="text"
                    value={certificationForm.issuer}
                    onChange={(e) =>
                      setCertificationForm({
                        ...certificationForm,
                        issuer: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none"
                    placeholder="e.g. MIT"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">
                    Year
                  </label>
                  <input
                    type="text"
                    value={certificationForm.year}
                    onChange={(e) =>
                      setCertificationForm({
                        ...certificationForm,
                        year: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none"
                    placeholder="e.g. 2024"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={certificationForm.sortOrder}
                    onChange={(e) =>
                      setCertificationForm({
                        ...certificationForm,
                        sortOrder: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSaveCertification}
                  className="px-6 py-2 bg-gold text-charcoal font-medium rounded-lg hover:bg-gold-light transition-all text-sm"
                >
                  {editingCertification ? "Update" : "Create"}
                </button>
                <button
                  onClick={resetCertificationForm}
                  className="px-6 py-2 glass text-text-secondary rounded-lg hover:text-gold transition-all text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Certifications List */}
          {certificationsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="glass rounded-xl p-5 animate-pulse h-20"
                />
              ))}
            </div>
          ) : certifications.length === 0 ? (
            <div className="text-center py-12">
              <Award className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-secondary">No certifications yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {certifications.map((cert) => (
                <div
                  key={cert.id}
                  className="glass rounded-xl p-5 flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium truncate">
                      {cert.name}
                    </h3>
                    <div className="flex items-center gap-3 text-text-muted text-xs mt-1">
                      <span>{cert.issuer}</span>
                      <span>{cert.year}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleEditCertification(cert)}
                      className="p-2 text-text-muted hover:text-gold transition-colors"
                      aria-label="Edit certification"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCertification(cert.id)}
                      className="p-2 text-text-muted hover:text-red-400 transition-colors"
                      aria-label="Delete certification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
