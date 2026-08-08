"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Location {
  name: string;
  lat: number;
  lng: number;
}

interface LocationAutocompleteProps {
  locations: Location[];
  selected: Location;
  onChange: (location: Location) => void;
  disabled?: boolean;
}

export default function LocationAutocomplete({
  locations,
  selected,
  onChange,
  disabled = false,
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState(selected.name);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter locations based on query
  const filtered = query
    ? locations.filter((loc) =>
        loc.name.toLowerCase().includes(query.toLowerCase()),
      )
    : locations;

  // When clicking outside, revert to selected name if query is empty or no exact match
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        if (!query.trim()) {
          // If user cleared and clicked away, revert to selected name
          setQuery(selected.name);
        } else {
          // If they typed something but didn't select, revert to selected name if no exact match was found
          const exactMatch = locations.find(
            (loc) => loc.name.toLowerCase() === query.trim().toLowerCase(),
          );
          if (!exactMatch) {
            setQuery(selected.name);
          }
        }
        setError(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selected.name, query, locations]);

  const handleSelect = useCallback(
    (location: Location) => {
      setQuery(location.name);
      setOpen(false);
      setError(null);
      onChange(location);
    },
    [onChange],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // If the typed text matches exactly one location, select it
      const exactMatch = locations.find(
        (loc) => loc.name.toLowerCase() === query.trim().toLowerCase(),
      );
      if (exactMatch) {
        handleSelect(exactMatch);
      } else {
        setError(`"${query.trim()}" not found. Please pick from the list.`);
      }
      setOpen(false);
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery(selected.name);
      setError(null);
      inputRef.current?.blur();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setError(null);
    setOpen(true);
  };

  const handleClear = () => {
    setQuery("");
    setError(null);
    setOpen(false); // close dropdown when clearing
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-1" ref={containerRef}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Search location..."
          className="bg-void-navy border-deep-indigo text-starlight text-sm h-10 pl-9 pr-10"
          aria-label="Location search"
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-8 top-1/2 -translate-y-1/2 text-faint-star hover:text-starlight"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-faint-star hover:text-starlight"
          aria-label="Toggle list"
        >
          <ChevronDown size={14} />
        </button>

        {/* Dropdown list */}
        {open && filtered.length > 0 && (
          <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto bg-deep-indigo border border-void-navy rounded-lg shadow-lg">
            {filtered.map((loc) => (
              <button
                key={loc.name}
                type="button"
                onClick={() => handleSelect(loc)}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm transition-colors",
                  loc.name === selected.name
                    ? "bg-aurora-green/10 text-aurora-green"
                    : "text-faint-star hover:bg-void-navy hover:text-starlight",
                )}
              >
                {loc.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error / fallback message */}
      {error && <p className="text-xs text-solar-amber">{error}</p>}
    </div>
  );
}
