import type { Config } from "tailwindcss";
import preset from "@fitmeals/config/tailwind.preset";

const config: Config = {
  presets: [preset as Config],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        kcal: ["var(--font-kcal)", "system-ui", "sans-serif"],
      },
      colors: {
        kcal: {
          splash: "#94C68D",
          sage: "#96C98D",
          "sage-dark": "#7AB370",
          coral: "#FF9180",
          "coral-soft": "#FF9F8E",
          "coral-muted": "#FFD4CC",
          charcoal: "#2D2D2D",
          muted: "#808080",
          cream: "#FFF8F0",
          peach: "#FFE8DC",
          mint: "#E8F5E4",
          yellow: "#FFF9E0",
          purple: "#C4B5FD",
          "purple-deep": "#8B7FD8",
        },
      },
      borderRadius: {
        kcal: "1.5rem",
        "kcal-lg": "2rem",
        "kcal-xl": "2rem",
        pill: "9999px",
      },
      boxShadow: {
        kcal: "0 4px 24px -4px rgba(150, 201, 141, 0.2)",
        "kcal-float": "0 8px 28px -6px rgba(0, 0, 0, 0.1)",
      },
      maxWidth: {
        kcal: "28rem",
      },
    },
  },
};

export default config;
