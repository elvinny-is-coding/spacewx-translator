"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SPACE_WEATHER_GLOSSARY } from "@/lib/glossary";

interface MarkdownWithGlossaryProps {
  content: string;
}

const glossaryMap = new Map(
  SPACE_WEATHER_GLOSSARY.map((g) => [g.term.toLowerCase(), g.definition]),
);
const sortedTerms = SPACE_WEATHER_GLOSSARY.map((g) => g.term).sort(
  (a, b) => b.length - a.length,
);

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Splits a plain text string into an array of React nodes,
 * wrapping glossary terms in <Tooltip> components.
 */
function tokenize(text: string): React.ReactNode[] {
  const pattern = sortedTerms.map((t) => escapeRegExp(t)).join("|");
  if (!pattern) return [text];
  const regex = new RegExp(`\\b(${pattern})\\b`, "gi");

  const segments: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push(text.slice(lastIndex, match.index));
    }
    const term = match[1];
    const definition = glossaryMap.get(term.toLowerCase()) ?? "";

    segments.push(
      <Tooltip key={`${match.index}-${term}`}>
        <TooltipTrigger
          tabIndex={0}
          className="underline decoration-dotted underline-offset-2 cursor-help !text-aurora-green hover:!text-aurora-green/80 inline border-none bg-transparent p-0 font-inherit text-inherit focus:outline-none focus:ring-2 focus:ring-aurora-green/50 rounded"
        >
          {term}
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs bg-deep-indigo border-void-navy text-starlight text-xs p-2 whitespace-normal"
        >
          {definition}
        </TooltipContent>
      </Tooltip>,
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push(text.slice(lastIndex));
  }

  return segments;
}

export default function MarkdownWithGlossary({
  content,
}: MarkdownWithGlossaryProps) {
  return (
    <div className="space-y-2">
      <ReactMarkdown
        components={{
          p: ({ children }) => {
            // Flatten children and apply tokenize to each text node
            const flattened = React.Children.toArray(children).flatMap(
              (child) => {
                if (typeof child === "string") return tokenize(child);
                return [child];
              },
            );
            return (
              <p className="whitespace-pre-wrap leading-relaxed">{flattened}</p>
            );
          },
          strong: ({ children }) => (
            <strong className="font-semibold text-aurora-green">
              {children}
            </strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          code: ({ children }) => (
            <code className="bg-deep-indigo px-1 py-0.5 rounded text-xs font-mono">
              {children}
            </code>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
