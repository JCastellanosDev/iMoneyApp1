---
name: Fiscal Core
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45464d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#515f74'
  on-secondary: '#ffffff'
  secondary-container: '#d5e3fd'
  on-secondary-container: '#57657b'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#001e2f'
  on-tertiary-container: '#008cc7'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#d5e3fd'
  secondary-fixed-dim: '#b9c7e0'
  on-secondary-fixed: '#0d1c2f'
  on-secondary-fixed-variant: '#3a485c'
  tertiary-fixed: '#c9e6ff'
  tertiary-fixed-dim: '#89ceff'
  on-tertiary-fixed: '#001e2f'
  on-tertiary-fixed-variant: '#004c6e'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  container-margin: 24px
  gutter: 16px
---

## Brand & Style

The design system is engineered for a high-trust financial environment where clarity and precision are paramount. The brand personality is **authoritative yet accessible**, aiming to evoke a sense of security, stability, and intelligence. 

The visual style is **refined Minimalism**. It avoids decorative flourishes in favor of structural integrity and functional whitespace. We utilize a "Surface-on-Surface" approach where depth is communicated through subtle tonal shifts rather than aggressive shadows. The interface should feel like a premium physical tool: weighted, deliberate, and dependable.

**Target Audience:** Professionals and proactive savers who value data density without clutter and a UI that stays out of the way of their financial decision-making.

## Colors

The palette is anchored by **Deep Blues** and **Slate Grays** to project institutional reliability. 

- **Primary (#0F172A):** Used for primary navigation, high-level headings, and main action buttons to provide a strong visual anchor.
- **Secondary (#334155):** Used for supporting text and iconography to maintain hierarchy without competing with the primary actions.
- **Tertiary (#0EA5E9):** A vibrant sky blue reserved specifically for data visualization highlights, progress bars, and "growth" indicators.
- **Neutral / Backgrounds:** A sophisticated scale of cool grays (Slate 50 to Slate 200) is used to define containment and separate functional areas without using heavy lines.

Backgrounds should default to the cleanest neutral (`#F8FAFC`), using slightly darker shades to denote nested content or sidebars.

## Typography

This design system utilizes **Inter** for all roles to ensure maximum legibility and a systematic, utilitarian feel. 

- **Headlines:** Use tighter letter spacing and heavier weights to create a sense of importance. Display sizes are reserved for account balances and high-level summaries.
- **Body:** Set with generous line heights to ensure long financial reports and transaction lists remain readable.
- **Labels:** Used for metadata, table headers, and form captions. Small labels should utilize a slightly heavier weight (`500` or `600`) to remain legible at reduced sizes.

The type scale follows a strict rhythmic progression. On mobile, large headlines scale down to prevent awkward word breaks in data-heavy views.

## Layout & Spacing

The layout philosophy is based on a **Fixed Grid** for desktop (max-width 1280px) and a **Fluid Grid** for mobile devices. 

- **Rhythm:** An 8px base grid governs all spatial relationships. 
- **Desktop:** A 12-column grid with 24px gutters. Use 32px or 48px padding for main dashboard containers to emphasize the minimalist, "airy" feel.
- **Mobile:** A 4-column grid with 16px margins.
- **Reflow:** Components like "Account Cards" should stack vertically on mobile but can exist in 2 or 3-column rows on tablet/desktop to utilize horizontal space for data visualization.

Information density should be managed through "Negative Space"—allowing the eye to rest between distinct financial modules.

## Elevation & Depth

This design system uses **Tonal Layering** supplemented by **Ambient Shadows**. 

1. **Level 0 (Base):** The main background color (`#F8FAFC`).
2. **Level 1 (Cards/Modules):** Pure white (`#FFFFFF`) surfaces with a subtle 1px border (`#E2E8F0`). 
3. **Elevation Soft:** A very diffused shadow (0px 4px 20px rgba(15, 23, 42, 0.05)) is applied to Level 1 cards to give them a slight "lift" without appearing heavy.
4. **Elevation High (Modals/Popovers):** Reserved for temporary overlays. These use a more pronounced shadow (0px 10px 30px rgba(15, 23, 42, 0.1)) and a backdrop blur of 8px to maintain focus on the active task.

Avoid using black shadows; always tint shadows with the primary deep blue to maintain color harmony.

## Shapes

The shape language is **Rounded (Level 2)**, utilizing a standard 0.5rem (8px) for base components like input fields and small buttons. 

For larger structural elements:
- **Cards & Containers:** Use `rounded-lg` (16px) to create a soft, modern container that feels friendly but professional.
- **Action Items:** Primary CTA buttons may use `rounded-xl` (24px) to distinguish them from data entry fields.
- **Selection Indicators:** Small indicators (like active tabs) use a 2px radius to remain sharp and precise.

Consistent rounding across all components ensures the app feels like a cohesive ecosystem.

## Components

- **Buttons:** Primary buttons use the Deep Blue background with White text. Secondary buttons use a Ghost style (Slate border, no fill). All buttons feature a 12px-16px height-based rounding.
- **Input Fields:** Use a Slate 100 background and a 1px border. On focus, the border transitions to Tertiary Blue with a subtle outer glow.
- **Cards:** The workhorse of the design system. All cards must have a 16px corner radius and contain a 24px internal padding.
- **Chips:** Used for transaction categories (e.g., "Housing", "Groceries"). These use a desaturated version of the category color with 40% opacity to keep the UI clean and avoid a "rainbow" effect.
- **Data Tables:** Remove vertical borders. Use horizontal dividers in Slate 50. Headers should be all-caps `label-sm` for maximum contrast against data rows.
- **Progress Bars:** Use a thick 8px stroke with rounded ends. The track is Slate 100 and the fill is Tertiary Blue.