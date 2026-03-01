"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Brain, Database, BarChart3, Cloud, Code2 } from "lucide-react";

const techDomains = [
  {
    key: "ai_ml",
    icon: Brain,
    techs: ["Python", "PyTorch", "TensorFlow", "LangChain", "LLMs", "RAG", "NLP", "Computer Vision", "MLOps", "Generative AI"],
  },
  {
    key: "data_engineering",
    icon: Database,
    techs: ["Databricks", "Apache Spark", "Delta Lake", "SQL", "PostgreSQL", "Oracle", "ETL/ELT", "CDC Streaming", "Power BI", "Tableau"],
  },
  {
    key: "statistics",
    icon: BarChart3,
    techs: ["R", "Stata", "SAS", "SPSS", "Econometrics", "Time Series", "Causal Inference", "Survey Design", "Panel Data", "ARIMA/VAR"],
  },
  {
    key: "cloud",
    icon: Cloud,
    techs: ["Azure", "AWS", "Docker", "Kubernetes", "CI/CD", "DevOps", "REST APIs", "GraphQL", "Git", "Terraform"],
  },
  {
    key: "fullstack",
    icon: Code2,
    techs: ["Next.js", "React", "TypeScript", "Node.js", "Python Flask", "Prisma", "Tailwind CSS", "PostgreSQL", "MongoDB", "Redis"],
  },
];

export default function TechStackSection() {
  const t = useTranslations("techStack");

  return (
    <section className="section-padding bg-navy/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-display)] gradient-text mb-4">
            {t("title")}
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </motion.div>

        <div className="space-y-8">
          {techDomains.map((domain, domainIndex) => (
            <motion.div
              key={domain.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: domainIndex * 0.1 }}
              className="glass rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                  <domain.icon className="w-5 h-5 text-gold" />
                </div>
                <h3 className="text-lg font-semibold">{t(`domain_${domain.key}`)}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {domain.techs.map((tech, techIndex) => (
                  <motion.span
                    key={tech}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: domainIndex * 0.05 + techIndex * 0.03 }}
                    className="px-3 py-1.5 rounded-full glass text-sm font-medium text-gold border border-gold/20 hover:border-gold/40 hover:bg-gold/5 transition-all duration-300"
                  >
                    {tech}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
