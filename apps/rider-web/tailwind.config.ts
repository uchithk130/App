import type { Config } from "tailwindcss";
import preset from "@fitmeals/config/tailwind.preset";

const config: Config = {
  presets: [preset as Config],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        rider: {
          yellow: "#F59E0B",
          amber: "#D97706",
          gold: "#B45309",
          surface: "#FFFBF0",
          card: "#FEF3C7",
        },
      },
    },
  },
};

export default config;
