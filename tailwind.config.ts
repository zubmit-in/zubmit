import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          black: "#000000",
          white: "#f5f5f5",
          orange: "#e8722a",
          "orange-light": "#f4954e",
          amber: "#ffb830",
          gray: "#111111",
          "gray-light": "#1a1a1a",
        },
      },
      fontFamily: {
        inter: ["Inter", "sans-serif"],
        outfit: ["Inter", "sans-serif"],
        mono: ["DM Mono", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "fade-up": "fadeUp 0.6s ease-out",
        "slide-in": "slideIn 0.4s ease-out",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
        "gradient-x": "gradientX 3s ease infinite",
        "float": "float 4s ease-in-out infinite",
        "counter": "counter 2s ease-out",
        "shimmer": "shimmerLine 3s linear infinite",
        "spin-slow": "spin 8s linear infinite",
        "aurora1": "auroraDrift1 22s ease-in-out infinite alternate",
        "aurora2": "auroraDrift2 30s ease-in-out infinite alternate",
        "hero-float": "heroFloat 7s ease-in-out infinite",
        "dot-pulse": "dotPulse 1.5s ease-in-out infinite",
        "blink": "blink 0.8s ease-in-out infinite",
        "urgent-pulse": "urgentPulse 2s ease infinite",
        "border-sweep": "borderSweep 4s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-10px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(232, 114, 42, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(232, 114, 42, 0.6)" },
        },
        gradientX: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
