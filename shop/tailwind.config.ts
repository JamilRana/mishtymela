import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
          hover: "var(--primary-hover)",
        },
        success: {
          DEFAULT: "var(--success)",
          foreground: "var(--success-foreground)",
          light: "var(--success-light)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          foreground: "var(--warning-foreground)",
          light: "var(--warning-light)",
        },
        danger: {
          DEFAULT: "var(--danger)",
          foreground: "var(--danger-foreground)",
          light: "var(--danger-light)",
        },
      },
      borderRadius: {
        DEFAULT: "6px",
        sm: "4px",
        md: "6px",
        lg: "8px",
      },
      fontSize: {
        "2xs": ["0.8125rem", { lineHeight: "1.25rem" }], // 13px - sharp micro labels
        xs: ["0.875rem", { lineHeight: "1.375rem" }],    // 14px - crisp & legible on mobile screens
        sm: ["0.9375rem", { lineHeight: "1.45rem" }],    // 15px - optimal mobile reading size
        base: ["1.0625rem", { lineHeight: "1.6rem" }],   // 17px - comfortable body copy
        lg: ["1.1875rem", { lineHeight: "1.75rem" }],   // 19px
        xl: ["1.375rem", { lineHeight: "1.875rem" }],   // 22px
        "2xl": ["1.625rem", { lineHeight: "2.125rem" }],// 26px
        "3xl": ["2rem", { lineHeight: "2.5rem" }],      // 32px
        "4xl": ["2.5rem", { lineHeight: "2.875rem" }],  // 40px
      },
    },
  },
  plugins: [],
};

export default config;
