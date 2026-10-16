"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Github, Linkedin, Mail, MapPin, Phone } from "lucide-react";
import NewsletterSignup from "@/components/NewsletterSignup";

const socialLinks = [
  { icon: Linkedin, href: "https://www.linkedin.com/in/amanidieudonnekonan", label: "LinkedIn" },
  { icon: Github, href: "https://github.com/amanid", label: "GitHub" },
  { icon: Mail, href: "mailto:amanidieudonnekonan@gmail.com", label: "Email" },
];

const quickLinks = [
  { key: "about", href: "/about" },
  { key: "services", href: "/services" },
  { key: "projects", href: "/projects" },
  { key: "publications", href: "/publications" },
  { key: "topics", href: "/topics" },
  { key: "blog", href: "/blog" },
  { key: "developers", href: "/developers" },
  { key: "contact", href: "/contact" },
];

export default function Footer() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");


  return (
    <footer className="border-t border-glass-border bg-navy/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <p className="font-display text-2xl mb-3">
              KONAN Amani Dieudonné
            </p>
            <p className="text-text-secondary text-sm leading-relaxed mb-4">
              {t("description")}
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-text-muted text-sm">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>{t("location")}</span>
              </div>
              <div className="flex items-center gap-2 text-text-muted text-sm">
                <Mail className="w-4 h-4 shrink-0" />
                <a href="mailto:amanidieudonnekonan@gmail.com" className="hover:text-gold transition-colors">
                  amanidieudonnekonan@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-2 text-text-muted text-sm">
                <Mail className="w-4 h-4 shrink-0" />
                <a href="mailto:amani_dieudonne@yahoo.fr" className="hover:text-gold transition-colors">
                  amani_dieudonne@yahoo.fr
                </a>
              </div>
              <div className="flex items-center gap-2 text-text-muted text-sm">
                <Phone className="w-4 h-4 shrink-0" />
                <a href="tel:+2250747882235" className="hover:text-gold transition-colors">
                  (+225) 07 47 88 22 35
                </a>
              </div>
              <div className="flex items-center gap-2 text-text-muted text-sm">
                <Phone className="w-4 h-4 shrink-0" />
                <a href="tel:+2250506841919" className="hover:text-gold transition-colors">
                  (+225) 05 06 84 19 19
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h2 className="eyebrow text-text-muted mb-4">
              {t("quick_links")}
            </h2>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-secondary hover:text-gold transition-colors"
                  >
                    {tNav(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h2 className="eyebrow text-text-muted mb-4">
              {t("connect")}
            </h2>
            <NewsletterSignup />
            <div className="flex items-center gap-3 mb-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg glass flex items-center justify-center text-text-secondary hover:text-gold hover:border-gold/30 transition-all"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-8 border-t border-glass-border flex items-center justify-between">
          <p className="text-text-muted text-xs">
            &copy; {new Date().getFullYear()} KONAN Amani Dieudonné. {t("rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
