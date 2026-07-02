import type { Config } from "tailwindcss";

const config: Config = {
  // Tailwind v4 primarily uses CSS @theme for configuration.
  // This file is kept for compatibility and explicit semantic color mapping.
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
        accent: "var(--color-accent)",
        "accent-foreground": "#ffffff",
        muted: "var(--midnight-700)",
        "muted-foreground": "var(--text-400)",
        card: "var(--card)",
        "card-foreground": "var(--text-100)",
        border: "var(--border)",
      },
    },
  },
};

export default config;
