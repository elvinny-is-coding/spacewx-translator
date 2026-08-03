"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  RefreshCw,
  Sparkles,
  Send,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAiSummary } from "@/hooks/use-ai-summary";
import MarkdownContent from "@/components/markdown-content";
import type { SpaceWeatherData } from "@/types/spacewx";
import type { Audience } from "@/types/audience";

interface AiSummaryCardProps {
  data: SpaceWeatherData;
  audience: Audience;
}

const AUDIENCE_DESCRIPTIONS: Record<Audience, string> = {
  general:
    "A simple, jargon‑free explanation of what's happening in space weather right now — perfect for aurora watchers and curious minds.",
  educator:
    "A science‑focused summary explaining the causes and effects of current solar activity. Ideal for classrooms and self‑learning.",
  technical:
    "A precise technical brief for satellite operators, pilots, and radio engineers who need to understand potential impacts on their systems.",
};

function getStorageKey(audience: Audience) {
  return `spacewx-chat-${audience}`;
}

export default function AiSummaryCard({ data, audience }: AiSummaryCardProps) {
  const { summary, isLoading, error, retry } = useAiSummary(data, audience);

  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Track whether we've restored the session for the *current* audience
  const restoredForAudience = useRef<Audience | null>(null);

  // ── Reset on audience change ─────────────────────────────────
  useEffect(() => {
    // Clear chat immediately so the previous audience's messages disappear
    setMessages([]);
    setChatError(null);
    restoredForAudience.current = null;
    setInput("");
  }, [audience]);

  // ── Seed or restore once summary is ready ────────────────────
  useEffect(() => {
    if (isLoading || !summary) return;
    // Only seed/restore if we haven't already done so for this audience
    if (restoredForAudience.current === audience) return;

    const saved = sessionStorage.getItem(getStorageKey(audience));
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          restoredForAudience.current = audience;
          return;
        }
      } catch {
        /* ignore */
      }
    }

    // No saved history – start fresh with the current summary
    setMessages([{ role: "assistant", content: summary }]);
    restoredForAudience.current = audience;
  }, [summary, isLoading, audience]);

  // ── Persist messages to sessionStorage ────────────────────────
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem(getStorageKey(audience), JSON.stringify(messages));
    }
  }, [messages, audience]);

  // ── Auto‑scroll to bottom ────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Reset chat manually ──────────────────────────────────────
  const resetChat = () => {
    sessionStorage.removeItem(getStorageKey(audience));
    restoredForAudience.current = null;
    if (summary) {
      setMessages([{ role: "assistant", content: summary }]);
    } else {
      setMessages([]);
    }
    setChatError(null);
  };

  // ── Send a follow‑up question ────────────────────────────────
  const handleSend = async () => {
    const question = input.trim();
    if (!question || isChatLoading) return;

    setInput("");
    setChatError(null);
    const userMsg = { role: "user" as const, content: question };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setIsChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          data,
          audience,
          history: updated.slice(-7, -1), // last 6 before the latest
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
    } catch (err: any) {
      setChatError(err.message ?? "Something went wrong.");
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <Card className="border-none bg-deep-indigo shadow-lg">
      <CardContent className="p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg text-starlight flex items-center gap-2">
              <Sparkles size={18} className="text-aurora-green" />
              Your AI Summary
            </h3>
            <p className="text-sm text-faint-star">
              {AUDIENCE_DESCRIPTIONS[audience]}
            </p>
          </div>
          {messages.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={resetChat}
              className="text-faint-star hover:text-starlight"
              title="Reset chat"
            >
              <RotateCcw size={16} />
            </Button>
          )}
        </div>

        {/* Messages area */}
        <div className="min-h-[120px] max-h-[500px] overflow-y-auto space-y-3 pr-1">
          {isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full bg-void-navy" />
              <Skeleton className="h-4 w-3/4 bg-void-navy" />
              <Skeleton className="h-4 w-5/6 bg-void-navy" />
            </div>
          )}

          {!isLoading && error && (
            <div className="flex flex-col items-center gap-3 text-center">
              <AlertCircle size={24} className="text-solar-amber" />
              <p className="text-sm text-faint-star">{error}</p>
              <button
                onClick={retry}
                className="flex items-center gap-1 rounded-lg px-3 py-1 text-sm text-aurora-green transition hover:bg-void-navy"
              >
                <RefreshCw size={14} />
                Retry
              </button>
            </div>
          )}

          {!isLoading && !error && messages.length === 0 && (
            <p className="text-sm text-faint-star italic">
              Waiting for space weather data…
            </p>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-aurora-green text-void-navy"
                    : "bg-void-navy text-starlight border border-deep-indigo"
                }`}
              >
                {msg.role === "user" ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <MarkdownContent content={msg.content} />
                )}
              </div>
            </div>
          ))}

          {isChatLoading && (
            <div className="flex justify-start">
              <div className="bg-void-navy rounded-xl px-4 py-3 border border-deep-indigo">
                <Loader2 size={18} className="animate-spin text-aurora-green" />
              </div>
            </div>
          )}

          {chatError && (
            <div className="text-sm text-solar-amber text-center">
              {chatError}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 pt-2 border-t border-deep-indigo"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a follow‑up question..."
            disabled={isChatLoading || isLoading}
            className="flex-1 bg-void-navy border-void-navy text-starlight placeholder:text-faint-star focus:border-aurora-green text-sm"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isChatLoading || isLoading}
            className="bg-aurora-green text-void-navy hover:bg-aurora-green/90"
          >
            <Send size={14} />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
