import type { Config } from "tailwindcss";
import preset from "@fitmeals/config/tailwind.preset";

const config: Config = {
  presets: [preset as Config],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        admin: {
          navy: "#0B1120",
          "navy-panel": "#0f172a",
          orange: "#F2990D",
          "orange-hover": "#e68a00",
          canvas: "#eef2f6",
          "input-bg": "#E8F0FE",
        },
      },
    },
  },
};

export default config;
