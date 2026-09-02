import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        heading: ['Plus Jakarta Sans', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
        body: ['DM Sans', 'Inter', 'sans-serif'],
        sans: ['DM Sans', 'Inter', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        surface: "var(--surface, #f1f5f9)",
        ink: {
          DEFAULT: "var(--ink, #032859)",
          foreground: "var(--ink-foreground, #ffffff)",
        },
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          dark: "var(--primary-dark, #011C40)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
          soft: "var(--primary-soft, #eaf0f8)",
          "soft-foreground": "var(--primary-soft-foreground, #032859)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          dark: "var(--secondary-dark, #e2e8f0)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
          soft: "var(--secondary-soft, #f8fafc)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          dark: "var(--accent-dark, #A60F1B)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
          soft: "var(--accent-soft, #fdf0f1)",
          "soft-foreground": "var(--accent-soft-foreground, #BF1523)",
        },
        success: {
          DEFAULT: "var(--success, #16a34a)",
          foreground: "var(--success-foreground, #ffffff)",
          soft: "var(--success-soft, #f0fdf4)",
          "soft-foreground": "var(--success-soft-foreground, #15803d)",
        },
        warning: {
          DEFAULT: "var(--warning, #d97706)",
          foreground: "var(--warning-foreground, #ffffff)",
          soft: "var(--warning-soft, #fff7ed)",
          "soft-foreground": "var(--warning-soft-foreground, #b45309)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
          soft: "var(--destructive-soft, #fef2f2)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-foreground) / <alpha-value>)",
          primary: "hsl(var(--sidebar-primary) / <alpha-value>)",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground) / <alpha-value>)",
          accent: "hsl(var(--sidebar-accent) / <alpha-value>)",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground) / <alpha-value>)",
          border: "hsl(var(--sidebar-border) / <alpha-value>)",
          ring: "hsl(var(--sidebar-ring) / <alpha-value>)",
        },
      },
      borderRadius: {
        sm: "calc(var(--radius) - 4px)",
        md: "calc(var(--radius) - 2px)",
        lg: "var(--radius)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
        "3xl": "calc(var(--radius) + 12px)",
        "4xl": "calc(var(--radius) + 16px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-gentle": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.7", transform: "scale(1.15)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-gentle": "pulse-gentle 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
