import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import Providers from "@/components/Providers";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageViewTracker from "@/components/PageViewTracker";
import "../globals.css";

export const metadata = {
  title: {
    default: "KONAN Amani Dieudonné | Data Scientist, AI Engineer & Statistician-Econometrician",
    template: "%s | KONAN Amani Dieudonné",
  },
  description:
    "Senior Data Scientist, Principal AI Engineer & Statistician-Econometrician with 13+ years of international experience. Specializing in AI/ML, Statistics, Econometrics, Data Architecture, and Strategic Consulting.",
  keywords: [
    "Data Scientist",
    "AI Engineer",
    "Statistician",
    "Econometrician",
    "Machine Learning",
    "Data Architecture",
    "Econometrics",
    "Statistical Analysis",
    "Consulting",
    "KONAN Amani",
  ],
  authors: [{ name: "KONAN Amani Dieudonné" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.konanamanidieudonne.org",
    siteName: "KONAN Amani Dieudonné",
    title: "KONAN Amani Dieudonné | Data Scientist, AI Engineer & Statistician-Econometrician",
    description:
      "Senior Data Scientist, Principal AI Engineer & Statistician-Econometrician with 13+ years of international experience.",
  },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = (await import(`../../../messages/${locale}.json`)).default;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "KONAN Amani Dieudonné",
    url: "https://www.konanamanidieudonne.org",
    jobTitle: "Senior Data Scientist, AI Engineer & Statistician-Econometrician",
    worksFor: {
      "@type": "Organization",
      name: "African Export-Import Bank (Afreximbank)",
    },
    sameAs: [
      "https://www.linkedin.com/in/amanidieudonnekonan",
      "https://github.com/amani-konan",
    ],
    knowsAbout: [
      "Data Science",
      "Artificial Intelligence",
      "Machine Learning",
      "Statistics",
      "Econometrics",
      "Data Engineering",
    ],
    email: "amanidieudonnekonan@gmail.com",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Abidjan",
      addressCountry: "CI",
    },
  };

  return (
    <html lang={locale} className="dark" data-theme="midnight-gold">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-charcoal text-text-primary antialiased">
        <Providers>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <Navbar />
            <main className="flex-1 pt-16">{children}</main>
            <Footer />
            <PageViewTracker />
          </NextIntlClientProvider>
        </Providers>
      </body>
    </html>
  );
}
