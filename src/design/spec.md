# Clinic Clarity — Design Language v2

> Procare Software SaaS — medical clinic management platform
> Theme: flat, compact, no-shadow, clinical teal

---

## Core Philosophy

**Flat & Clinical.** Depth is communicated through **1px borders** and **tinted background planes** — never through box shadows. This keeps the interface legible, fast-rendering, and professional on all screen densities.

**Compact density.** Clinical workflows demand more information in less space. Default font size is `13px` (not 16px). Inputs are `32px` tall. The sidebar is `220px` wide. The header is `48px` tall.

---

## Brand Colors

| Role | Token | Hex | Usage |
|------|-------|-----|-------|
| Primary | `teal-700` | `#0f766e` | Actions, active states, links |
| Primary hover | `teal-600` | `#0d9488` | Hover/focus states |
| Primary light | `teal-100` | `#ccfbf1` | Tinted active backgrounds |
| Secondary | `health-600` | `#16a34a` | Positive/confirm actions |
| Warning | `saffron-600` | `#d97706` | Alerts, attention |
| Danger | `rose-600` | `#e11d48` | Errors, destructive actions |
| Neutral | `mountain` scale | slate | UI chrome, text, borders |

---

## Surfaces

All surfaces use border-based separation instead of shadows.

| Surface | Background | Border |
|---------|-----------|--------|
| App background | `bg-slate-50` (`#f8fafc`) | — |
| Cards & panels | `bg-white` | `border border-slate--200` |
| Sidebar | `bg-content1` | `border-r border-divider` |
| Header | `bg-background` | `border-b border-divider` |
| Elevated overlays (modals) | `bg-white` | `border border-divider rounded-md` |
| Table striping | `bg-slate-50` on hover | `border-b border-divider` per row |

**No shadows.** `box-shadow: none` everywhere. The `clarity-card`, `clarity-panel` CSS classes enforce this.

---

## Typography

| Element | Font | Size | Weight | Tracking |
|---------|------|------|--------|---------|
| Body / paragraphs | Plus Jakarta Sans | 13px (`base`) | 400 | -0.01em |
| Form labels | Plus Jakarta Sans | 12px (`sm`) | 500 | 0 |
| Column headers (tables) | Plus Jakarta Sans | 11px (`xs`) | 600 | +0.06em uppercase |
| Section labels | Plus Jakarta Sans | 11px (`xs`) | 600 | +0.07em uppercase |
| Page titles | Plus Jakarta Sans | 15px | 700 | -0.02em |
| Stat/KPI values | Plus Jakarta Sans | 22px | 700 | -0.03em |
| Nepali content | Noto Sans Devanagari | inherit | - | - |

---

## Layout

| Token | Value |
|-------|-------|
| Header height | `48px` (`h-12`) |
| Sidebar width | `220px` (`w-[220px]`) |
| Content padding | `px-4 py-3` |
| Card padding | `p-3` (compact) |
| Section gap | `gap-3` or `mb-3` |

---

## Components

### Buttons

```
clarity-btn              — base compact button (h-30px, px-3, text-xs)
clarity-btn-primary      — solid teal fill
clarity-btn-ghost        — border-only
clarity-btn-tinted       — teal-100 background, teal text
```

Use custom `Button` from `@/components/ui` with `size="sm"` throughout.

### Cards

```html
<div class="clarity-card p-3"> ... </div>
```

- `border: 1px solid var(--color-border)` 
- `border-radius: 0.375rem` (6px)
- **zero `box-shadow`**

### Inputs

- Height: `32px`
- Border: `1px solid var(--color-border)`
- Focus: `border-color: var(--color-border-focus)` + focus ring (no shadow on non-focus)
- Class: `clarity-input`

### Tables

- `clarity-table` class
- `th`: 11px, uppercase, `font-weight: 600`, border-bottom per column header
- `td`: 13px, `border-bottom: 1px solid border-var`, `py-1.5 px-3` padding
- Hover row: `bg-slate-50` (``var(--color-surface-2)``)

### Badges / Status Chips

- `clarity-badge` — 18px tall, 11px text, 3px radius, no shadow
- Semantic variants: use Tailwind color bg/text tokens (`bg-teal-100 text-teal-700`, etc.)

### Page Header Pattern

```html
<div class="clarity-page-header">
  <div>
    <h1 class="clarity-page-title">Patients</h1>
    <p class="clarity-page-subtitle">All registered patients</p>
  </div>
  <div class="flex gap-2">
    <!-- actions -->
  </div>
</div>
```

---

## Themes

| Theme ID | Theme name | Description |
|----------|-------------|-------------|
| `light` | Clarity | Default; teal primary, slate bg |
| `dark` | Clarity Dark | Zinc-950 bg, teal-400 accent |
| `rose-clinic` | Rose Clinic | Rose/fuchsia; warm feminine medical |
| `violet-clinical` | Violet Clinical | Deep violet; analytical/premium |
| `carbon-dark` | Carbon Dark | Near-black; ultra-focused night |
| `arctic` | Arctic | Sky-blue; crisp minimal |

Legacy themes (`medical`, `nature`, `ocean`, `sunset`) retained for backward compat.

---

## Color Variables (CSS)

All themes set these CSS custom properties on `:root`:

```css
--color-bg            /* App background */
--color-surface       /* Card/panel background */
--color-surface-2     /* Hover/alt-row surface */
--color-border        /* Default 1px border */
--color-border-focus  /* Active/focus border color */
--color-text          /* Primary text */
--color-text-muted    /* Secondary/muted text */
--color-primary       /* Primary brand color */
--color-primary-hover /* Hover state of primary */
--color-primary-light /* Tinted primary background */
--scrollbar-thumb, --scrollbar-track
```
