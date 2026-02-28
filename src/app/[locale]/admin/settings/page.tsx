"use client";

import { useState, useEffect } from "react";
import { Save, Settings, Image, Type } from "lucide-react";
import FileUpload from "@/components/admin/FileUpload";

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
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
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
      setSettings({ ...defaultSettings, ...data.settings });
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
        body: JSON.stringify(settings),
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
