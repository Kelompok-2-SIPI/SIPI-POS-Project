---
name: SIPI Modern Merchant
colors:
  surface: '#f9f9fd'
  surface-dim: '#d9dade'
  surface-bright: '#f9f9fd'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f7'
  surface-container: '#ededf1'
  surface-container-high: '#e8e8ec'
  surface-container-highest: '#e2e2e6'
  on-surface: '#1a1c1f'
  on-surface-variant: '#424754'
  inverse-surface: '#2f3034'
  inverse-on-surface: '#f0f0f4'
  outline: '#727786'
  outline-variant: '#c2c6d6'
  surface-tint: '#0059c8'
  primary: '#004db0'
  on-primary: '#ffffff'
  primary-container: '#0064e0'
  on-primary-container: '#e6ebff'
  inverse-primary: '#afc6ff'
  secondary: '#0058bd'
  on-secondary: '#ffffff'
  secondary-container: '#0270ec'
  on-secondary-container: '#fefcff'
  tertiary: '#4a5458'
  on-tertiary: '#ffffff'
  tertiary-container: '#636c71'
  on-tertiary-container: '#e4edf3'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d9e2ff'
  primary-fixed-dim: '#afc6ff'
  on-primary-fixed: '#001944'
  on-primary-fixed-variant: '#004299'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a41'
  on-secondary-fixed-variant: '#004494'
  tertiary-fixed: '#dae4ea'
  tertiary-fixed-dim: '#bec8cd'
  on-tertiary-fixed: '#141d21'
  on-tertiary-fixed-variant: '#3f484d'
  background: '#f9f9fd'
  on-background: '#1a1c1f'
  surface-variant: '#e2e2e6'
  commerce-cobalt: '#0064E0'
  critical-stock: '#E41E3F'
  critical-margin: '#F2A918'
  price-alert: '#1876F2'
  canvas: '#FFFFFF'
  surface-soft: '#F1F4F7'
  hairline: '#CED0D4'
  success-green: '#31A24C'
typography:
  display-lg:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '500'
    lineHeight: '1.17'
    letterSpacing: '0'
  headline-lg:
    fontFamily: Montserrat
    fontSize: 36px
    fontWeight: '500'
    lineHeight: '1.28'
    letterSpacing: '0'
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 28px
    fontWeight: '500'
    lineHeight: '1.25'
    letterSpacing: '0'
  heading-sm:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.25'
    letterSpacing: '0'
  subtitle-bold:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '700'
    lineHeight: '1.44'
    letterSpacing: '0'
  price-display:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '700'
    lineHeight: '1.50'
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.50'
    letterSpacing: -0.01em
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.43'
    letterSpacing: -0.01em
  button-label:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1.43'
    letterSpacing: '0'
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.33'
    letterSpacing: '0'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  section: 64px
  tap-target: 44px
---

## Brand & Style

The design system for this product is a professional, high-utility framework designed specifically for F&B SMEs in Indonesia. It balances the premium, hardware-centric aesthetic of a global technology leader with the rugged, high-speed requirements of a commercial kitchen or retail environment.

The visual style is **Corporate / Modern** with a **Minimalist** foundation. It utilizes a "Stark White Canvas" approach to ensure maximum legibility against the vibrant, photography-first presentation of menu items and inventory. The brand personality is **Practical, Vigilant, and Supportive**—acting as a high-contrast digital watchdog that remains unobtrusive until a critical business insight requires attention.

### Design Principles
- **Photography-First:** Use high-quality, full-bleed imagery within large-radius containers to create depth and appetite appeal.
- **Utilitarian Elegance:** Every element must serve a functional purpose, utilizing generous whitespace and bold typography to reduce cognitive load during peak hours.
- **Contextual Alerting:** Use high-saturation semantic colors to signal business health without cluttering the interface.
- **Ergonomic Precision:** Large tap targets and rounded geometry ensure the interface is comfortable for multi-tasking operators.

## Colors

The palette is anchored by a high-contrast monochromatic base, punctuated by "Commerce Cobalt" for primary conversion actions. 

