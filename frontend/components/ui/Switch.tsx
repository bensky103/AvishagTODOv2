"use client";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  id?: string;
}

export function Switch({ checked, onChange, disabled = false, label, id }: SwitchProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      id={id}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      onKeyDown={handleKeyDown}
      className={`
        relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full
        transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40
        ${disabled
          ? "cursor-not-allowed bg-white/10"
          : checked
            ? "bg-emerald-500 cursor-pointer"
            : "bg-white/20 cursor-pointer"
        }
      `}
    >
      <span
        className={`
          inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200
          ${checked ? "translate-x-4" : "translate-x-0.5"}
          ${disabled ? "opacity-40" : ""}
        `}
      />
    </button>
  );
}
