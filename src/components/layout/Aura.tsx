import type { ReactNode } from "react";

/**
 * System-aware background aura.
 *
 *   Light mode  →  Soft Mesh (teal lattice on warm cream)
 *   Dark mode   →  Aurora Beams (grey/white light rays on #100e0b)
 *
 * Purely decorative. Zero JS. Reads prefers-color-scheme via Tailwind's
 * `dark:` variant (darkMode: 'media').
 *
 * Structure:
 *   - Fixed-position backdrop covering the viewport, so the glow stays
 *     anchored to the screen and never scrolls out of view.
 *   - Content stacks on top with z-index 10.
 */
export default function Aura({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[#faf8f2] dark:bg-[#100e0b]">
      {/* ─── FIXED BACKDROP ───────────────────────────────── */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none -z-0 overflow-hidden"
      >
        {/* ═══════════════════════════════════════════════════
            LIGHT THEME — Soft Mesh
            ═══════════════════════════════════════════════════ */}
        <div className="dark:hidden absolute inset-0">
          {/* Layer 1 — soft grid */}
          <div
            className="absolute inset-0 opacity-80"
            style={{
              background:
                "linear-gradient(rgba(20,184,166,0.08) 1px, transparent 1px), " +
                "linear-gradient(90deg, rgba(20,184,166,0.08) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
          {/* Layer 2 — teal center glow */}
          <div
            className="absolute inset-0 blur-[163px] md:blur-[234px]"
            style={{
              background:
                "radial-gradient(ellipse 60% 45% at 48% 45%, rgba(45,212,191,0.22) 0%, transparent 75%)",
            }}
          />
          {/* Layer 3 — sky corner glow */}
          <div
            className="absolute inset-0 blur-[125px] md:blur-[180px]"
            style={{
              background:
                "radial-gradient(circle at 75% 25%, rgba(125,211,252,0.18) 0%, transparent 35%)",
            }}
          />
        </div>

        {/* ═══════════════════════════════════════════════════
            DARK THEME — Aurora Beams
            ═══════════════════════════════════════════════════ */}
        <div className="hidden dark:block absolute inset-0">
          {/* Layer 1 — soft teal glow rising from the bottom center */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(55.8% 55.49% at 50% 100%, " +
                "rgb(38, 77, 76) 0%, " +
                "rgba(25, 48, 47, 0) 100%)",
              mixBlendMode: "screen",
            }}
          />

          {/* Layer 2 — angled grey/white beams */}
          <div
            className="absolute inset-0 blur-[75px] md:blur-[108px] opacity-90"
            style={{
              background: [
                "repeating-linear-gradient(" +
                  "100deg, " +
                  "#262626 0%, " +
                  "#262626 3%, " +
                  "rgba(38, 38, 38, 0.7) 5%, " +
                  "rgba(38, 38, 38, 0.7) 7%, " +
                  "transparent 10%, " +
                  "transparent 12%, " +
                  "rgba(38, 38, 38, 0.7) 14%, " +
                  "#262626 16%" +
                ")",
                "repeating-linear-gradient(" +
                  "100deg, " +
                  "#9ca3af 0%, " +
                  "#9ca3af 1.5%, " +
                  "rgba(156, 163, 175, 0.8) 2%, " +
                  "#6b7280 3%, " +
                  "#6b7280 4%, " +
                  "rgba(156, 163, 175, 0.8) 4.5%, " +
                  "#9ca3af 5%" +
                ")",
              ].join(", "),
              backgroundSize: "300% 200%",
              mixBlendMode: "screen",
            }}
          />

          {/* Layer 3 — bottom-right dark falloff */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 100% 100%, " +
                "#ffffff 20%, " +
                "#0a0a0a 80%)",
              mixBlendMode: "multiply",
            }}
          />
        </div>
      </div>

      {/* ─── CONTENT ───────────────────────────────────────── */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}