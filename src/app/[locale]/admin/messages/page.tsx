"use client";

import { useState, useEffect } from "react";
import { Mail, MailOpen, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

  useEffect(() => {
    fetch("/api/admin/messages")
      .then((res) => res.json())
      .then((data) => setMessages(data.messages || []));
  }, []);

  const markAsRead = async (id: string) => {
    await fetch(`/api/admin/messages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead: true }),
    });
    setMessages(
      messages.map((m) => (m.id === id ? { ...m, isRead: true } : m))
    );
  };

  const deleteMessage = async (id: string) => {
    await fetch(`/api/admin/messages/${id}`, { method: "DELETE" });
    setMessages(messages.filter((m) => m.id !== id));
    if (selectedMessage?.id === id) setSelectedMessage(null);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] gradient-text mb-8">
        Messages
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message List */}
        <div className="lg:col-span-1 space-y-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              onClick={() => {
                setSelectedMessage(msg);
                if (!msg.isRead) markAsRead(msg.id);
              }}
              className={`glass rounded-lg p-4 cursor-pointer transition-all hover:border-gold/20 ${
                selectedMessage?.id === msg.id ? "border-gold/30" : ""
              } ${!msg.isRead ? "border-l-2 border-l-gold" : ""}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium flex items-center gap-2">
                  {!msg.isRead ? (
                    <Mail className="w-3 h-3 text-gold" />
                  ) : (
                    <MailOpen className="w-3 h-3 text-text-muted" />
                  )}
                  {msg.name}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMessage(msg.id);
                  }}
                  className="text-text-muted hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <p className="text-text-secondary text-xs truncate">{msg.subject}</p>
              <p className="text-text-muted text-[10px] mt-1">
                {formatDate(msg.createdAt)}
              </p>
            </div>
          ))}
          {messages.length === 0 && (
            <p className="text-center py-8 text-text-secondary text-sm">
              No messages yet.
            </p>
          )}
        </div>

        {/* Message Detail */}
        <div className="lg:col-span-2">
          {selectedMessage ? (
            <div className="glass rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-1">
                {selectedMessage.subject}
              </h2>
              <div className="flex items-center gap-3 text-text-secondary text-sm mb-6">
                <span>{selectedMessage.name}</span>
                <span>&lt;{selectedMessage.email}&gt;</span>
                <span className="text-text-muted">
                  {formatDate(selectedMessage.createdAt)}
                </span>
              </div>
              <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">
                {selectedMessage.message}
              </p>
            </div>
          ) : (
            <div className="glass rounded-xl p-12 text-center text-text-secondary">
              Select a message to view
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
