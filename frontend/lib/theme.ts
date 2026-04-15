/**
 * Shared color and layout tokens for inline styles.
 * Tailwind classes should be preferred where possible — use these only
 * where inline styles are required (gradients, box-shadows, dynamic opacity).
 *
 * All hex values here MUST match the Tailwind config in tailwind.config.ts.
 */

export const colors = {
  primary: "#14a87a",
  primaryDark: "#0a8963",
  primaryLight: "#5eead4",

  danger: "#ef4444",
  warning: "#f59e0b",
  success: "#22c55e",

  surface: "#1c1c22",
  base: "#151519",
  sidebarBg: "#111115",

  textWhite: "#fff",
  textMuted: "rgba(255,255,255,0.5)",
  textDefault: "rgba(255,255,255,0.75)",
  textHover: "rgba(255,255,255,0.9)",
  borderSubtle: "rgba(255,255,255,0.05)",
} as const;

/** Reusable gradient for brand elements (hero, FAB, brand logo, avatar). */
export const brandGradient = `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`;

/** Full hero gradient with 3 stops. */
export const heroGradient = `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 50%, #096e52 100%)`;

/** Tinted background helpers — use for icon boxes, badges, etc. */
export function tint(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}

/** KPI / badge accent map — maps variant names to theme colors. */
export const variantAccent: Record<string, string> = {
  default: colors.primary,
  danger: colors.danger,
  success: colors.primary,
  warning: colors.warning,
};

/** Sidebar layout constants */
export const SIDEBAR_WIDE = 240;
export const SIDEBAR_NARROW = 68;
