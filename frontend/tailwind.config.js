/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // ── Vanguard Design Tokens ─────────────────────────────────────────
        base:    "#030712",      // near-black canvas
        panel:   "#0f172a",      // card/panel background
        border:  "#1e293b",      // subtle borders
        accent:  "#3b82f6",      // primary blue
        teal:    "#06b6d4",      // secondary cyan
        danger:  "#ef4444",      // critical / error
        warn:    "#f59e0b",      // warning / medium
        success: "#10b981",      // success / fixed
        muted:   "#94a3b8",      // secondary text
        bright:  "#f1f5f9",      // primary text
      },
      fontFamily: {
        sans:  ["Space Grotesk", "system-ui", "sans-serif"],
        mono:  ["JetBrains Mono", "Fira Code", "monospace"],
      },
      animation: {
        "pulse-slow":   "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "ping-slow":    "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
        "fade-in":      "fadeIn 0.4s ease-out",
        "slide-in":     "slideIn 0.3s ease-out",
        "glow-pulse":   "glowPulse 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          from: { opacity: "0", transform: "translateX(-12px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 8px rgba(59,130,246,0.3)"  },
          "50%":      { boxShadow: "0 0 20px rgba(59,130,246,0.7)" },
        },
      },
      backgroundImage: {
        "grid-pattern": "linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)",
      },
      backgroundSize: {
        "grid": "40px 40px",
      },
    },
  },
  plugins: [],
}
