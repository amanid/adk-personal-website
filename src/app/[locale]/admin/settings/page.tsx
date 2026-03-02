"use client";

import { useState, useEffect } from "react";
import { Save, Settings, Image, Type, LayoutGrid, FileDown } from "lucide-react";
import FileUpload from "@/components/admin/FileUpload";

interface SectionVisibility {
  marketTicker: boolean;
  whoIAm: boolean;
  stats: boolean;
  trustedBy: boolean;
  marketIntelligence: boolean;
  expertise: boolean;
  techStack: boolean;
  careerHighlights: boolean;
  publications: boolean;
  projects: boolean;
  services: boolean;
  globalReach: boolean;
  certifications: boolean;
  impact: boolean;
  cta: boolean;
  unResearch: boolean;
  cvDownload: boolean;
}

const defaultVisibility: SectionVisibility = {
  marketTicker: true,
  whoIAm: true,
  stats: true,
  trustedBy: true,
  marketIntelligence: true,
  expertise: true,
  techStack: true,
  careerHighlights: true,
  publications: true,
  projects: true,
  services: true,
  globalReach: true,
  certifications: true,
  impact: true,
  cta: true,
  unResearch: false,
  cvDownload: false,
};

const sectionLabels: Record<keyof SectionVisibility, { name: string; desc: string }> = {
  marketTicker: { name: "Market Ticker", desc: "Live commodity & stock ticker bar" },
  whoIAm: { name: "Who I Am", desc: "Personal story section" },
  stats: { name: "Statistics", desc: "Key metrics counter" },
  trustedBy: { name: "Trusted By", desc: "Organizations logos" },
  marketIntelligence: { name: "Market Intelligence", desc: "Live market data charts" },
  expertise: { name: "Expertise Areas", desc: "Core competency cards" },
  techStack: { name: "Technology Stack", desc: "Tech tools & frameworks" },
  careerHighlights: { name: "Career Highlights", desc: "Top experience entries" },
  publications: { name: "Publications", desc: "Featured research papers" },
  projects: { name: "Projects", desc: "Featured project showcase" },
  services: { name: "Services", desc: "Service offerings" },
  globalReach: { name: "Global Reach", desc: "World map & locations" },
  certifications: { name: "Certifications", desc: "Education & certificates" },
  impact: { name: "Impact & Achievements", desc: "Achievement metrics grid" },
  cta: { name: "Call to Action", desc: "Contact call-to-action" },
  unResearch: { name: "UN/International Research", desc: "UN advisory section (hidden by default)" },
  cvDownload: { name: "CV Download", desc: "CV download button in Hero (hidden by default)" },
};

interface SiteSettings {
  profilePhoto: string;
  heroGreeting: string;
  heroGreetingFr: string;
  heroDescription: string;
  heroDescriptionFr: string;
  aboutBio: string;
  aboutBioFr: string;
  whoIAmText: string;
  whoIAmTextFr: string;
  cvFileUrl: string;
}

