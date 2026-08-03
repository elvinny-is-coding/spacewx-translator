"use client";

import { useState, useRef, useEffect, useCallback, type FormEvent } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ChatMessage from "@/components/chat-message";
import type { SpaceWeatherData } from "@/types/spacewx";
import type { TimelineEvent } from "@/types/timeline";

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SpaceWeatherData | null>(null);
  const [recentEvents, setRecentEvents] = useState<TimelineEvent[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch space weather data when chat opens
  useEffect(() => {
    if (!open || data) return;
    setDataLoading(true);
    fetch("/api/spacewx")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch data");
        return res.json();
      })
      .then((json) => setData(json))
      .catch(() => setError("Could not load space weather data. Try again later."))
      .finally(() => setDataLoading(false));
  }, [open, data]);

  // Fetch recent events when chat opens
  useEffect(() => {
    if (!open || recentEvents.length > 0) return;

    const fetchEvents = async () => {
      try {
        const now = new Date();
        const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const res = await fetch(
          `/api/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(now.toISOString())}`,
        );
        if (res.ok) {
          const json = await res.json();
          setRecentEvents(json.events ?? []);
        }
      } catch {
        // Non‑critical, chat works without recent events
      }
    };
    fetchEvents();
  }, [open, recentEvents.length]);

  // Auto‑scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = useCallback(
    async (e?: FormEvent) => {
      e?.preventDefault();
      const question = input.trim();
      if (!question || !data || isLoading) return;

      setInput("");
      setError(null);
      const userMessage = { role: "user" as const, content: question };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question,
            data,
            recentEvents: recentEvents.length > 0 ? recentEvents : undefined,
            history: messages.slice(-6),
          }),
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => null);
          throw new Error(
            errBody?.error || `Request failed (HTTP ${res.status})`,
          );
        }

        const json = await res.json();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: json.answer },
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setIsLoading(false);
      }
    },
    [input, data, isLoading, messages, recentEvents],
  );

  return (
    <>
      {/* Floating chat button */}
      {!open && (
        <Button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-[9999] h-14 w-14 rounded-full bg-aurora-green text-void-navy shadow-lg hover:bg-aurora-green/90"
          aria-label="Open chat"
        >
          <MessageCircle size={24} />
        </Button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-0 right-0 top-0 z-[9999] flex w-full flex-col bg-deep-indigo border-l border-void-navy shadow-2xl sm:w-[400px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-void-navy px-4 py-3">
            <div>
              <h2 className="font-display text-base text-starlight">
                Space Weather Assistant
              </h2>
              <p className="text-xs text-faint-star">
                Ask about current conditions, aurora, or recent events
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              className="text-faint-star hover:text-starlight"
              aria-label="Close chat"
            >
              <X size={20} />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {dataLoading && (
              <div className="flex justify-center">
                <Loader2 size={20} className="animate-spin text-aurora-green" />
              </div>
            )}
            {!dataLoading && messages.length === 0 && (
              <p className="text-sm text-faint-star text-center mt-8">
                Ask me anything about space weather — current Kp, solar flares,
                aurora visibility, or recent events.
              </p>
            )}
            {messages.map((msg, i) => (
              <ChatMessage key={i} role={msg.role} content={msg.content} />
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-void-navy rounded-xl px-4 py-3 border border-deep-indigo">
                  <Loader2 size={18} className="animate-spin text-aurora-green" />
                </div>
              </div>
            )}
            {error && (
              <div className="text-sm text-solar-amber text-center">{error}</div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-void-navy px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                disabled={isLoading || dataLoading}
                className="flex-1 bg-void-navy border-void-navy text-starlight placeholder:text-faint-star focus:border-aurora-green"
                autoFocus
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading || dataLoading}
                className="bg-aurora-green text-void-navy hover:bg-aurora-green/90"
              >
                <Send size={16} />
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}