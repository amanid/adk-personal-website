"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { Github, Linkedin, Twitter, Mail, MapPin, ArrowUp, Phone } from "lucide-react";

const socialLinks = [
  { icon: Linkedin, href: "https://www.linkedin.com/in/amanidieudonnekonan", label: "LinkedIn" },
  { icon: Github, href: "https://github.com/amani-konan", label: "GitHub" },
  { icon: Twitter, href: "https://twitter.com/amani_konan", label: "Twitter" },
  { icon: Mail, href: "mailto:amanidieudonnekonan@gmail.com", label: "Email" },
];

const quickLinks = [
  { key: "about", href: "/about" },
  { key: "services", href: "/services" },
  { key: "projects", href: "/projects" },
  { key: "publications", href: "/publications" },
  { key: "blog", href: "/blog" },
  { key: "contact", href: "/contact" },
];

export default function Footer() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="border-t border-glass-border bg-navy/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold font-[family-name:var(--font-display)] gradient-text mb-3">
              KONAN Amani Dieudonné
            </h3>
            <p className="text-text-secondary text-sm leading-relaxed mb-4">
              {t("description")}
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-text-muted text-sm">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>Abidjan, Côte d&apos;Ivoire</span>
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
            <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
              {t("quick_links")}
            </h4>
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
            <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
              {t("connect")}
            </h4>
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
          <button
            onClick={scrollToTop}
            className="w-8 h-8 rounded-lg glass flex items-center justify-center text-text-secondary hover:text-gold transition-colors"
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </footer>
  );
}
