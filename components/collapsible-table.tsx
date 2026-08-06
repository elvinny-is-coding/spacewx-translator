"use client";

import { useState } from "react";

interface CollapsibleTableProps {
  /** Number of rows to show when collapsed */
  collapsedRows?: number;
  /** Height of the blur gradient in pixels */
  blurHeight?: number;
  children: React.ReactNode;
}

export default function CollapsibleTable({
  collapsedRows = 6,
  blurHeight = 60,
  children,
}: CollapsibleTableProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`relative ${!expanded ? "cursor-pointer" : ""}`}
      onClick={() => !expanded && setExpanded(true)}
    >
      {/* Table container with max height when collapsed */}
      <div
        className={`overflow-hidden transition-all duration-300 ${
          !expanded ? "max-h-[280px]" : "max-h-[2000px]"
        }`}
      >
        {children}
      </div>

      {/* Blur overlay + expand hint */}
      {!expanded && (
        <div
          className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-end pointer-events-none"
          style={{ height: `${blurHeight}px` }}
        >
          {/* Gradient blur */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(19,27,51,0.95) 0%, rgba(19,27,51,0.7) 40%, transparent 100%)",
            }}
          />
          {/* Subtle text hint */}
          <span className="relative text-xs text-aurora-green/70 mb-1 z-10">
            Click to expand
          </span>
        </div>
      )}

      {/* Collapse button when expanded */}
      {expanded && (
        <div className="flex justify-center mt-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(false);
            }}
            className="text-xs text-faint-star hover:text-starlight transition-colors"
          >
            Show less
          </button>
        </div>
      )}
    </div>
  );
}
