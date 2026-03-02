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
  Search,
  ThumbsUp,
  ThumbsDown,
  Award,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { questionSchema, QuestionInput } from "@/lib/validations";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { formatDate } from "@/lib/utils";

interface QuestionData {
  id: string;
  title: string;
  content: string;
  isAnswered: boolean;
  votes: number;
  createdAt: string;
  author: { name: string | null };
  answers: {
    id: string;
    content: string;
    votes: number;
    isBestAnswer: boolean;
    createdAt: string;
    author: { name: string | null; role?: string };
  }[];
  _count?: { answers: number };
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
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<"recent" | "popular" | "unanswered">("recent");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QuestionInput>({
    resolver: zodResolver(questionSchema),
  });

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        sort,
        page: page.toString(),
        limit: "15",
      });
      if (searchQuery) params.set("q", searchQuery);
      const res = await fetch(`/api/qa?${params}`);
      const data = await res.json();
      setQuestions(data.questions || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      // handle silently
    } finally {
      setLoading(false);
    }
  }, [sort, page, searchQuery]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Debounced search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const onSubmit = async (data: QuestionInput) => {
    try {
      const res = await fetch("/api/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setSubmitted(true);
        setShowForm(false);
        reset();
        fetchQuestions();
        setTimeout(() => setSubmitted(false), 5000);
      }
    } catch {
      // handle error
    }
  };

  const voteQuestion = async (questionId: string, value: number) => {
    if (!session) return;
    try {
      const res = await fetch(`/api/qa/${questionId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      if (res.ok) {
        const data = await res.json();
        setQuestions(
          questions.map((q) =>
            q.id === questionId ? { ...q, votes: data.votes } : q
          )
        );
      }
    } catch {
      // handle silently
    }
  };

  const voteAnswer = async (questionId: string, answerId: string, value: number) => {
    if (!session) return;
    try {
      const res = await fetch(`/api/qa/${questionId}/answer/${answerId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      if (res.ok) {
        const data = await res.json();
        setQuestions(
          questions.map((q) =>
            q.id === questionId
              ? {
                  ...q,
                  answers: q.answers.map((a) =>
                    a.id === answerId ? { ...a, votes: data.votes } : a
                  ),
                }
              : q
          )
        );
      }
    } catch {
      // handle silently
    }
  };

  const sortTabs = [
    { key: "recent" as const, label: t("sort_recent") || "Recent" },
    { key: "popular" as const, label: t("sort_popular") || "Popular" },
    { key: "unanswered" as const, label: t("sort_unanswered") || "Unanswered" },
  ];

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

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("search") || "Search questions..."}
            className="w-full pl-10 pr-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none transition-colors"
          />
        </div>

        {/* Sort Tabs + Ask Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex gap-2">
            {sortTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setSort(tab.key); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  sort === tab.key
                    ? "bg-gold text-charcoal font-medium"
                    : "glass text-text-secondary hover:text-gold"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {session ? (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-5 py-2 bg-gold text-charcoal font-semibold rounded-lg hover:bg-gold-light transition-all text-sm"
            >
              <MessageCircle className="w-4 h-4" />
              {t("ask")}
            </button>
          ) : (
            <Link
              href="/auth/login"
              className="flex items-center gap-2 px-5 py-2 glass text-gold rounded-lg hover:border-gold/30 transition-all text-sm"
            >
              {t("login_to_ask")}
            </Link>
          )}
        </div>

        {submitted && (
          <div className="mb-6 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm text-center">
            {t("question_submitted") || "Question submitted successfully!"}
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
          <div className="text-center py-12 text-text-secondary">
            <div className="inline-block w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin mb-3" />
            <p>{t("loading") || "Loading..."}</p>
          </div>
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
                <div className="flex">
                  {/* Vote column */}
                  <div className="flex flex-col items-center gap-1 p-3 border-r border-glass-border min-w-[56px]">
                    <button
                      onClick={(e) => { e.stopPropagation(); voteQuestion(q.id, 1); }}
                      className="p-1 text-text-muted hover:text-gold transition-colors"
                      disabled={!session}
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                    <span className={`text-sm font-medium ${q.votes > 0 ? "text-gold" : q.votes < 0 ? "text-red-400" : "text-text-muted"}`}>
                      {q.votes}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); voteQuestion(q.id, -1); }}
                      className="p-1 text-text-muted hover:text-red-400 transition-colors"
                      disabled={!session}
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
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
                            <span className="text-xs text-text-muted">
                              {q._count?.answers || q.answers.length} {t("answers") || "answers"}
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
                                className={`bg-navy/50 rounded-lg p-4 ${
                                  a.isBestAnswer
                                    ? "border-l-2 border-green-400"
                                    : "border-l-2 border-gold"
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  {/* Answer vote */}
                                  <div className="flex flex-col items-center gap-0.5 min-w-[40px]">
                                    <button
                                      onClick={() => voteAnswer(q.id, a.id, 1)}
                                      className="p-0.5 text-text-muted hover:text-gold transition-colors"
                                      disabled={!session}
                                    >
                                      <ThumbsUp className="w-3.5 h-3.5" />
                                    </button>
                                    <span className={`text-xs font-medium ${a.votes > 0 ? "text-gold" : "text-text-muted"}`}>
                                      {a.votes}
                                    </span>
                                    <button
                                      onClick={() => voteAnswer(q.id, a.id, -1)}
                                      className="p-0.5 text-text-muted hover:text-red-400 transition-colors"
                                      disabled={!session}
                                    >
                                      <ThumbsDown className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <User className="w-3 h-3 text-gold" />
                                      <span className="text-sm font-medium text-gold">
                                        {a.author.name}
                                      </span>
                                      {a.isBestAnswer && (
                                        <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                                          <Award className="w-3 h-3" />
                                          {t("best_answer") || "Best Answer"}
                                        </span>
                                      )}
                                      <span className="text-text-muted text-xs">
                                        {formatDate(a.createdAt, locale)}
                                      </span>
                                    </div>
                                    <p className="text-text-secondary text-sm">{a.content}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 glass rounded-lg text-text-secondary hover:text-gold disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-sm transition-colors ${
                  p === page
                    ? "bg-gold text-charcoal font-medium"
                    : "glass text-text-secondary hover:text-gold"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-2 glass rounded-lg text-text-secondary hover:text-gold disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
