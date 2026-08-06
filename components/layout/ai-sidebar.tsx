"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSpaceWeather } from "@/providers/space-weather-provider";
import { useSidebar } from "@/hooks/use-sidebar";
import AudienceToggle from "@/components/audience-toggle";
import MarkdownWithGlossary from "@/components/markdown-with-glossary";
import TechnicalBrief from "@/components/technical-brief";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAiSummary } from "@/hooks/use-ai-summary";
import { Sparkles, Send, Loader2, RotateCcw, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Audience } from "@/types/audience";

function getStorageKey(audience: Audience) {
  return `spacewx-chat-${audience}`;
}

function BaselineSummary({ audience }: { audience: Audience }) {
  const data = useSpaceWeather();
  const kp = data.kp;
  if (kp === null) {
    return (
      <p className="text-sm text-faint-star italic">
        Loading current space weather data…
      </p>
    );
  }

  const wind =
    data.solarWind?.speed != null ? `${data.solarWind.speed} km/s` : "";

  switch (audience) {
    case "technical":
      return null;
    case "educator":
      return (
        <p className="text-sm text-starlight leading-relaxed">
          Kp {kp.toFixed(1)}
          {wind ? `, solar wind ${wind}` : ""}.{" "}
          {kp >= 5
            ? "Active geomagnetic conditions — possible aurora at mid‑latitudes and satellite anomalies."
            : kp >= 4
              ? "Elevated activity — aurora possible at high latitudes."
              : "Quiet conditions — aurora unlikely outside polar regions."}
        </p>
      );
    default:
      return (
        <p className="text-sm text-starlight leading-relaxed">
          Kp {kp.toFixed(1)}
          {wind ? `, solar wind ${wind}` : ""}.{" "}
          {kp >= 5
            ? "Active geomagnetic storm — aurora may be visible farther south than usual."
            : kp >= 4
              ? "Moderate activity — aurora possible at higher latitudes."
              : "Quiet right now — no aurora expected outside polar regions."}
        </p>
      );
  }
}

export default function AiSidebar() {
  const data = useSpaceWeather();
  const { open } = useSidebar();
  const [audience, setAudience] = useState<Audience>("general");
  const { summary, isLoading, error, retry, suggestedPrompts } = useAiSummary(
    data,
    audience,
  );

  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isTechnical = audience === "technical";

  // Seed or restore messages
  useEffect(() => {
    if (isLoading || !summary) return;

    const saved = sessionStorage.getItem(getStorageKey(audience));
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      } catch {
        /* ignore */
      }
    }

    setMessages([{ role: "assistant", content: summary }]);
  }, [summary, isLoading, audience]);

  // Persist messages
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem(getStorageKey(audience), JSON.stringify(messages));
    }
  }, [messages, audience]);

  // Auto‑scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reset chat
  const resetChat = useCallback(() => {
    sessionStorage.removeItem(getStorageKey(audience));
    if (summary) {
      setMessages([{ role: "assistant", content: summary }]);
    } else {
      setMessages([]);
    }
    setChatError(null);
  }, [audience, summary]);

  // Send a question – optionally with an explicit string (for chip clicks)
  const handleSend = useCallback(
    async (questionOverride?: string) => {
      const question = questionOverride ?? input.trim();
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
            history: updated.slice(-7, -1),
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
    },
    [input, isChatLoading, messages, data, audience],
  );

  return (
    <aside
      className={cn(
        "fixed top-14 right-0 z-40 h-[calc(100vh-3.5rem)] w-full sm:w-[380px] border-l border-void-navy bg-deep-indigo flex flex-col transition-transform duration-300",
        open ? "translate-x-0" : "translate-x-full",
        "lg:translate-x-0",
        !open && "lg:hidden",
      )}
    >
      <TooltipProvider>
        {/* Header — Kairo branding */}
        <div className="px-4 py-3 border-b border-void-navy">
          <h3 className="font-display text-base text-starlight flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-gradient-to-br from-aurora-green to-aurora-violet flex items-center justify-center">
              <Sparkles size={10} className="text-void-navy" />
            </span>
            Kairo
          </h3>
          <p className="text-xs text-faint-star mt-0.5">
            Your AI space weather guide
          </p>
        </div>

        {/* Audience toggle */}
        <div className="px-4 py-3 border-b border-void-navy">
          <AudienceToggle selected={audience} onChange={setAudience} />
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {/* Welcome message — only when no messages and not loading */}
          {messages.length === 0 && !isLoading && !error && !isTechnical && (
            <div className="text-center py-6">
              <div className="w-10 h-10 mx-auto rounded-full bg-gradient-to-br from-aurora-green to-aurora-violet flex items-center justify-center mb-3">
                <Sparkles size={18} className="text-void-navy" />
              </div>
              <p className="text-sm text-starlight mb-1">Hi, I&rsquo;m Kairo</p>
              <p className="text-xs text-faint-star max-w-[240px] mx-auto">
                Ask me anything about space weather, aurora visibility, or solar
                activity.
              </p>
            </div>
          )}

          {isTechnical && <TechnicalBrief data={data} />}

          {isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full bg-void-navy" />
              <Skeleton className="h-4 w-3/4 bg-void-navy" />
              {!isTechnical && <BaselineSummary audience={audience} />}
            </div>
          )}

          {!isLoading && error && (
            <div className="text-sm text-solar-amber text-center py-4">
              {error}
            </div>
          )}

          {!isLoading &&
            !error &&
            messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-aurora-green text-void-navy"
                      : "bg-void-navy text-starlight border border-deep-indigo",
                  )}
                >
                  {msg.role === "user" ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <MarkdownWithGlossary content={msg.content} />
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

        {/* Bottom area: suggested prompts above, then input row with reset */}
        <div className="border-t border-void-navy px-4 py-3 space-y-2">
          {/* Suggested prompts (from cached daily summaries) */}
          {suggestedPrompts.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {suggestedPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  disabled={isChatLoading || isLoading}
                  className="text-xs text-left text-faint-star hover:text-starlight bg-void-navy hover:bg-deep-indigo border border-deep-indigo rounded-full px-3 py-1 transition-colors disabled:opacity-50"
                >
                  <span className="flex items-center gap-1">
                    {prompt}
                    <ChevronRight size={12} className="shrink-0" />
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Input row */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            {/* Reset button — only when chat has extra messages */}
            {messages.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={resetChat}
                className="text-faint-star hover:text-starlight h-8 w-8 shrink-0"
                title="Reset chat"
              >
                <RotateCcw size={14} />
              </Button>
            )}
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Kairo..."
              disabled={isChatLoading || isLoading}
              className="flex-1 bg-void-navy border-void-navy text-starlight placeholder:text-faint-star focus:border-aurora-green text-sm"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isChatLoading || isLoading}
              className="bg-aurora-green text-void-navy hover:bg-aurora-green/90 shrink-0"
            >
              <Send size={14} />
            </Button>
          </form>
        </div>
      </TooltipProvider>
    </aside>
  );
}
