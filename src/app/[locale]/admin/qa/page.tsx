"use client";

import { useState, useEffect } from "react";
import { Send, CheckCircle, Clock, Trash2, Award, ThumbsUp, Loader2, AlertCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Question {
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
    author: { name: string | null };
  }[];
}

export default function AdminQAPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answerText, setAnswerText] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/qa")
      .then((res) => res.json())
      .then((data) => setQuestions(data.questions || []))
      .catch(() => setError("Failed to load questions."))
      .finally(() => setLoading(false));
  }, []);

  const submitAnswer = async (questionId: string) => {
    const content = answerText[questionId];
    if (!content?.trim()) return;

    setSubmitting(questionId);
    setError("");
    try {
      const res = await fetch(`/api/qa/${questionId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        const data = await res.json();
        setQuestions(
          questions.map((q) =>
            q.id === questionId
              ? {
                  ...q,
                  isAnswered: true,
                  answers: [...q.answers, data.answer],
                }
              : q
          )
        );
        setAnswerText({ ...answerText, [questionId]: "" });
      } else {
        setError("Failed to submit answer.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(null);
    }
  };

  const markBestAnswer = async (questionId: string, answerId: string, isBest: boolean) => {
    const res = await fetch(`/api/qa/${questionId}/answer`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answerId, isBestAnswer: !isBest }),
    });

    if (res.ok) {
      setQuestions(
        questions.map((q) =>
          q.id === questionId
            ? {
                ...q,
                answers: q.answers.map((a) => ({
                  ...a,
                  isBestAnswer: a.id === answerId ? !isBest : false,
                })),
              }
            : q
        )
      );
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!confirm("Delete this question and all its answers?")) return;
    const res = await fetch(`/api/admin/qa/${questionId}`, { method: "DELETE" });
    if (res.ok) {
      setQuestions(questions.filter((q) => q.id !== questionId));
    }
  };

  const deleteAnswer = async (questionId: string, answerId: string) => {
    if (!confirm("Delete this answer?")) return;
    const res = await fetch(`/api/admin/qa/${questionId}/answer/${answerId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setQuestions(
        questions.map((q) =>
          q.id === questionId
            ? { ...q, answers: q.answers.filter((a) => a.id !== answerId) }
            : q
        )
      );
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] gradient-text mb-8">
        Q&A Management
      </h1>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 mb-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-text-secondary">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading questions...
        </div>
      ) : (
      <div className="space-y-4">
        {questions.map((q) => (
          <div key={q.id} className="glass rounded-xl p-6">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                {q.isAnswered ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <Clock className="w-4 h-4 text-gold" />
                )}
                <span
                  className={`text-xs ${
                    q.isAnswered ? "text-green-400" : "text-gold"
                  }`}
                >
                  {q.isAnswered ? "Answered" : "Pending"}
                </span>
                <span className="flex items-center gap-1 text-xs text-text-muted">
                  <ThumbsUp className="w-3 h-3" />
                  {q.votes}
                </span>
                <span className="text-text-muted text-xs">
                  {formatDate(q.createdAt)}
                </span>
              </div>
              <button
                onClick={() => deleteQuestion(q.id)}
                className="p-1.5 text-text-muted hover:text-red-400 transition-colors"
                title="Delete question"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <h3 className="text-lg font-semibold mb-1">{q.title}</h3>
            <p className="text-text-secondary text-sm mb-2">
              By {q.author.name}
            </p>
            <p className="text-text-secondary text-sm mb-4">{q.content}</p>

            {/* Existing Answers */}
            {q.answers.length > 0 && (
              <div className="space-y-3 mb-4">
                {q.answers.map((a) => (
                  <div
                    key={a.id}
                    className={`bg-navy/50 rounded-lg p-3 ${
                      a.isBestAnswer
                        ? "border-l-2 border-green-400"
                        : "border-l-2 border-gold"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-text-secondary text-sm">{a.content}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <p className="text-text-muted text-xs">
                            — {a.author.name}, {formatDate(a.createdAt)}
                          </p>
                          <span className="flex items-center gap-1 text-xs text-text-muted">
                            <ThumbsUp className="w-3 h-3" />
                            {a.votes}
                          </span>
                          {a.isBestAnswer && (
                            <span className="flex items-center gap-1 text-xs text-green-400">
                              <Award className="w-3 h-3" />
                              Best Answer
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => markBestAnswer(q.id, a.id, a.isBestAnswer)}
                          className={`p-1.5 transition-colors ${
                            a.isBestAnswer
                              ? "text-green-400 hover:text-text-muted"
                              : "text-text-muted hover:text-green-400"
                          }`}
                          title={a.isBestAnswer ? "Remove best answer" : "Mark as best answer"}
                        >
                          <Award className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteAnswer(q.id, a.id)}
                          className="p-1.5 text-text-muted hover:text-red-400 transition-colors"
                          title="Delete answer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Answer Form */}
            <div className="flex gap-2">
              <textarea
                value={answerText[q.id] || ""}
                onChange={(e) =>
                  setAnswerText({ ...answerText, [q.id]: e.target.value })
                }
                placeholder="Write your answer..."
                rows={2}
                className="flex-1 px-4 py-2 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none resize-none text-sm"
              />
              <button
                onClick={() => submitAnswer(q.id)}
                disabled={!answerText[q.id]?.trim() || submitting === q.id}
                className="self-end px-4 py-2 bg-gold text-charcoal font-medium rounded-lg hover:bg-gold-light transition-all disabled:opacity-50 text-sm"
              >
                {submitting === q.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        ))}
        {questions.length === 0 && (
          <p className="text-center py-12 text-text-secondary">
            No questions yet.
          </p>
        )}
      </div>
      )}
    </div>
  );
}
