"use client";

import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Link } from "@/i18n/routing";
import {
  MessageCircle,
  CheckCircle,
  Clock,
  Send,
  User,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { questionSchema, QuestionInput } from "@/lib/validations";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { formatDate } from "@/lib/utils";

interface QuestionData {
  id: string;
  title: string;
  content: string;
  isAnswered: boolean;
  createdAt: string;
  author: { name: string | null };
  answers: {
    id: string;
    content: string;
    createdAt: string;
    author: { name: string | null; role?: string };
  }[];
}

export default function QAPage() {
  const t = useTranslations("qa");
  const locale = useLocale();
  const { data: session } = useSession();
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QuestionInput>({
    resolver: zodResolver(questionSchema),
  });

  useEffect(() => {
    fetch("/api/qa")
      .then((res) => res.json())
      .then((data) => {
        setQuestions(data.questions || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const onSubmit = async (data: QuestionInput) => {
    try {
      const res = await fetch("/api/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const result = await res.json();
        setQuestions([result.question, ...questions]);
        setSubmitted(true);
        setShowForm(false);
        reset();
        setTimeout(() => setSubmitted(false), 5000);
      }
    } catch {
      // handle error
    }
  };

  return (
    <div className="section-padding">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold font-[family-name:var(--font-display)] gradient-text mb-4">
            {t("title")}
          </h1>
          <p className="text-text-secondary text-lg">{t("subtitle")}</p>
        </motion.div>

        {/* Ask Button */}
        <div className="flex justify-center mb-8">
          {session ? (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-6 py-2.5 bg-gold text-charcoal font-semibold rounded-lg hover:bg-gold-light transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              {t("ask")}
            </button>
          ) : (
            <Link
              href="/auth/login"
              className="flex items-center gap-2 px-6 py-2.5 glass text-gold rounded-lg hover:border-gold/30 transition-all"
            >
              {t("login_to_ask")}
            </Link>
          )}
        </div>

        {submitted && (
          <div className="mb-6 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm text-center">
            Question submitted successfully!
          </div>
        )}

        {/* Question Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="glass rounded-xl p-6 mb-8"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">
                  {t("question_title")} *
                </label>
                <input
                  {...register("title")}
                  className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none transition-colors"
                />
                {errors.title && (
                  <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">
                  {t("question_content")} *
                </label>
                <textarea
                  {...register("content")}
                  rows={4}
                  className="w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none transition-colors resize-none"
                />
                {errors.content && (
                  <p className="text-red-400 text-xs mt-1">{errors.content.message}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-gold text-charcoal font-semibold rounded-lg hover:bg-gold-light transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? "..." : t("submit")}
              </button>
            </form>
          </motion.div>
        )}

        {/* Questions List */}
        {loading ? (
          <div className="text-center py-12 text-text-secondary">Loading...</div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12 text-text-secondary">
            {t("no_questions")}
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q, index) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="glass rounded-xl overflow-hidden"
              >
                <div
                  className="p-5 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() =>
                    setExpandedId(expandedId === q.id ? null : q.id)
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {q.isAnswered ? (
                          <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                        ) : (
                          <Clock className="w-4 h-4 text-gold shrink-0" />
                        )}
                        <span
                          className={`text-xs ${
                            q.isAnswered ? "text-green-400" : "text-gold"
                          }`}
                        >
                          {q.isAnswered ? t("answered") : t("unanswered")}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold">{q.title}</h3>
                      <div className="flex items-center gap-3 mt-2 text-text-muted text-xs">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {q.author.name}
                        </span>
                        <span>{formatDate(q.createdAt, locale)}</span>
                      </div>
                    </div>
                    {expandedId === q.id ? (
                      <ChevronUp className="w-5 h-5 text-text-muted" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-text-muted" />
                    )}
                  </div>
                </div>

                {expandedId === q.id && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-t border-glass-border p-5"
                  >
                    <p className="text-text-secondary text-sm mb-4">{q.content}</p>
                    {q.answers.length > 0 && (
                      <div className="space-y-3">
                        {q.answers.map((a) => (
                          <div
                            key={a.id}
                            className="bg-navy/50 rounded-lg p-4 border-l-2 border-gold"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <User className="w-3 h-3 text-gold" />
                              <span className="text-sm font-medium text-gold">
                                {a.author.name}
                              </span>
                              <span className="text-text-muted text-xs">
                                {formatDate(a.createdAt, locale)}
                              </span>
                            </div>
                            <p className="text-text-secondary text-sm">{a.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
