"use client";

import { useState, useEffect } from "react";
import { Send, CheckCircle, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Question {
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
    author: { name: string | null };
  }[];
}

export default function AdminQAPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answerText, setAnswerText] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/qa")
      .then((res) => res.json())
      .then((data) => setQuestions(data.questions || []));
  }, []);

  const submitAnswer = async (questionId: string) => {
    const content = answerText[questionId];
    if (!content?.trim()) return;

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
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] gradient-text mb-8">
        Q&A Management
      </h1>

      <div className="space-y-4">
        {questions.map((q) => (
          <div key={q.id} className="glass rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
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
              <span className="text-text-muted text-xs ml-auto">
                {formatDate(q.createdAt)}
              </span>
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
                    className="bg-navy/50 rounded-lg p-3 border-l-2 border-gold"
                  >
                    <p className="text-text-secondary text-sm">{a.content}</p>
                    <p className="text-text-muted text-xs mt-1">
                      — {a.author.name}, {formatDate(a.createdAt)}
                    </p>
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
                disabled={!answerText[q.id]?.trim()}
                className="self-end px-4 py-2 bg-gold text-charcoal font-medium rounded-lg hover:bg-gold-light transition-all disabled:opacity-50 text-sm"
              >
                <Send className="w-4 h-4" />
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
    </div>
  );
}
