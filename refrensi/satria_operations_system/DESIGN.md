---
name: Satria Operations System
colors:
  surface: '#0e1511'
  surface-dim: '#0e1511'
  surface-bright: '#343b36'
  surface-container-lowest: '#09100c'
  surface-container-low: '#161d19'
  surface-container: '#1a211d'
  surface-container-high: '#242c27'
  surface-container-highest: '#2f3632'
  on-surface: '#dde4dd'
  on-surface-variant: '#bbcabf'
  inverse-surface: '#dde4dd'
  inverse-on-surface: '#2b322d'
  outline: '#86948a'
  outline-variant: '#3c4a42'
  surface-tint: '#4edea3'
  primary: '#4edea3'
  on-primary: '#003824'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#006c49'
  secondary: '#4cd7f6'
  on-secondary: '#003640'
  secondary-container: '#03b5d3'
  on-secondary-container: '#00424e'
  tertiary: '#ffb3af'
  on-tertiary: '#650911'
  tertiary-container: '#fc7c78'
  on-tertiary-container: '#711419'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3af'
  on-tertiary-fixed: '#410005'
  on-tertiary-fixed-variant: '#842225'
  background: '#0e1511'
  on-background: '#dde4dd'
  surface-variant: '#2f3632'
typography:
  display:
    fontFamily: Geist
    fontSize: 38px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h1:
    fontFamily: Geist
    fontSize: 30px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  h1-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  h2:
    fontFamily: Geist
    fontSize: 22px
    fontWeight: '500'
    lineHeight: '1.4'
  h3:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '500'
    lineHeight: '1.5'
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1'
  caption:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1'
  mono:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.5'
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
  xxl: 48px
---

## Brand & Style

This design system is built for the high-performance professional, drawing inspiration from technical command centers and modern engineering environments. It prioritizes **Technical Calm**—a state where high information density is balanced by extreme visual clarity and structural logic.

The aesthetic follows a **Modern Enterprise** approach, mixing elements of **Minimalism** with **Linear-like precision**. It avoids decorative flourishes, gradients, or "gaming" dashboard tropes in favor of:
- **Spatial Logic:** A nested workspace structure similar to Notion, where hierarchy is defined by clear containment.
- **High Information Density:** Optimized for power users who need to see more data at once without feeling overwhelmed.
- **Functional Contrast:** Using distinct surface tones and hairline borders rather than shadows to separate layers of information.
- **Operational Efficiency:** Every visual element serves a functional purpose, utilizing a "speed-first" UI philosophy.

## Colors

The palette is strictly dark-first, engineered to reduce eye strain during long operational sessions. 

- **The Foundation:** We use a deep charcoal-black (`#0B0D10`) for the base environment to create a sense of infinite depth.
- **The Tiers:** Layering is achieved through incremental lightness in gray values rather than opacity, ensuring high legibility and color accuracy.
- **The Accent:** Emerald Green (`#10B981`) is used sparingly as the primary action and success indicator, providing a high-contrast focal point against the dark surfaces.
- **Semantic Integrity:** Status colors (Red, Amber, Cyan) are saturated and vibrant to ensure they command attention immediately within the muted monochromatic environment.

## Typography

This design system utilizes **Geist** for its systematic, developer-centric aesthetic that bridges the gap between technical tools and consumer interfaces. 

- **Weight Usage:** Stick to Medium (500) for UI labels and Semi-Bold (600) for headlines. Avoid Bold (700) to maintain a refined, professional look.
- **Technical Data:** Any string representing IDs, Logs, Code, or raw metrics must use **JetBrains Mono**. This distinguishes machine-generated data from human-readable interface text.
- **Scaling:** On mobile devices, large display type should be avoided; use `h1-mobile` to ensure the layout remains functional for high-density information.

## Layout & Spacing

The system is built on a **4px base grid**, ensuring every element aligns to a consistent rhythm. 

- **Grid Strategy:** A 12-column fluid grid is used for the main content area, allowing for the "split-pane" layouts common in workspace tools.
- **Sidebar & Panels:** Sidebars should have a fixed width (typically 240px or 280px) while the main content area remains fluid up to the 1440px max-width.
- **Density:** Use `sm` (8px) or `md` (16px) padding for internal component spacing to maintain high information density. Reserve `lg` and `xl` for top-level page margins and section separation.
- **Mobile Reflow:** On mobile, the 12-column grid collapses into a single vertical stack with a 4-column conceptual layout. Horizontal scrolling is permitted for data tables that cannot be compressed.

## Elevation & Depth

Hierarchy is communicated through **Tonal Layering** and **Line Work** rather than traditional drop shadows.

- **Level 0 (Background):** Used for the furthest back surface, typically the "void" behind the main workspace.
- **Level 1 (Surface):** The primary workspace area or sidebar.
- **Level 2 (Elevated):** Used for cards, active items, or floating panels. 
- **Borders:** Every surface transition must be defined by a 1px solid border using the `$border` color. In this design system, a border is more "premium" than a shadow.
- **Active State:** Highlight active or focused states using the Primary Accent color as a 2px left-border or a subtle background tint, never a heavy glow.

## Shapes

The shape language is "Soft-Technical"—geometric and structured but not aggressive.

- **Base Radius:** 8px is the standard for most interactive elements like buttons and input fields.
- **Container Radius:** 12px to 16px is reserved for larger containers like cards and modals to create a clear "object" feel.
- **Utility Shapes:** Use the Pill shape (999px) exclusively for status badges (Chips) and notification pips. 
- **Icons:** Use 20px or 24px bounding boxes with a 1.5px or 2px stroke weight to match the precision of the typography.

## Components

### Buttons
- **Primary:** Solid Emerald background with dark text. No gradients.
- **Secondary:** Transparent background with a `$border` stroke.
- **Ghost:** No background or border until hover. Used for low-priority actions in toolbars.

### Inputs
- **Field:** Darker background than the surface it sits on, with a 1px border.
- **Focus:** Border color changes to Emerald. No outer glow.
- **Labels:** Always use the `label` typography style (13px) in `$text_secondary`.

### Status Indicators
- Statuses must always follow the **Icon + Text + Color** rule to ensure accessibility and clarity.
- For example: A "Success" status uses a Check icon, the word "Completed", and Emerald text.

### Cards & Workspaces
- Cards should use `$surface_elevated` on top of `$surface`.
- Use hairline dividers (`$border`) to separate header, body, and footer within cards.

### Command Palette
- A central component of the design system. It should be a modal (`radius_modal`) with a semi-transparent `$surface_elevated` background and a subtle backdrop blur (12px) to focus the user on the task.

### Lists & Data Tables
- Use high-density rows (32px to 40px height).
- Alternate row striping is discouraged; use subtle hover states and hairline dividers instead.