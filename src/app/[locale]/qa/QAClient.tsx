"use client";

import { useTranslations, useLocale } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Search, ThumbsUp, ThumbsDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Container } from "@/components/ui/Section";
import { Button, ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { questionSchema, QuestionInput } from "@/lib/validations";
import { useState, useEffect, useCallback, useRef } from "react";
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

export default function QAClient({
  initialQuestions = [],
  initialTotalPages = 1,
}: {
  initialQuestions?: QuestionData[];
  initialTotalPages?: number;
}) {
  const t = useTranslations("qa");
  const locale = useLocale();
  const { data: session } = useSession();
  const [questions, setQuestions] = useState<QuestionData[]>(initialQuestions);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<"recent" | "popular" | "unanswered">("recent");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages);

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

  // The first page is server-rendered; only refetch when the query changes.
  const isFirstLoad = useRef(true);
  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
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

  const inputCls =
    "w-full min-h-11 px-4 py-2.5 bg-navy border border-glass-border rounded-[var(--radius-md)] text-text-primary focus:border-gold focus:outline-none transition-colors";
  const voteBtn =
    "w-11 h-11 inline-flex items-center justify-center rounded-[var(--radius-sm)] text-text-muted transition-colors disabled:opacity-40 disabled:pointer-events-none";

  return (
    <div className="pt-16 md:pt-24 pb-24">
      <Container size="prose">
        <header className="mb-10">
          <p className="eyebrow mb-4">Q&amp;A</p>
          <h1 className="font-display text-4xl md:text-6xl leading-[1.02] tracking-tight mb-5">{t("title")}</h1>
          <p className="lede">{t("subtitle")}</p>
        </header>

        {/* Search */}
        <div className="relative mb-5">
          <label htmlFor="qa-search" className="sr-only">
            {t("search")}
          </label>
          <Search aria-hidden className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            id="qa-search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("search")}
            className={cn(inputCls, "pl-11")}
          />
        </div>

        {/* Sort + ask */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div role="group" className="flex flex-wrap gap-2">
            {sortTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                aria-pressed={sort === tab.key}
                onClick={() => { setSort(tab.key); setPage(1); }}
                className={cn(
                  "inline-flex items-center min-h-11 md:min-h-9 px-3.5 text-sm rounded-[var(--radius-sm)] border transition-colors",
                  sort === tab.key
                    ? "border-gold/40 bg-gold/10 text-gold"
                    : "border-glass-border text-text-secondary hover:text-text-primary hover:bg-[var(--hover-wash)]",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {session ? (
            <Button onClick={() => setShowForm(!showForm)} aria-expanded={showForm} aria-controls="qa-form">
              {t("ask")}
            </Button>
          ) : (
            <ButtonLink href="/auth/login" variant="secondary">
              {t("login_to_ask")}
            </ButtonLink>
          )}
        </div>

        {submitted && (
          <p role="status" className="mb-6 p-3 rounded-[var(--radius-md)] bg-success/10 border border-success/30 text-success text-sm">
            {t("question_submitted")}
          </p>
        )}

        {/* Question form */}
        <AnimatePresence initial={false}>
          {showForm && (
            <motion.div
              id="qa-form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <form onSubmit={handleSubmit(onSubmit)} className="card p-6 mb-8 space-y-4" noValidate>
                <div>
                  <label htmlFor="qa-title" className="block text-sm text-text-secondary mb-1.5">
                    {t("question_title")} *
                  </label>
                  <input
                    id="qa-title"
                    {...register("title")}
                    aria-invalid={!!errors.title}
                    aria-describedby={errors.title ? "qa-title-error" : undefined}
                    className={inputCls}
                  />
                  {errors.title && (
                    <p id="qa-title-error" className="text-danger text-sm mt-1.5">
                      {errors.title.message}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="qa-content" className="block text-sm text-text-secondary mb-1.5">
                    {t("question_content")} *
                  </label>
                  <textarea
                    id="qa-content"
                    {...register("content")}
                    rows={4}
                    aria-invalid={!!errors.content}
                    aria-describedby={errors.content ? "qa-content-error" : undefined}
                    className={cn(inputCls, "resize-y")}
                  />
                  {errors.content && (
                    <p id="qa-content-error" className="text-danger text-sm mt-1.5">
                      {errors.content.message}
                    </p>
                  )}
                </div>
                <Button type="submit" loading={isSubmitting}>
                  {t("submit")}
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Questions */}
        {loading ? (
          <p role="status" className="py-12 text-text-secondary">{t("loading")}</p>
        ) : questions.length === 0 ? (
          <p className="py-12 text-text-secondary border-t border-glass-border">{t("no_questions")}</p>
        ) : (
          <ol className="border-t border-glass-border">
            {questions.map((q) => {
              const open = expandedId === q.id;
              return (
                <li key={q.id} className="border-b border-glass-border">
                  <div className="flex gap-3 py-5">
                    {/* Votes */}
                    <div className="flex flex-col items-center shrink-0 -my-1">
                      <button
                        type="button"
                        onClick={() => voteQuestion(q.id, 1)}
                        className={cn(voteBtn, "hover:text-gold")}
                        disabled={!session}
                        aria-label={`${t("vote")} +1`}
                      >
                        <ThumbsUp aria-hidden className="w-4 h-4" />
                      </button>
                      <span
                        className={cn(
                          "font-mono text-sm tabular-nums",
                          q.votes > 0 ? "text-gold" : q.votes < 0 ? "text-danger" : "text-text-muted",
                        )}
                      >
                        {q.votes}
                      </span>
                      <button
                        type="button"
                        onClick={() => voteQuestion(q.id, -1)}
                        className={cn(voteBtn, "hover:text-danger")}
                        disabled={!session}
                        aria-label={`${t("vote")} -1`}
                      >
                        <ThumbsDown aria-hidden className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => setExpandedId(open ? null : q.id)}
                        aria-expanded={open}
                        aria-controls={`qa-${q.id}`}
                        className="group w-full text-left flex items-start justify-between gap-3"
                      >
                        <span className="min-w-0">
                          <span className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1.5 text-sm">
                            <span className={q.isAnswered ? "text-success" : "text-gold"}>
                              {q.isAnswered ? t("answered") : t("unanswered")}
                            </span>
                            <span className="font-mono text-text-muted tabular-nums">
                              {q._count?.answers || q.answers.length} {t("answers")}
                            </span>
                          </span>
                          <span className="block font-display text-xl leading-snug group-hover:text-gold transition-colors">
                            {q.title}
                          </span>
                          <span className="flex flex-wrap gap-x-3 mt-1.5 text-sm text-text-muted">
                            <span>{q.author.name}</span>
                            <span className="font-mono tabular-nums">{formatDate(q.createdAt, locale)}</span>
                          </span>
                        </span>
                        <ChevronDown
                          aria-hidden
                          className={cn("w-5 h-5 mt-1 text-text-muted shrink-0 transition-transform", open && "rotate-180")}
                        />
                      </button>

                      {open && (
                        <div id={`qa-${q.id}`} className="mt-4">
                          <p className="text-text-secondary leading-relaxed mb-5">{q.content}</p>
                          {q.answers.length > 0 && (
                            <ul className="space-y-3">
                              {q.answers.map((a) => (
                                <li
                                  key={a.id}
                                  className={cn(
                                    "flex gap-3 rounded-[var(--radius-md)] bg-[var(--hover-wash)] p-4 border-l-2",
                                    a.isBestAnswer ? "border-success" : "border-gold",
                                  )}
                                >
                                  <div className="flex flex-col items-center shrink-0 -my-2">
                                    <button
                                      type="button"
                                      onClick={() => voteAnswer(q.id, a.id, 1)}
                                      className={cn(voteBtn, "hover:text-gold")}
                                      disabled={!session}
                                      aria-label={`${t("vote")} +1`}
                                    >
                                      <ThumbsUp aria-hidden className="w-3.5 h-3.5" />
                                    </button>
                                    <span className={cn("font-mono text-xs tabular-nums", a.votes > 0 ? "text-gold" : "text-text-muted")}>
                                      {a.votes}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => voteAnswer(q.id, a.id, -1)}
                                      className={cn(voteBtn, "hover:text-danger")}
                                      disabled={!session}
                                      aria-label={`${t("vote")} -1`}
                                    >
                                      <ThumbsDown aria-hidden className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2 text-sm">
                                      <span className="font-medium text-gold">{a.author.name}</span>
                                      {a.isBestAnswer && <span className="text-success">{t("best_answer")}</span>}
                                      <span className="font-mono text-xs text-text-muted">{formatDate(a.createdAt, locale)}</span>
                                    </p>
                                    <p className="text-text-secondary leading-relaxed">{a.content}</p>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav aria-label="Pagination" className="flex flex-wrap items-center gap-2 mt-10">
            <button
              type="button"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              aria-label={locale === "fr" ? "Page précédente" : "Previous page"}
              className="w-11 h-11 inline-flex items-center justify-center rounded-[var(--radius-sm)] border border-glass-border text-text-secondary hover:text-gold disabled:opacity-30 transition-colors"
            >
              <ChevronLeft aria-hidden className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                aria-current={p === page ? "page" : undefined}
                className={cn(
                  "w-11 h-11 rounded-[var(--radius-sm)] font-mono text-sm tabular-nums transition-colors",
                  p === page ? "bg-gold text-charcoal" : "border border-glass-border text-text-secondary hover:text-gold",
                )}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              aria-label={locale === "fr" ? "Page suivante" : "Next page"}
              className="w-11 h-11 inline-flex items-center justify-center rounded-[var(--radius-sm)] border border-glass-border text-text-secondary hover:text-gold disabled:opacity-30 transition-colors"
            >
              <ChevronRight aria-hidden className="w-4 h-4" />
            </button>
          </nav>
        )}
      </Container>
    </div>
  );
}
