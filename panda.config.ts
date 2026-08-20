import { defineConfig, defineRecipe } from "@pandacss/dev";

// Design system ported from naporin0624/Cannelloni (neo-brutalist / "terminal-print"):
// sharp corners (none/pill only), 1-2px ink borders, monospace UI labels, one electric-blue
// accent, marching-ants focus ring. Tokens/semanticTokens are copied verbatim from the
// source of truth (Cannelloni's panda.config.ts). The Electron app-shell rules
// (`#root { position: fixed }`, `overflow: hidden` window lock) are dropped — this is a
// Chrome extension popup, not a fixed-viewport desktop shell.

const linkRecipe = defineRecipe({
  className: "link",
  base: {
    borderRadius: "none",
    transitionProperty: "background-color, color",
    transitionDuration: "fast",
    transitionTimingFunction: "stepSnap",
  },
  variants: {
    tone: {
      accent: { color: "accent.text" },
      muted: { color: "fg.muted" },
      default: { color: "fg.default" },
      subtle: { color: "fg.subtle" },
      inherit: { color: "inherit" },
    },
    underline: {
      true: { textDecorationLine: "underline", textUnderlineOffset: "2px" },
      false: { textDecorationLine: "none" },
    },
    hideOutsideFocusRing: {
      false: { _focusVisible: { layerStyle: "focusRing" } },
      true: {},
    },
  },
  defaultVariants: { tone: "accent", underline: true, hideOutsideFocusRing: false },
});

