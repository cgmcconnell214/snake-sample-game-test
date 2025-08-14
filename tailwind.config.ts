import type { Config } from "tailwindcss";
import animatePlugin from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
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
          playfair: ["Playfair Display", "serif"],
          inter: ["Inter", "sans-serif"],
        },
        colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        buy: "hsl(var(--buy))",
        sell: "hsl(var(--sell))",
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        divine: {
          gold: "hsl(var(--divine-gold))",
          "gold-foreground": "hsl(var(--divine-gold-foreground))",
          "gold-light": "hsl(var(--divine-gold-light))",
          "gold-dark": "hsl(var(--divine-gold-dark))",
          white: "hsl(var(--ethereal-white))",
          blue: "hsl(var(--deep-blue))",
          dark: "hsl(var(--sacred-dark))",
          medium: "hsl(var(--sacred-medium))",
        },
        luxury: {
          purple: "hsl(var(--luxury-purple))",
          emerald: "hsl(var(--luxury-emerald))",
        },
        "gradient-divine": "var(--gradient-divine)",
        "gradient-sacred": "var(--gradient-sacred)",
        "gradient-ethereal": "var(--gradient-ethereal)",
        "gradient-hero": "var(--gradient-hero)",
        "gradient-luxury": "var(--gradient-luxury)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "fade-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(30px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "fade-in": {
          "0%": {
            opacity: "0",
          },
          "100%": {
            opacity: "1",
          },
        },
        "scale-in": {
          "0%": {
            opacity: "0",
            transform: "scale(0.95)",
          },
          "100%": {
            opacity: "1",
            transform: "scale(1)",
          },
        },
        float: {
          "0%, 100%": {
            transform: "translateY(0px)",
          },
          "50%": {
            transform: "translateY(-10px)",
          },
        },
        glow: {
          "0%": {
            boxShadow: "0 0 20px hsl(var(--divine-gold) / 0.3)",
          },
          "100%": {
            boxShadow: "0 0 40px hsl(var(--divine-gold) / 0.6)",
          },
        },
        shimmer: {
          "0%": {
            backgroundPosition: "-200% 0",
          },
          "100%": {
            backgroundPosition: "200% 0",
          },
        },
      },
      boxShadow: {
        divine: "var(--shadow-divine)",
        sacred: "var(--shadow-sacred)",
        ethereal: "var(--shadow-ethereal)",
        luxury: "var(--shadow-luxury)",
      },
      backgroundImage: {
        "gradient-divine": "var(--gradient-divine)",
        "gradient-sacred": "var(--gradient-sacred)",
        "gradient-ethereal": "var(--gradient-ethereal)",
        "gradient-hero": "var(--gradient-hero)",
        "gradient-luxury": "var(--gradient-luxury)",
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-up": "fade-up 0.6s ease-out",
        "fade-in": "fade-in 0.8s ease-out",
        "scale-in": "scale-in 0.5s ease-out",
        float: "float 3s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "shimmer": "shimmer 1.5s ease-in-out infinite",
      },
      keyframes: {
        ...{
          "accordion-down": {
            from: {
              height: "0",
            },
            to: {
              height: "var(--radix-accordion-content-height)",
            },
          },
          "accordion-up": {
            from: {
              height: "var(--radix-accordion-content-height)",
            },
            to: {
              height: "0",
            },
          },
          "fade-up": {
            "0%": {
              opacity: "0",
              transform: "translateY(30px)",
            },
            "100%": {
              opacity: "1",
              transform: "translateY(0)",
            },
          },
          "fade-in": {
            "0%": {
              opacity: "0",
            },
            "100%": {
              opacity: "1",
            },
          },
          "scale-in": {
            "0%": {
              opacity: "0",
              transform: "scale(0.95)",
            },
            "100%": {
              opacity: "1",
              transform: "scale(1)",
            },
          },
          float: {
            "0%, 100%": {
              transform: "translateY(0px)",
            },
            "50%": {
              transform: "translateY(-10px)",
            },
          },
          glow: {
            "0%": {
              boxShadow: "0 0 20px hsl(var(--divine-gold) / 0.3)",
            },
            "100%": {
              boxShadow: "0 0 40px hsl(var(--divine-gold) / 0.6)",
            },
          },
          shimmer: {
            "0%": {
              backgroundPosition: "-200% 0",
            },
            "100%": {
              backgroundPosition: "200% 0",
            },
          },
        }
      },
    },
  },
  plugins: [animatePlugin],
} satisfies Config;
