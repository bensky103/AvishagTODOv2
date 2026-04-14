"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";

interface DatePickerProps {
  value: string; // "YYYY-MM-DD" or ""
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const HEBREW_MONTHS = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];

const HEBREW_DAYS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function parseDate(str: string): { year: number; month: number; day: number } | null {
  if (!str) return null;
  const [y, m, d] = str.split("-").map(Number);
  if (!y || !m || !d) return null;
  return { year: y, month: m - 1, day: d };
}

type ViewMode = "days" | "months";

export function DatePicker({ value, onChange, placeholder = "בחר תאריך", className = "" }: DatePickerProps) {
  const parsed = parseDate(value);
  const today = new Date();

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(parsed?.year ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? today.getMonth());
  const [viewMode, setViewMode] = useState<ViewMode>("days");
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const ref = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Position the portal-rendered dropdown relative to the trigger
  const updatePosition = useCallback(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const dropdownHeight = 290; // approximate compact calendar height
    const spaceBelow = window.innerHeight - rect.bottom;
    const fitsBelow = spaceBelow > dropdownHeight + 10;
    setDropdownPos({
      top: fitsBelow ? rect.bottom + 4 : rect.top - dropdownHeight - 4,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        ref.current && !ref.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setOpen(false);
        setViewMode("days");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Update position on scroll/resize while open
  useEffect(() => {
    if (!open) return;
    updatePosition();
    const onScrollOrResize = () => updatePosition();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open, updatePosition]);

  // Sync view when value changes externally
  useEffect(() => {
    const p = parseDate(value);
    if (p) {
      setViewYear(p.year);
      setViewMonth(p.month);
    }
  }, [value]);

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const selectDay = (day: number) => {
    onChange(toDateStr(viewYear, viewMonth, day));
    setOpen(false);
    setViewMode("days");
  };

  const selectMonth = (month: number) => {
    setViewMonth(month);
    setViewMode("days");
  };

  const isSelected = (day: number) =>
    parsed?.year === viewYear && parsed?.month === viewMonth && parsed?.day === day;

  const isToday = (day: number) =>
    today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;

  const displayValue = parsed
    ? new Date(parsed.year, parsed.month, parsed.day).toLocaleDateString("he-IL")
    : "";

  // Build calendar grid
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  // Year range for month/year picker
  const currentYear = today.getFullYear();
  const yearRange: number[] = [];
  for (let y = currentYear - 5; y <= currentYear + 5; y++) yearRange.push(y);

  const handleOpen = () => {
    updatePosition();
    setOpen(!open);
    if (open) setViewMode("days");
  };

  const dropdown = open && dropdownPos && createPortal(
    <div
      ref={dropdownRef}
      className="fixed z-[100] bg-surface border border-white/[0.08] rounded-xl shadow-modal p-2.5 animate-fade-in"
      style={{
        top: dropdownPos.top,
        left: dropdownPos.left,
        width: Math.max(dropdownPos.width, 250),
      }}
    >
      {viewMode === "days" ? (
        <>
          {/* Month/Year nav */}
          <div className="flex items-center justify-between mb-1.5">
            <button
              type="button"
              onClick={nextMonth}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-text-secondary transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            {/* Clickable month/year label */}
            <button
              type="button"
              onClick={() => setViewMode("months")}
              className="text-sm font-heading text-text-primary hover:bg-white/[0.06] px-3 py-1 rounded-lg transition-colors"
            >
              {HEBREW_MONTHS[viewMonth]} {viewYear}
            </button>

            <button
              type="button"
              onClick={prevMonth}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-text-secondary transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-px mb-0.5">
            {HEBREW_DAYS.map((d) => (
              <div key={d} className="text-center text-[9px] font-body text-text-secondary py-0.5">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-px">
            {cells.map((day, i) =>
              day === null ? (
                <div key={`empty-${i}`} />
              ) : (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDay(day)}
                  className={`
                    w-full aspect-square flex items-center justify-center rounded-md text-[11px] font-body transition-colors
                    ${isSelected(day)
                      ? "bg-emerald-600 text-white font-medium"
                      : isToday(day)
                        ? "bg-emerald-500/10 text-emerald-400 font-medium"
                        : "text-text-primary hover:bg-white/[0.06]"
                    }
                  `}
                >
                  {day}
                </button>
              )
            )}
          </div>

          {/* Clear / Today shortcuts */}
          <div className="flex gap-2 mt-1.5 pt-1.5 border-t border-white/[0.05]">
            <button
              type="button"
              onClick={() => { onChange(toDateStr(today.getFullYear(), today.getMonth(), today.getDate())); setOpen(false); setViewMode("days"); }}
              className="flex-1 py-1.5 text-xs font-body text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
            >
              היום
            </button>
            {value && (
              <button
                type="button"
                onClick={() => { onChange(""); setOpen(false); setViewMode("days"); }}
                className="flex-1 py-1.5 text-xs font-body text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                נקה
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Year navigation */}
          <div className="flex items-center justify-between mb-1.5">
            <button
              type="button"
              onClick={() => setViewYear(viewYear + 1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-text-secondary transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <span className="text-sm font-heading text-text-primary">
              {viewYear}
            </span>

            <button
              type="button"
              onClick={() => setViewYear(viewYear - 1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-text-secondary transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-3 gap-1">
            {HEBREW_MONTHS.map((name, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => selectMonth(idx)}
                className={`
                  py-2 rounded-lg text-[11px] font-body transition-colors
                  ${idx === viewMonth && viewYear === (parsed?.year ?? today.getFullYear())
                    ? "bg-emerald-600 text-white font-medium"
                    : idx === today.getMonth() && viewYear === today.getFullYear()
                      ? "bg-emerald-500/10 text-emerald-400 font-medium"
                      : "text-text-primary hover:bg-white/[0.06]"
                  }
                `}
              >
                {name}
              </button>
            ))}
          </div>

          {/* Back to days */}
          <div className="mt-2 pt-2 border-t border-white/[0.05]">
            <button
              type="button"
              onClick={() => setViewMode("days")}
              className="w-full py-1.5 text-xs font-body text-text-secondary hover:bg-white/[0.06] rounded-lg transition-colors"
            >
              חזור ללוח שנה
            </button>
          </div>
        </>
      )}
    </div>,
    document.body
  );

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={handleOpen}
        className="w-full bg-surface-raised border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm font-body text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-transparent flex items-center justify-between"
      >
        <span className={displayValue ? "text-text-primary" : "text-gray-500"}>
          {displayValue || placeholder}
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary flex-shrink-0">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>

      {/* Rendered via portal to escape overflow:hidden containers */}
      {dropdown}
    </div>
  );
}
