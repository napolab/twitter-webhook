---
name: cannelloni-design-system
description: Use when building or styling any UI in this repo (popup, options, injected content-script UI) — choosing color/spacing/typography tokens, writing styles.css.ts, creating a component directory, styling variants or states, or porting panda.config.ts. Also use before reading the Cannelloni repo for design reference.
---

# Cannelloni Design System

## Overview

This repo's UI copies the design system of the local repo
`/Users/napochaan/ghq/github.com/naporin0624/Cannelloni` (Electron, Panda CSS 1.11 + react-aria-components 1.20).

Style identity: **neo-brutalist / terminal-print, dark only**. Sharp corners (radius 0), 1px ink borders instead of shadows, neutral chroma-0 black canvas, one electric-blue accent, marching-ants focus ring, stepped (not smooth) motion.

**Source of truth is `panda.config.ts` in the Cannelloni repo.**
⚠️ `Cannelloni/.claude/rules/panda-css.md` is STALE — it lists tokens that no longer exist (`text.primary`, `bg.surface`, `state.*`, `shadows.glowAccent`). Never trust it for token names.

## Porting

Copy Cannelloni's `panda.config.ts` nearly verbatim. Keep: all tokens/semanticTokens, `globalCss` fonts, the `*:focus-visible::after` marching-ants ring, `layerStyles.focusRing`, keyframes, `colorScheme: 'dark'`. Drop: the `#root { position: fixed }` / `overflow: hidden` app-shell rules.

## Token quick reference

| Purpose                      | Token                                                                             | Value                                                              |
| ---------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| App background               | `bg.canvas`                                                                       | `oklch(0.180 0 0)`                                                 |
| Raised surfaces              | `bg.subtle` / `bg.muted` / `bg.emphasis`                                          | L 0.225 / 0.270 / 0.300, chroma 0                                  |
| Text                         | `fg.default` / `fg.muted` / `fg.subtle`                                           | gray.1 / gray.6 / gray.8 (hue 265)                                 |
| Text on accent / danger fill | `fg.onSolid` / `fg.onDanger`                                                      | dark canvas / gray.1                                               |
| Borders                      | `border.subtle` / `border.default` / `border.strong` / `border.focus`             | default = `oklch(0.520 0 0)` (3.41:1, WCAG 1.4.11 OK)              |
| Accent (only one)            | `accent.solid` / `solidHover` / `text` / `border`, `accent.alt` (cyan)            | electric blue `oklch(0.700 0.235 260)` (6.23:1 on canvas)          |
| Danger                       | `danger.solid` (fill) / `danger.text` / `border` / `spot`                         | fill `oklch(0.520 0.200 25)`, text `oklch(0.650 0.250 25)`         |
| Radii                        | `none/xs/sm/md/lg` → **all `0`**                                                  | only `full`/`pill` = 9999px (badge dots)                           |
| Border widths                | `hairline`/`default` 1px, `strong` 2px                                            | depth = borders, **no shadow tokens**                              |
| Motion                       | durations `fast 90ms`/`base 150ms`/`snap 180ms`, easing `stepSnap: steps(3, end)` | stepped, never smooth                                              |
| Fonts                        | `body`/`display`/`mono` = same LINE Seed JP stack                                 | `mono` is a _semantic_ marker for chrome/label text, not monospace |
| Font sizes                   | `2xs` 0.6875rem … `xl` 1.4375rem                                                  | labels `xs`/`sm` mono semibold, values `sm`/`md` body              |
| Spacing aliases              | `inline` 8 / `element` 12 / `block` 24 / `section` 48 / `page` 24                 | don't add new ones                                                 |
| Sizes                        | `targetMin` **24px** (standard target), `targetComfortable` 44px                  | high density is intentional                                        |

Density: `gap: '1'` (4px) and `gap: '2'` (8px) cover ~85% of gaps; 16px is an outlier. Rows: `minH: 'targetMin'`, `px: '2'`.

## Component conventions (hard rules)

- One component per kebab-case directory: `index.tsx` + `styles.css.ts` + `<name>.browser.test.tsx`.
- `import * as styles from './styles.css';` (namespace import mandatory). Root class is named `root` (never `container`/`wrapper`), sub-names ≤3 words.
- Styling = plain `css()` calls only. **No cva, no new recipes** (`linkRecipe` is the sole historical exception), no inline `style={{}}`.
- Variants/state = `data-*` attributes + attribute selectors: `'&[data-variant="solid"]': {...}`, `'&[data-selected]': {...}`.
- Allowed selectors: `&:hover`, `&:focus`, `&[data-*]`, `&::placeholder`, `&:nth-child()`. **No child selectors** (`& h3`).
- All interactive elements wrap react-aria-components; state styling hooks RAC's `data-focused`/`data-invalid`/`data-selected` (or `:focus-within`/`:has([aria-invalid])` on wrapper divs).
- Focus: `_focusVisible: { layerStyle: 'focusRing' }`. Hover: `transform: 'translate(3px, 3px)'` press-nudge with `stepSnap` (2px for small icon buttons) — never shadow/scale.
- `prefers-reduced-motion`: set `transitionDuration: 'instant'` / `animation: none`.

## Exemplars (in Cannelloni, under `src/renderer/src/components/`)

| Need                                                                                | File                                                                        |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Button (data-variant/size, incl. `danger`, `icon`)                                  | `ui/button/`                                                                |
| TextField (Label+Input+description+FieldError)                                      | `ui/text-field/`                                                            |
| Dialog / delete confirm                                                             | `ui/dialog/`, `ui/confirm-dialog/`                                          |
| Toggle (RAC `ToggleButton`, 24px square, `&[data-selected]` accent fill)            | `preset-row/` (`iconToggle` style)                                          |
| List row (name + meta + trailing icon actions, delete = `danger.text`)              | `library-pane/_components/playlist-list.tsx` + `library-pane/styles.css.ts` |
| Form stack (gap `element`, right-aligned action row gap `2`)                        | `library-pane/_components/rename-playlist-dialog.tsx`                       |
| Badge (dot = only `pill` use) / Toast / Icons (16px hand-rolled SVG, `aria-hidden`) | `ui/badge/`, `ui/toast/`, `ui/icons/`                                       |

## Common mistakes

- Rounding corners or adding box-shadows → use 1px borders and `bg.*` steps; hover ring = `outline: 2px solid accent.solid; outlineOffset: -3px`.
- Reaching for cva/recipes or conditional class strings → data attributes.
- Smooth `ease-in-out` transitions → `stepSnap` steps.
- 44px targets / 16px gaps everywhere → 24px targets, 4–8px gaps.
- Trusting `Cannelloni/.claude/rules/panda-css.md` token names → read `panda.config.ts`.
- Looking for a Switch component → none exists; style RAC `ToggleButton`.