### Color Strategy
- **Primary (Commerce Cobalt):** Reserved strictly for "Add to Cart", "Complete Order", and primary fulfillment actions.
- **Semantic Alerting:** 
    - **Critical Red (#E41E3F):** Used for stock exhaustion and validation errors.
    - **Warning Orange (#F2A918):** Used for low profit margins or mid-priority stock warnings.
    - **Info Blue (#1876F2):** Used for price fluctuations and general system notifications.
- **Neutral/Surface:** The system uses a pure white canvas (`#FFFFFF`) to maximize contrast. Secondary surfaces use `surface-soft` (`#F1F4F7`) to differentiate product thumbnails and search bars from the main page background.
- **Ink Tones:** Primary headlines use `ink-deep` (`#0A1317`), while standard body text uses `ink` (`#1C1E21`) to maintain a professional, authoritative tone.

## Typography

This design system uses a tight, confident typographic hierarchy. **Montserrat** is used for headlines to provide a humanist, geometric character that feels premium yet approachable. **Inter** is utilized for body text and data to ensure maximum legibility and systematic clarity, especially for numerical data like stock levels and prices.

### Key Rules
- **Minimum Sizes:** Body text must never drop below 14px to remain legible in kitchen environments. Prices and totals are prioritized at 16px Bold.
- **Confident Headings:** Use Montserrat with stylistic sets (if available) to give a proprietary feel.
- **Data Clarity:** For inventory lists and POS receipts, use Inter's medium or bold weights to highlight quantities and currency values.

## Layout & Spacing

The layout follows a **Fluid Grid** model optimized for **Mobile-First PWA** usage. The content expands to fill the viewport (target 360–430px for primary mobile use) while maintaining a safe margin of 24px on either side.

### Spacing Philosophy
- **4px/8px Rhythm:** All component padding and margins must be multiples of 4px.
- **High-Stakes Ergonomics:** All primary interactive elements (buttons, switches, menu cards) must adhere to a minimum **44x44px tap target**.
- **Container Strategy:** Use a 1280px max-width for desktop views, utilizing a 12-column grid with 24px gutters.
- **Kitchen Layout:** On tablet/POS views, use a grid-based card layout for menu items to allow for rapid multi-touch selection.

## Elevation & Depth

Hierarchy is established primarily through **Tonal Layers** and **Photography-as-surface**. The design avoids heavy shadows in favor of a clean, flat aesthetic that feels contemporary and fast-loading.

- **Level 0 (Canvas):** The base `#FFFFFF` surface.
- **Level 1 (Subtle):** Used for cards and secondary sections. Uses a `1px` hairline border (`#CED0D4`) rather than a shadow.
- **Level 2 (Sticky):** Used for bottom bars, floating action buttons (AI Assistant), and sticky headers. These use a very soft, low-opacity ambient shadow (`rgba(0, 0, 0, 0.08)`) to suggest they float above the main content.
- **Contextual Layering:** Bottom sheets are preferred over center-aligned modals to keep the user in the context of their current task, especially during checkout or inventory entry.

## Shapes

The shape language is characterized by "Generous Softness." This helps the system feel approachable and modern, contrasting with the technical nature of inventory data.

- **Pill Shapes:** All buttons, search inputs, and status badges must use a **100px (rounded-full)** radius.
- **Utility Cards:** Standard cards for inventory items or settings use a **16px** radius.
- **Feature Cards:** High-impact cards, such as Dashboard alerts or photographic promo panels, use a **32px** radius to emphasize the "Photography-first" approach.
- **Form Inputs:** Input fields follow a **8px** radius to maintain a structural, reliable feel.

## Components

### Buttons
All buttons are pill-shaped. **Primary Commerce Buttons** use Cobalt Blue with white text. **Marketing/Secondary Buttons** use Ink Black. **Warning/Critical Buttons** use the respective semantic colors only when an action is destructive.

### Cards
Cards are the primary container for POS items and inventory data.
- **POS Card:** Large image-top card with 16px radius. Price is clearly displayed in a 16px bold tag in the top right or bottom right corner.
- **Alert Card:** Feature cards with 32px radius, utilizing tinted background colors (e.g., 10% opacity Red) to highlight "Stok Kritis".

### Input Fields
Inputs use an 8px radius with a 1px `hairline` border. Upon focus, the border increases to 2px in `fb-blue`. For mobile use, ensure inputs trigger the correct keyboard (numeric for stock/price).

### Chips & Badges
Status indicators (e.g., "Margin Kritis") are pill-shaped and always include an icon (⚠️, 🟠, 📈) alongside text to ensure accessibility for colorblind users.

### AI Assistant (Floating Button)
A persistent circular button (9999px) in the bottom right corner with a `chat` icon. It triggers a bottom-sheet interface for natural language inventory entry.

### Bottom Sheets
The standard for transaction confirmations and recipe editors. They should slide up from the bottom and cover no more than 90% of the screen height to maintain context.