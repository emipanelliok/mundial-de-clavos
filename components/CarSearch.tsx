"use client";

import { useState, useRef, useEffect } from "react";
import { searchCars } from "@/lib/cars";
import { X, Search } from "lucide-react";

interface CarSearchProps {
  index: number;
  value: string;
  onChange: (value: string) => void;
  onRemove: () => void;
  existingCars: string[];
  canRemove: boolean;
}

export default function CarSearch({
  index,
  value,
  onChange,
  onRemove,
  existingCars,
  canRemove,
}: CarSearchProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleInput = (val: string) => {
    setQuery(val);
    onChange("");
    if (val.length > 0) {
      const results = searchCars(val).filter((c) => !existingCars.includes(c));
      setSuggestions(results);
      setOpen(true);
    } else {
      setSuggestions(searchCars("").filter((c) => !existingCars.includes(c)));
      setOpen(true);
    }
    setCustomMode(false);
  };

  const handleSelect = (car: string) => {
    setQuery(car);
    onChange(car);
    setOpen(false);
  };

  const handleCustomConfirm = () => {
    if (query.trim().length > 1) {
      onChange(query.trim());
      setOpen(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    onChange("");
    setOpen(false);
    setCustomMode(false);
    inputRef.current?.focus();
  };

  const isConfirmed = !!value;

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`flex items-center gap-2 rounded-xl border-2 px-3 py-3 transition-all ${
          isConfirmed
            ? "bg-rust/10 border-rust"
            : open
            ? "bg-white border-rust/50"
            : "bg-white border-border"
        }`}
      >
        <span className="text-muted font-display text-lg w-5 text-center shrink-0">
          {index + 1}
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => {
            const results = searchCars(query).filter(
              (c) => !existingCars.includes(c)
            );
            setSuggestions(results);
            setOpen(true);
          }}
          placeholder="Buscar o escribir auto..."
          className="flex-1 bg-transparent text-ink placeholder:text-muted text-sm outline-none min-w-0"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
        {isConfirmed && (
          <span className="text-rust shrink-0">
            <Search size={14} />
          </span>
        )}
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="text-muted hover:text-crimson shrink-0 p-0.5"
          >
            <X size={14} />
          </button>
        )}
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-muted hover:text-crimson shrink-0 p-0.5 border-l border-border pl-2 ml-1"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border-2 border-border rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto">
          {suggestions.length > 0 ? (
            <>
              {suggestions.map((car) => (
                <button
                  key={car}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(car)}
                  className="w-full text-left px-4 py-3 text-sm text-ink hover:bg-surface active:bg-rust/10 border-b border-border/50 last:border-0 transition-colors"
                >
                  {car}
                </button>
              ))}
              {query.trim().length > 1 &&
                !suggestions.some(
                  (s) => s.toLowerCase() === query.toLowerCase()
                ) && (
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setCustomMode(true);
                      handleCustomConfirm();
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-rust font-medium hover:bg-rust/5 border-t border-border/50"
                  >
                    + Agregar &quot;{query.trim()}&quot; como nuevo
                  </button>
                )}
            </>
          ) : query.trim().length > 1 ? (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleCustomConfirm}
              className="w-full text-left px-4 py-3 text-sm text-rust font-medium hover:bg-rust/5"
            >
              + Agregar &quot;{query.trim()}&quot; como nuevo
            </button>
          ) : (
            <p className="px-4 py-3 text-sm text-muted">Escribí para buscar...</p>
          )}
        </div>
      )}
    </div>
  );
}