export default defineConfig({
  preflight: true,
  jsxFramework: "react",
  include: ["./components/**/*.{ts,tsx}", "./entrypoints/**/*.{ts,tsx}"],
  exclude: [],
  outdir: "styled-system",
  globalCss: {
    "html, body": {
      backgroundColor: "bg.canvas",
      color: "fg.default",
      fontFamily: "body",
      colorScheme: "dark",
      lineHeight: "body",
    },
    body: { margin: "0" },
    // marching-ants dashed-blue focus ring (signature). Uses the bright dark-accent primitive.
    "*:focus-visible": { outlineStyle: "none", position: "relative" },
    "*:focus-visible::after": {
      content: '""',
      position: "absolute",
      inset: "-3px",
      pointerEvents: "none",
      backgroundImage:
        "repeating-linear-gradient(90deg, var(--colors-neon-blue) 0 4px, transparent 4px 8px), repeating-linear-gradient(90deg, var(--colors-neon-blue) 0 4px, transparent 4px 8px), repeating-linear-gradient(0deg, var(--colors-neon-blue) 0 4px, transparent 4px 8px), repeating-linear-gradient(0deg, var(--colors-neon-blue) 0 4px, transparent 4px 8px)",
      backgroundSize: "8px 2px, 8px 2px, 2px 8px, 2px 8px",
      backgroundPosition: "0 0, 0 100%, 0 0, 100% 0",
      backgroundRepeat: "repeat-x, repeat-x, repeat-y, repeat-y",
      animation: "marchingAnts 0.6s linear infinite",
    },
    "@media (prefers-reduced-motion: reduce)": {
      "*:focus-visible::after": { animation: "none" },
    },
  },
  theme: {
    extend: {
      recipes: { link: linkRecipe },
      keyframes: {
        marchingAnts: { to: { backgroundPosition: "8px 0, -8px 100%, 0 -8px, 100% 8px" } },
        spin: { to: { transform: "rotate(360deg)" } },
        oscFlash: { "0%": { opacity: "0.35" }, "100%": { opacity: "0" } },
        automationFade: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
      },
      layerStyles: {
        focusRing: {
          value: {
            outlineWidth: "default",
            outlineStyle: "dashed",
            outlineColor: "accent.solid",
            outlineOffset: "3px",
            borderRadius: "none",
          },
        },
      },
      tokens: {
        colors: {
          white: { value: "oklch(1 0 0)" },
          black: { value: "oklch(0 0 0)" },
          gray: {
            1: { value: "oklch(0.952 0.004 265)" },
            2: { value: "oklch(0.934 0.005 265)" },
            3: { value: "oklch(0.918 0.005 265)" },
            4: { value: "oklch(0.900 0.006 265)" },
            5: { value: "oklch(0.884 0.007 265)" },
            6: { value: "oklch(0.845 0.008 265)" },
            7: { value: "oklch(0.785 0.010 265)" },
            8: { value: "oklch(0.700 0.013 265)" },
            9: { value: "oklch(0.560 0.016 265)" },
            10: { value: "oklch(0.510 0.017 265)" },
            11: { value: "oklch(0.430 0.018 265)" },
            12: { value: "oklch(0.185 0.020 265)" },
          },
          // digicore neons (saturated, AA-verified on the dark canvas)
          neon: {
            blue: { value: "oklch(0.700 0.235 260)" }, // primary accent — 6.23:1 on canvas
            blueHover: { value: "oklch(0.650 0.235 260)" },
            cyan: { value: "oklch(0.820 0.130 200)" }, // secondary (slider fills) — 11.3:1 on canvas
            magenta: { value: "oklch(0.700 0.250 340)" }, // accent pop
            lime: { value: "oklch(0.860 0.200 150)" },
            orange: { value: "oklch(0.780 0.160 60)" }, // cue A — ~9:1 on canvas
          },
          red: {
            solid: { value: "oklch(0.520 0.200 25)" }, // danger fill — light text 5.52:1
            text: { value: "oklch(0.650 0.250 25)" }, // danger outline text — 4.98:1 on canvas
          },
          // dark surfaces — neutral black (chroma 0, no purple tint); lightness preserved
          dark: {
            canvas: { value: "oklch(0.180 0 0)" },
            subtle: { value: "oklch(0.225 0 0)" },
            muted: { value: "oklch(0.270 0 0)" },
            emphasis: { value: "oklch(0.300 0 0)" },
            borderSubtle: { value: "oklch(0.380 0 0)" },
            border: { value: "oklch(0.520 0 0)" }, // 3.41:1 on canvas — meets WCAG 1.4.11 (3:1)
            borderStrong: { value: "oklch(0.620 0 0)" },
          },
        },
        fonts: {
          // system/Google approximations of the reference's Adobe faces (no @fontsource bundling)
          body: {
            value: 'system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", sans-serif',
          },
          display: {
            value: 'system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", sans-serif',
          },
          mono: {
            value: 'system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", sans-serif',
          },
        },
        fontSizes: {
          "2xs": { value: "0.6875rem" },
          xs: { value: "0.75rem" },
          sm: { value: "0.875rem" },
          md: { value: "1rem" },
          lg: { value: "1.1875rem" },
          xl: { value: "1.4375rem" },
        },
        lineHeights: {
          none: { value: "0.9" },
          tight: { value: "1.2" },
          snug: { value: "1.4" },
          body: { value: "1.7" },
          jp: { value: "1.9" },
        },
        fontWeights: {
          normal: { value: "400" },
          medium: { value: "500" },
          semibold: { value: "600" },
          bold: { value: "700" },
        },
        letterSpacings: {
          tighter: { value: "-0.04em" },
          tight: { value: "-0.02em" },
          normal: { value: "0" },
          wide: { value: "0.04em" },
          wider: { value: "0.12em" },
        },
        // sharp corners are the signature: map the small radii the SP5 components use to 0
        radii: {
          none: { value: "0" },
          xs: { value: "0" },
          sm: { value: "0" },
          md: { value: "0" },
          lg: { value: "0" },
          full: { value: "9999px" },
          pill: { value: "9999px" },
        },
        borderWidths: {
          none: { value: "0" },
          hairline: { value: "1px" },
          default: { value: "1px" },
          strong: { value: "2px" },
        },
        sizes: {
          targetMin: { value: "24px" },
          targetComfortable: { value: "44px" },
          headerHeight: { value: "72px" },
        },
        opacity: { disabled: { value: "0.5" }, overlay: { value: "0.8" } },
        durations: {
          instant: { value: "0ms" },
          fast: { value: "90ms" },
          base: { value: "150ms" },
          snap: { value: "180ms" },
          slow: { value: "280ms" },
        },
        easings: {
          linear: { value: "linear" },
          step1: { value: "steps(1)" },
          stepSnap: { value: "steps(3, end)" },
        },
      },
      semanticTokens: {
        colors: {
          // napochaan semantic structure — DARK
          bg: {
            canvas: { value: "{colors.dark.canvas}" },
            subtle: { value: "{colors.dark.subtle}" },
            muted: { value: "{colors.dark.muted}" },
            emphasis: { value: "{colors.dark.emphasis}" },
          },
          fg: {
            default: { value: "{colors.gray.1}" },
            muted: { value: "{colors.gray.6}" },
            subtle: { value: "{colors.gray.8}" },
            onSolid: { value: "{colors.dark.canvas}" }, // dark text on the bright neon accent
            onDanger: { value: "{colors.gray.1}" }, // light text on the darker danger fill
          },
          border: {
            subtle: { value: "{colors.dark.borderSubtle}" },
            default: { value: "{colors.dark.border}" },
            strong: { value: "{colors.dark.borderStrong}" },
            focus: { value: "{colors.neon.blue}" },
          },
          overlay: { value: "oklch(0.180 0 0 / 0.6)" },
          accent: {
            solid: { value: "{colors.neon.blue}" },
            solidHover: { value: "{colors.neon.blueHover}" },
            text: { value: "{colors.neon.blue}" },
            border: { value: "{colors.neon.blue}" },
            alt: { value: "{colors.neon.cyan}" }, // secondary neon — slider fills
          },
          danger: {
            solid: { value: "{colors.red.solid}" },
            solidHover: { value: "{colors.red.solid}" },
            text: { value: "{colors.red.text}" },
            border: { value: "{colors.red.text}" },
            spot: { value: "{colors.red.text}" },
          },
          cue: {
            a: { value: "{colors.neon.orange}" },
            b: { value: "{colors.neon.cyan}" },
            c: { value: "{colors.neon.magenta}" },
            d: { value: "{colors.neon.lime}" },
          },
        },
        spacing: {
          inline: { value: "{spacing.2}" },
          element: { value: "{spacing.3}" },
          block: { value: "{spacing.6}" },
          section: { value: "{spacing.12}" },
          page: { value: "{spacing.6}" },
        },
      },
    },
  },
});
