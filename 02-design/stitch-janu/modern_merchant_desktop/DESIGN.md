---
name: Modern Merchant Desktop
colors:
  surface: '#f7f9fc'
  surface-dim: '#d8dadd'
  surface-bright: '#f7f9fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f7'
  surface-container: '#eceef1'
  surface-container-high: '#e6e8eb'
  surface-container-highest: '#e0e3e6'
  on-surface: '#191c1e'
  on-surface-variant: '#424754'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f4'
  outline: '#727786'
  outline-variant: '#c2c6d6'
  surface-tint: '#0059c8'
  primary: '#004db0'
  on-primary: '#ffffff'
  primary-container: '#0064e0'
  on-primary-container: '#e6ebff'
  inverse-primary: '#afc6ff'
  secondary: '#006b5b'
  on-secondary: '#ffffff'
  secondary-container: '#26fedc'
  on-secondary-container: '#007261'
  tertiary: '#505256'
  on-tertiary: '#ffffff'
  tertiary-container: '#686a6e'
  on-tertiary-container: '#eaebef'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d9e2ff'
  primary-fixed-dim: '#afc6ff'
  on-primary-fixed: '#001944'
  on-primary-fixed-variant: '#004299'
  secondary-fixed: '#26fedc'
  secondary-fixed-dim: '#00dfc1'
  on-secondary-fixed: '#00201a'
  on-secondary-fixed-variant: '#005144'
  tertiary-fixed: '#e1e2e7'
  tertiary-fixed-dim: '#c5c6cb'
  on-tertiary-fixed: '#191c1f'
  on-tertiary-fixed-variant: '#45474b'
  background: '#f7f9fc'
  on-background: '#191c1e'
  surface-variant: '#e0e3e6'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  container-max-width: 1440px
  columns: '12'
  gutter: 24px
  margin: 40px
  sidebar-width: 280px
  space-xs: 4px
  space-sm: 8px
  space-md: 16px
  space-lg: 24px
  space-xl: 32px
  space-xxl: 48px
---

## Brand & Style

This design system targets high-velocity commerce and digital entrepreneurship. The aesthetic is "Meta-inspired"—a blend of corporate reliability and optimistic energy. The UI evokes a sense of efficiency, clarity, and modern professionalism.

The design style is **Corporate / Modern** with a focus on high-clarity surfaces and soft, approachable geometry. It utilizes generous whitespace to reduce cognitive load on complex merchant dashboards, ensuring that even data-heavy views feel breathable and organized. Key characteristics include large radius containers, high-contrast primary actions, and a rigorous adherence to systematic alignment.

## Colors

The palette is anchored by **Cobalt Blue (#0064E0)**, used for primary actions, active states, and brand signifiers. This color is balanced against a neutral foundation of cool greys and off-whites to maintain a clean, professional environment.

- **Primary:** Cobalt Blue for high-intent interactions.
- **Secondary:** An optimistic teal/mint used sparingly for success states or accent highlights.
- **Neutral:** A range of greys (from #F0F2F5 for backgrounds to #1C1E21 for text) to establish hierarchy.
- **Compliance:** All text-on-background combinations must meet a minimum contrast ratio of 4.5:1 to ensure WCAG AA compliance. Interaction states (hover/press) should shift brightness by 10% to maintain clear affordance.

## Typography

The design system utilizes **Plus Jakarta Sans** (as a high-quality alternative to Optimistic VF) to provide a modern, geometric, and friendly tone. 

- **Headlines:** Use Bold (700) or SemiBold (600) weights with slight negative letter-spacing to create a compact, "editorial" look for dashboard titles.
- **Body:** Standardized at 16px for primary reading and 14px for secondary metadata.
- **Labels:** Use Medium or SemiBold weights for buttons and navigation items to ensure legibility at smaller sizes.
- **Scale:** On desktop, vertical rhythm is maintained through a 4px baseline grid.

## Layout & Spacing

The design system transitions from mobile-first to a **12-column fluid grid** for desktop. 

- **Navigation Structure:** Replaces the mobile bottom bar with a persistent **Left Sidebar** (280px). This sidebar houses primary navigation, workspace switchers, and user settings.
- **Grid:** A 12-column layout with 24px gutters. Content is typically housed in cards that span 3, 4, 6, or 12 columns depending on information density.
- **Whitespace:** Spacing is significantly increased for desktop to prevent visual clutter. Primary sections are separated by `space-xxl` (48px), while internal card padding is standardized at `space-xl` (32px) to match the large corner radii.
- **Responsive Behavior:** Below 1024px, the sidebar collapses into a hamburger menu or a slim icon-only rail to prioritize canvas space.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and subtle ambient shadows. 

- **Background:** The main application background uses a very light neutral (`#F0F2F5`).
- **Surface:** Primary content containers (cards) use absolute white (`#FFFFFF`).
- **Shadows:** Cards use a "Meta-style" soft shadow: a multi-layered, low-opacity blur (e.g., `0px 2px 4px rgba(0,0,0,0.04), 0px 12px 24px rgba(0,0,0,0.08)`) to create depth without appearing heavy.
- **Interactive States:** Hovering over a card should slightly increase the shadow spread and lift the element by 2px to signal interactivity.

## Shapes

The shape language is exceptionally soft and approachable, defining the "Modern Merchant" identity.

- **Cards:** Use a signature **32px corner radius** (`rounded-xl` / 3rem). This large radius requires generous internal padding (minimum 32px) to prevent content from "clipping" the corners visually.
- **Buttons:** All primary and secondary buttons are **Pill-shaped** (fully rounded ends).
- **Inputs:** Use a 12px or 16px radius to maintain consistency with the cards while remaining functional for text entry.
- **Icons:** Should utilize a rounded "filled" or "thick-stroke" style to match the weight of the typography and corner radii.

## Components

- **Buttons:** Large, pill-shaped buttons. The Primary button is Cobalt Blue with White text. Secondary buttons use a light grey ghost style or a subtle blue tint.
- **Cards:** White surfaces with 32px radius and soft shadows. Used for grouping dashboard widgets, product listings, and data tables.
- **Sidebar Navigation:** High-contrast active states using a vertical blue pill or a tinted background block. Icons are mandatory for quick scanning.
- **Input Fields:** Large touch/click targets (48px height) with 12px radius. Borders are light grey, becoming Cobalt Blue on focus.
- **Chips/Badges:** Pill-shaped with small `label-sm` text. Used for status indicators (e.g., "Active", "Pending") with high-chroma, low-saturation backgrounds.
- **Data Tables:** Clean, borderless rows with subtle dividers. Headers use `label-lg` in tertiary grey.