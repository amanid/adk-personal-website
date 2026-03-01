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
    default: "KONAN Amani Dieudonné | Full-Stack Senior Statistician, Data, ML & AI Professional",
    template: "%s | KONAN Amani Dieudonné",
  },
  description:
    "Full-Stack Senior Statistician, Data Scientist, Machine Learning & AI Professional with 13+ years of international experience. Expert in Statistics, Econometrics, Data Science, AI/ML Engineering, Data Architecture, Full-Stack Development, and Strategic Consulting across the UN system, development finance, and international organizations.",
  keywords: [
    "Full-Stack Statistician",
    "Senior Data Scientist",
    "AI Engineer",
    "Machine Learning Professional",
    "Statistician",
    "Econometrician",
    "Data Architect",
    "Full-Stack Developer",
    "MLOps Engineer",
    "Data Engineering",
    "Predictive Analytics",
    "Deep Learning",
    "NLP",
    "LLM",
    "RAG Systems",
    "Statistical Modeling",
    "Econometric Analysis",
    "KONAN Amani Dieudonné",
  ],
  authors: [{ name: "KONAN Amani Dieudonné" }],
  icons: {
    icon: "/images/profile.jpg",
    apple: "/images/profile.jpg",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.konanamanidieudonne.org",
    siteName: "KONAN Amani Dieudonné",
    title: "KONAN Amani Dieudonné | Full-Stack Senior Statistician, Data, ML & AI Professional",
    description:
      "Full-Stack Senior Statistician, Data Scientist, ML & AI Professional with 13+ years of international experience across the UN system, development finance, and global organizations.",
    images: [
      {
        url: "/images/profile.jpg",
        width: 800,
        height: 800,
        alt: "KONAN Amani Dieudonné - Full-Stack Senior Statistician, Data, ML & AI Professional",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "KONAN Amani Dieudonné | Full-Stack Senior Statistician, Data, ML & AI Professional",
    description:
      "Full-Stack Senior Statistician, Data Scientist, ML & AI Professional with 13+ years of international experience.",
    images: ["/images/profile.jpg"],
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
    image: "https://www.konanamanidieudonne.org/images/profile.jpg",
    jobTitle: "Full-Stack Senior Statistician, Data, ML & AI Professional",
    worksFor: {
      "@type": "Organization",
      name: "African Export-Import Bank (Afreximbank)",
    },
    alumniOf: [
      {
        "@type": "EducationalOrganization",
        name: "ENSEA Abidjan",
      },
      {
        "@type": "EducationalOrganization",
        name: "Université Toulouse I Capitole",
      },
      {
        "@type": "EducationalOrganization",
        name: "Massachusetts Institute of Technology (MIT)",
      },
    ],
    sameAs: [
      "https://www.linkedin.com/in/amanidieudonnekonan",
      "https://github.com/amani-konan",
    ],
    knowsAbout: [
      "Statistics & Econometrics",
      "Data Science & Analytics",
      "Artificial Intelligence",
      "Machine Learning & Deep Learning",
      "Natural Language Processing",
      "Large Language Models (LLMs)",
      "Data Engineering & Architecture",
      "Full-Stack Web Development",
      "MLOps & AI Engineering",
      "Strategic Data Consulting",
      "Predictive Analytics",
      "Causal Inference & Impact Evaluation",
    ],
    hasCredential: [
      {
        "@type": "EducationalOccupationalCredential",
        name: "Professional Certificate in Data Engineering",
        credentialCategory: "Professional Certificate",
        recognizedBy: { "@type": "Organization", name: "MIT" },
      },
      {
        "@type": "EducationalOccupationalCredential",
        name: "Professional Certificate in AI & Data Science",
        credentialCategory: "Professional Certificate",
        recognizedBy: { "@type": "Organization", name: "MIT" },
      },
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
