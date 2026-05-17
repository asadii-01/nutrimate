/**
 * NutriMate Tailwind theme.
 *
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Surfaces & background
        surface: "#f8f9ff",
        "surface-dim": "#cbdbf5",
        "surface-bright": "#f8f9ff",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#eff4ff",
        "surface-container": "#e5eeff",
        "surface-container-high": "#dce9ff",
        "surface-container-highest": "#d3e4fe",
        "surface-variant": "#d3e4fe",
        "surface-tint": "#006e2d",
        background: "#f8f9ff",
        "on-surface": "#0b1c30",
        "on-surface-variant": "#3e4a3d",
        "on-background": "#0b1c30",
        "inverse-surface": "#213145",
        "inverse-on-surface": "#eaf1ff",
        // Outlines
        outline: "#6e7b6c",
        "outline-variant": "#bdcaba",
        // Primary — Fresh Leaf Green (health, CTAs, progress)
        primary: "#006b2c",
        "on-primary": "#ffffff",
        "primary-container": "#00873a",
        "on-primary-container": "#f7fff2",
        "inverse-primary": "#62df7d",
        "primary-fixed": "#7ffc97",
        "primary-fixed-dim": "#62df7d",
        "on-primary-fixed": "#002109",
        "on-primary-fixed-variant": "#005320",
        // Secondary — Warm Orange (calories, motivation)
        secondary: "#9d4300",
        "on-secondary": "#ffffff",
        "secondary-container": "#fd761a",
        "on-secondary-container": "#5c2400",
        "secondary-fixed": "#ffdbca",
        "secondary-fixed-dim": "#ffb690",
        "on-secondary-fixed": "#341100",
        "on-secondary-fixed-variant": "#783200",
        // Tertiary — Calm Blue (hydration, info)
        tertiary: "#0058be",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#2170e4",
        "on-tertiary-container": "#fefcff",
        "tertiary-fixed": "#d8e2ff",
        "tertiary-fixed-dim": "#adc6ff",
        "on-tertiary-fixed": "#001a42",
        "on-tertiary-fixed-variant": "#004395",
        // Error
        error: "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
      },
      fontFamily: {
        sans: [
          "Plus Jakarta Sans",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      fontSize: {
        "display-lg": ["40px", { lineHeight: "48px", letterSpacing: "-0.02em", fontWeight: "800" }],
        "headline-lg": [
          "32px",
          { lineHeight: "40px", letterSpacing: "-0.01em", fontWeight: "700" },
        ],
        "headline-lg-mobile": ["28px", { lineHeight: "36px", fontWeight: "700" }],
        "headline-md": ["24px", { lineHeight: "32px", fontWeight: "700" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "label-md": ["14px", { lineHeight: "20px", letterSpacing: "0.05em", fontWeight: "600" }],
        caption: ["12px", { lineHeight: "16px", fontWeight: "500" }],
      },
      spacing: {
        // 4px / 8px baseline grid (DESIGN.md "Layout & Spacing")
        base: "4px",
        xs: "8px",
        sm: "16px",
        md: "24px",
        lg: "32px",
        xl: "48px",
        gutter: "16px",
        "margin-mobile": "20px",
      },
      borderRadius: {
        sm: "0.25rem",
        DEFAULT: "0.5rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.5rem",
        full: "9999px",
      },
      maxWidth: {
        "container-max": "1200px",
      },
      boxShadow: {
        // Level 1 — cards / surfaces
        card: "0px 4px 20px rgba(15, 23, 42, 0.05)",
        // Level 2 — active / floating (nav bars, FAB)
        floating: "0px 10px 25px rgba(15, 23, 42, 0.1)",
        // Level 2 inverted — bottom navigation bar
        nav: "0px -10px 25px rgba(15, 23, 42, 0.1)",
      },
      transitionTimingFunction: {
        squish: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [],
};
