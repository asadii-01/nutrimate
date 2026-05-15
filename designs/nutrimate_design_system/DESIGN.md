---
name: NutriMate Design System
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3e4a3d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#6e7b6c'
  outline-variant: '#bdcaba'
  surface-tint: '#006e2d'
  primary: '#006b2c'
  on-primary: '#ffffff'
  primary-container: '#00873a'
  on-primary-container: '#f7fff2'
  inverse-primary: '#62df7d'
  secondary: '#9d4300'
  on-secondary: '#ffffff'
  secondary-container: '#fd761a'
  on-secondary-container: '#5c2400'
  tertiary: '#0058be'
  on-tertiary: '#ffffff'
  tertiary-container: '#2170e4'
  on-tertiary-container: '#fefcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#7ffc97'
  primary-fixed-dim: '#62df7d'
  on-primary-fixed: '#002109'
  on-primary-fixed-variant: '#005320'
  secondary-fixed: '#ffdbca'
  secondary-fixed-dim: '#ffb690'
  on-secondary-fixed: '#341100'
  on-secondary-fixed-variant: '#783200'
  tertiary-fixed: '#d8e2ff'
  tertiary-fixed-dim: '#adc6ff'
  on-tertiary-fixed: '#001a42'
  on-tertiary-fixed-variant: '#004395'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  caption:
    fontFamily: Plus Jakarta Sans
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
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 32px
  xl: 48px
  container-max: 1200px
  gutter: 16px
  margin-mobile: 20px
---

## Brand & Style

The design system is anchored in the concept of "Guided Vitality." It targets a diverse Pakistani demographic—ranging from budget-conscious students in Lahore to gym beginners in Karachi—requiring a UI that feels both technologically advanced (AI-powered) and deeply approachable.

The style is **Modern Corporate with a Friendly Edge**. It prioritizes extreme clarity and legibility to reduce the cognitive load of tracking nutrition. By utilizing generous white space and a soft, tactile interface, the system evokes a sense of calm and control. The visual language avoids "medical" coldness, opting instead for a vibrant, motivating atmosphere that encourages daily engagement and long-term habit formation.

## Colors

The palette is functional and semantic, designed to provide instant visual feedback:

*   **Primary (Fresh Leaf Green):** Used for "Health" actions, progress bars, and primary CTAs. It symbolizes growth and vitality.
*   **Secondary (Warm Orange):** Specifically reserved for energy-related metrics (Calories) and motivational highlights. It provides a warm contrast to the green.
*   **Tertiary (Calm Blue):** Dedicated to hydration tracking and informational tooltips, providing a cooling effect against the warmer tones.
*   **Neutrals:** A range of Slate grays are used to maintain a professional, high-end feel.
    *   **Text-Primary:** #0F172A (Deep Slate) for maximum readability.
    *   **Text-Secondary:** #64748B (Slate Gray) for metadata and labels.
    *   **Surface-Muted:** #F1F5F9 for subtle card backgrounds and input fields.

## Typography

This design system utilizes **Plus Jakarta Sans** for its friendly, open counters and modern geometric feel. It balances professionalism with a welcoming personality.

- **Headlines:** Use a bold weight with tighter letter-spacing to create a strong visual "anchor" for meal cards and daily summaries.
- **Body Text:** Set with generous line height (1.5x minimum) to ensure long-form diet plans and recipes are easy to scan on mobile screens.
- **Localization Note:** For Urdu script integration (where applicable), ensure the line height is increased by 20% to accommodate descending characters without clipping.

## Layout & Spacing

This design system follows a **Fluid Grid** model with a heavy emphasis on a "Mobile-First" vertical rhythm.

- **Mobile (Default):** A single-column layout with 20px side margins. Elements are stacked to prioritize thumb-reachability.
- **Desktop/Tablet:** A 12-column grid system. Content is contained within a 1200px max-width wrapper. 
- **Spacing Logic:** All spacing is based on a 4px/8px baseline grid. Use `md` (24px) for internal card padding and `lg` (32px) for section vertical spacing to maintain the "generous white space" requirement.

## Elevation & Depth

Hierarchy is achieved through **Ambient Shadows** and **Tonal Layering**.

- **Level 0 (Background):** #F8FAFC. Solid, flat.
- **Level 1 (Cards/Surfaces):** White (#FFFFFF) with a very soft, diffused shadow: `0px 4px 20px rgba(15, 23, 42, 0.05)`. This creates a subtle "lift" from the background without feeling heavy.
- **Level 2 (Active/Floating):** Used for navigation bars and floating action buttons (FAB). Shadow: `0px 10px 25px rgba(15, 23, 42, 0.1)`.
- **Interaction:** When a user interacts with a card, use a subtle inner stroke (1px, Primary-Light) instead of increasing the shadow, maintaining a clean, modern aesthetic.

## Shapes

The design system employs a **Rounded** shape language to reinforce the "approachable" and "friendly" brand pillars.

- **Main Containers:** 16px (1rem) corner radius for all cards, meal recommendations, and modal overlays.
- **Buttons & Inputs:** 12px corner radius to distinguish them slightly from larger layout containers while maintaining the soft aesthetic.
- **Icons:** Use the Lucide/Phosphor set with a "Regular" stroke weight (2px) and rounded caps/joins to match the typography.

## Components

### Buttons
- **Primary:** Solid Leaf-Green (#16A34A) with White text. 12px rounded corners. Includes a subtle "squish" animation on tap for tactile feedback.
- **Secondary:** Surface-Muted background with Primary-colored text. Used for "Add Meal" or "View Details."

### Cards (The Hero Component)
- Used for meal suggestions. Must feature a high-quality food image with a 16px top-radius. 
- Bottom section includes a "Calorie Badge" (Secondary Orange) and "Macro-pills" (Small chips for Protein, Carbs, Fats).

### Input Fields
- Soft gray borders (#E2E8F0) that transition to Primary Green on focus. 
- Labels are always visible (Label-md) to assist beginners who may be unfamiliar with tracking terminology.

### Progress Gauges
- Circular trackers for daily water intake (Tertiary Blue) and calories (Secondary Orange). Use a thick 8pt stroke with rounded endpoints.

### Motivational Chips
- Small, rounded labels (e.g., "Budget Friendly," "High Protein," "Quick Prep") using low-saturation versions of the brand colors to provide information without visual clutter.