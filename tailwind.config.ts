import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#E6F4FB",
        surface: "rgba(255,255,255,0.55)",
        accent: "#1E78A8",
        success: "#1E8A56",
        highlight: "#F26B6F",
        text: "#0B2A3E",
        badge: "#F26B6F",
        shell: "#F26B6F",
        shellHi: "#FFA8AB",
        shellLo: "#B8383D",
        shellInk: "#3A0A0D",
        ink: "#0B2A3E",
        inkSoft: "#2F5670",
        inkMute: "#5B7E97",
        glassDeep: "#1E5A82",
        glassMid: "#5BA8D4",
        glassLite: "#B7E1F5",
        glassHaze: "#E6F4FB",
        // Remap slate to ink tones — secondary text stays readable on the
        // light-blue glass screen without touching every component.
        slate: {
          100: "#0B2A3E",
          200: "#13354D",
          300: "#2F5670",
          400: "#4A718B",
          500: "#5B7E97"
        }
      },
      fontFamily: {
        sans: ["VT323", "ui-monospace", "monospace"],
        display: ["'Press Start 2P'", "VT323", "monospace"]
      },
      boxShadow: {
        card: "0 8px 24px -12px rgba(11,42,62,0.45), 0 0 0 1px rgba(11,42,62,0.18)",
        glow: "0 0 0 2px rgba(108,207,246,0.6), 0 0 32px -4px rgba(108,207,246,0.5)"
      }
    }
  },
  plugins: []
};
export default config;
