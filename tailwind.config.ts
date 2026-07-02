import type { Config } from "tailwindcss";

const config: Config = {
  // Tailwind v4 primarily uses CSS @theme for configuration.
  // This file is kept for compatibility and explicit semantic color mapping.
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
        primary: "var(--color-primary)",
        "primary-foreground": "var(--color-primary-foreground)",
        accent: "var(--color-accent)",
        "accent-foreground": "var(--color-accent-foreground)",
        muted: "var(--color-muted)",
        "muted-foreground": "var(--color-muted-foreground)",
        card: "var(--color-card)",
        "card-foreground": "var(--color-card-foreground)",
        border: "var(--color-border)",
      },
    },
  },
};

export default config;
