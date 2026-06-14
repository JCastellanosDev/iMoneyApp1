---
name: Vivid Clarity
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
  on-surface-variant: '#434655'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#0058be'
  on-secondary: '#ffffff'
  secondary-container: '#2170e4'
  on-secondary-container: '#fefcff'
  tertiary: '#005e6e'
  on-tertiary: '#ffffff'
  tertiary-container: '#00788c'
  on-tertiary-container: '#d7f6ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#acedff'
  tertiary-fixed-dim: '#4cd7f6'
  on-tertiary-fixed: '#001f26'
  on-tertiary-fixed-variant: '#004e5c'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 48px
---

## Brand & Style

The design system focuses on a high-energy, minimalist aesthetic tailored for modern personal finance. It balances professional reliability with a vibrant, forward-looking energy. The target audience is tech-savvy individuals who value speed, transparency, and a friction-less experience.

The style is **Modern Minimalism** with a focus on color-driven hierarchy rather than structural borders. It utilizes generous whitespace, soft depth, and a high-contrast palette to create an interface that feels both expansive and precise. By removing unnecessary dividers, the UI relies on spatial grouping and tonal shifts to guide the user’s eye, evoking a sense of calm control over complex financial data.

## Colors

The palette is anchored by a vibrant **Electric Blue** (#2563eb) which serves as the primary action color and brand identifier. 

- **Primary:** Used for main calls to action, active states, and critical branding elements.
- **Secondary & Tertiary:** Azure and soft cyan are reserved for data visualization (charts, progress bars) and subtle categorization.
- **Surfaces:** The interface uses a "Bleached Slate" approach. The primary background is pure white, while secondary surfaces and card containers use very light grey-blues (#f8fafc and #f1f5f9) to create soft distinction without the need for hard lines.
- **Contrast:** Typography maintains high contrast against backgrounds using deep slates to ensure readability and a premium feel.

## Typography

This design system uses **Inter** exclusively to leverage its systematic, utilitarian, and highly legible nature. 

- **Headlines:** Use a bold weight with slightly tighter letter spacing to create a strong visual anchor for page titles and financial balances.
- **Body:** Standardized on a 16px base for optimal readability. Line heights are generous (1.5x) to maintain the airy, minimalist feel.
- **Numerical Data:** For transaction amounts and balances, use `headline-md` or `display` roles to ensure financial figures are the most prominent elements on the screen.
- **Labels:** Caps or semi-bold weights are used for small metadata to maintain clarity at reduced scales.

## Layout & Spacing

The layout philosophy follows a **Fluid Grid** model with high internal margins to emphasize the minimalist aesthetic.

- **Grid:** A 12-column grid is used for desktop, scaling down to 4 columns for mobile. 
- **Rhythm:** An 8px linear scale governs all spacing. 24px (md) is the standard padding for cards and containers, while 40px (lg) is used to separate major logical sections.
- **Adaptation:** On mobile, margins reduce to 20px, and horizontal padding within cards may tighten to 16px to maximize screen real estate for data tables.
- **Separation:** Avoid using borders for layout separation. Use the `surface` color (#f1f5f9) against the `background` (#ffffff) to define content blocks.

## Elevation & Depth

Hierarchy is achieved through **Tonal Layers** and **Ambient Shadows**.

- **Level 0 (Background):** Pure white, the furthest back layer.
- **Level 1 (Surfaces):** Light grey-blue (#f8fafc) used for large sections or page-level containers.
- **Level 2 (Cards/Floating elements):** White surfaces with a very soft, diffused shadow. Shadows should be tinted with the primary blue (e.g., `rgba(37, 99, 235, 0.05)`) with a high blur radius (20px+) and low spread to feel like a natural light source.
- **Interactions:** Elements should "lift" on hover or press by increasing shadow blur and slightly shifting the Y-offset, creating a tactile, responsive feel.

## Shapes

The shape language is consistently **Rounded**, reinforcing the friendly and modern brand personality.

- **Containers:** Cards and primary containers use `rounded-lg` (1rem / 16px).
- **Buttons & Inputs:** Use `rounded-md` (0.5rem / 8px) for a precise but approachable look.
- **Interactive Small Elements:** Chips and tags should utilize a full pill shape to distinguish them from actionable buttons.
- **Consistency:** Avoid mixing sharp and rounded corners; every interactive or containing element must follow the 8px or 16px radius rule.

## Components

- **Buttons:** Primary buttons are solid Electric Blue with white text. No borders. Secondary buttons use a light blue tint background with blue text.
- **Cards:** Cards are the primary vessel for information. They feature 24px internal padding, 16px corner radius, and no border. Separation is achieved via the soft ambient shadow.
- **Inputs:** Fields use a light grey-blue background (#f1f5f9) rather than a border. On focus, they transition to a white background with a 2px Electric Blue border.
- **Chips:** Small, pill-shaped indicators used for transaction categories (e.g., "Food", "Rent"). They should use low-saturation versions of the secondary and tertiary colors.
- **Lists:** Transaction lists should be "borderless." Use 1px height horizontal rules only when necessary, preferably using a very faint grey (#e2e8f0).
- **Progress Bars:** Use the Tertiary Cyan for progress tracking to provide a visual distinction from primary action blue.