const defaultSettings: SiteSettings = {
  profilePhoto: "",
  heroGreeting: "",
  heroGreetingFr: "",
  heroDescription: "",
  heroDescriptionFr: "",
  aboutBio: "",
  aboutBioFr: "",
  whoIAmText: "",
  whoIAmTextFr: "",
  cvFileUrl: "",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [visibility, setVisibility] = useState<SectionVisibility>(defaultVisibility);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      const data = await res.json();
      const { sectionVisibility, ...rest } = data.settings || {};
      setSettings({ ...defaultSettings, ...rest });
      if (sectionVisibility) {
        try {
          const parsed = typeof sectionVisibility === "string" ? JSON.parse(sectionVisibility) : sectionVisibility;
          setVisibility({ ...defaultVisibility, ...parsed });
        } catch {
          setVisibility(defaultVisibility);
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      setMessage({ type: "error", text: "Failed to load settings" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...settings,
          sectionVisibility: JSON.stringify(visibility),
        }),
      });

      if (!res.ok) throw new Error("Failed to save settings");

      setMessage({ type: "success", text: "Settings saved successfully" });
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({ type: "error", text: "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: keyof SiteSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSection = (key: keyof SectionVisibility) => {
    setVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="w-8 h-8 text-gold" />
          <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] gradient-text">
            Site Settings
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {message && (
            <span
              className={`text-sm ${
                message.type === "success" ? "text-green-400" : "text-red-400"
              }`}
            >
              {message.text}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-gold text-charcoal font-medium rounded-lg hover:bg-gold-light transition-all text-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save All Settings"}
          </button>
        </div>
      </div>

      {/* Profile Photo Section */}
      <section className="glass rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Image className="w-5 h-5 text-gold" />
          <h2 className="text-xl font-semibold">Profile Photo</h2>
        </div>
        <div className="flex items-start gap-6">
          {settings.profilePhoto && (
            <img
              src={settings.profilePhoto}
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover border-2 border-gold/30"
            />
          )}
          <div className="flex-1">
            <FileUpload
              accept="image/*"
              onUpload={(url) => setSettings({ ...settings, profilePhoto: url })}
              currentUrl={settings.profilePhoto}
              label="Profile Photo"
            />
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="glass rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Type className="w-5 h-5 text-gold" />
          <h2 className="text-xl font-semibold">Hero Section</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">
              Greeting (EN)
            </label>
            <input
              type="text"
              value={settings.heroGreeting}
              onChange={(e) => updateField("heroGreeting", e.target.value)}
              className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none"
              placeholder="e.g. Hello, I'm Amani"
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">
              Greeting (FR)
            </label>
            <input
              type="text"
              value={settings.heroGreetingFr}
              onChange={(e) => updateField("heroGreetingFr", e.target.value)}
              className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none"
              placeholder="e.g. Bonjour, je suis Amani"
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">
              Description (EN)
            </label>
            <textarea
              value={settings.heroDescription}
              onChange={(e) => updateField("heroDescription", e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none font-mono text-sm"
              placeholder="Hero description in English..."
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">
              Description (FR)
            </label>
            <textarea
              value={settings.heroDescriptionFr}
              onChange={(e) => updateField("heroDescriptionFr", e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none font-mono text-sm"
              placeholder="Description du hero en fran\u00e7ais..."
            />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="glass rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Type className="w-5 h-5 text-gold" />
          <h2 className="text-xl font-semibold">About Section</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">
              About Bio (EN)
            </label>
            <textarea
              value={settings.aboutBio}
              onChange={(e) => updateField("aboutBio", e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none font-mono text-sm"
              placeholder="About biography in English..."
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">
              About Bio (FR)
            </label>
            <textarea
              value={settings.aboutBioFr}
              onChange={(e) => updateField("aboutBioFr", e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none font-mono text-sm"
              placeholder="Biographie en fran\u00e7ais..."
            />
          </div>
        </div>
      </section>

      {/* Who I Am Section */}
      <section className="glass rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Type className="w-5 h-5 text-gold" />
          <h2 className="text-xl font-semibold">Who I Am Section</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">
              Who I Am Text (EN)
            </label>
            <textarea
              value={settings.whoIAmText}
              onChange={(e) => updateField("whoIAmText", e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none font-mono text-sm"
              placeholder="Who I Am text in English..."
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">
              Who I Am Text (FR)
            </label>
            <textarea
              value={settings.whoIAmTextFr}
              onChange={(e) => updateField("whoIAmTextFr", e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none font-mono text-sm"
              placeholder="Texte Qui suis-je en fran\u00e7ais..."
            />
          </div>
        </div>
      </section>

      {/* Homepage Sections Visibility */}
      <section className="glass rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <LayoutGrid className="w-5 h-5 text-gold" />
          <h2 className="text-xl font-semibold">Homepage Sections</h2>
        </div>
        <p className="text-text-secondary text-sm mb-4">
          Toggle which sections are visible on the public homepage.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(Object.keys(sectionLabels) as (keyof SectionVisibility)[]).map((key) => (
            <label
              key={key}
              className="flex items-center justify-between p-3 rounded-lg bg-navy/30 border border-glass-border hover:border-gold/20 transition-colors cursor-pointer"
            >
              <div>
                <p className="text-sm font-medium">{sectionLabels[key].name}</p>
                <p className="text-xs text-text-muted">{sectionLabels[key].desc}</p>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={visibility[key]}
                  onChange={() => toggleSection(key)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-navy-light rounded-full peer peer-checked:bg-gold/80 transition-colors" />
                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
              </div>
            </label>
          ))}
        </div>
      </section>

      {/* CV Document */}
      <section className="glass rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FileDown className="w-5 h-5 text-gold" />
          <h2 className="text-xl font-semibold">CV Document</h2>
        </div>
        <p className="text-text-secondary text-sm mb-4">
          Upload your CV file. When &quot;CV Download&quot; is enabled above, this file will be available on the homepage.
        </p>
        <FileUpload
          accept=".pdf,.doc,.docx"
          onUpload={(url) => updateField("cvFileUrl", url)}
          currentUrl={settings.cvFileUrl}
          label="CV File (PDF recommended)"
        />
        {settings.cvFileUrl && (
          <p className="text-xs text-text-muted mt-2">
            Current: <a href={settings.cvFileUrl} target="_blank" rel="noreferrer" className="text-gold hover:text-gold-light">{settings.cvFileUrl}</a>
          </p>
        )}
      </section>

      {/* Bottom Save Button */}
      <div className="flex items-center justify-end gap-3">
        {message && (
          <span
            className={`text-sm ${
              message.type === "success" ? "text-green-400" : "text-red-400"
            }`}
          >
            {message.text}
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-gold text-charcoal font-medium rounded-lg hover:bg-gold-light transition-all text-sm disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save All Settings"}
        </button>
      </div>
    </div>
  );
}
