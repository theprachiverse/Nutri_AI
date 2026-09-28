---
name: NutriAI Vitality Interface
colors:
  surface: '#f8f9ff'
  surface-dim: '#ccdbf3'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d5e3fc'
  on-surface: '#0d1c2e'
  on-surface-variant: '#3c4a42'
  inverse-surface: '#233144'
  inverse-on-surface: '#eaf1ff'
  outline: '#6c7a71'
  outline-variant: '#bbcabf'
  surface-tint: '#006c49'
  primary: '#006c49'
  on-primary: '#ffffff'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#4edea3'
  secondary: '#006591'
  on-secondary: '#ffffff'
  secondary-container: '#39b8fd'
  on-secondary-container: '#004666'
  tertiary: '#855300'
  on-tertiary: '#ffffff'
  tertiary-container: '#e29100'
  on-tertiary-container: '#523200'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#c9e6ff'
  secondary-fixed-dim: '#89ceff'
  on-secondary-fixed: '#001e2f'
  on-secondary-fixed-variant: '#004c6e'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f8f9ff'
  on-background: '#0d1c2e'
  surface-variant: '#d5e3fc'
typography:
  headline-xl:
    fontFamily: Literata
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 52px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Literata
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Literata
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 42px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Literata
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Literata
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Literata
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: Literata
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 30px
  body-md:
    fontFamily: Literata
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-sm:
    fontFamily: Literata
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  label-lg:
    fontFamily: DM Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0.01em
  label-md:
    fontFamily: DM Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: DM Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
  caption:
    fontFamily: DM Sans
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 14px
    letterSpacing: 0.02em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  margin: 2rem
  margin-sm: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style
The design system establishes an empathetic, restorative sanctuary for personal health guidance. Built for a conversational nutrition assistant, the aesthetic departs from sterile, clinical health apps in favor of the sunlit, botanical ambiance of a modern wellness café or mindfulness space. It evokes calm clarity, encouragement, and natural vitality.

The visual direction harmonizes **warm organic minimalism** with **delicate glassmorphic layering**:
- **Tactile Softness:** Pill-shaped controls, plush containers, and generous padding dispel the intimidation often associated with dietary tracking and medical advice.
- **Luminous Transparency:** Translucent, frosted glass surfaces reflect natural light and create seamless spatial hierarchy without rigid partitions.
- **Editorial Warmth:** The juxtaposition of an organic, literary serif with a functional geometric sans creates an experience that feels both deeply knowledgeable and casually accessible.

## Colors
The palette captures the vibrancy of fresh botanicals, balanced by grounded earth tones and crisp aquatic accents.

- **Primary (`#10B981`):** Vivid emerald green used for primary actions, user query highlights, active status toggles, and key conversational inflection points. State transitions shift to deep emerald (`#059669`) on interaction.
- **Secondary (`#0EA5E9`):** Crisp sky blue dedicated to hydration metrics, micronutrient callouts, and informational markers.
- **Tertiary (`#F59E0B`):** Warm amber reserved for metabolic energy highlights, dietary cautions, streak rewards, and motivational feedback.
- **Neutral & Headings:**
  - Deep Forest Green (`#064E3B`): Anchors editorial headlines, key metrics, and NutriAI conversational responses with grounded organic authority.
  - Slate Gray (`#475569`): Delivers legible, accessible secondary copy, metadata, and timestamps without visual harshness.
- **Surfaces & Borders:**
  - Canvas: Ambient vertical gradient flowing from soft crystalline mint (`#F4FBF7`) to dew-tinted sage (`#E8F7F0`).
  - Frosted Card Surfaces: Semi-transparent white (`rgba(255, 255, 255, 0.78)`) overlaid on backdrop blurs.
  - Borders: Tender mint green (`#A7F3D0`), rendered at hairline weights to contain components organically.
  - Highlights / Tints: Mint mist (`#ECFDF5`) serves as an unobtrusive backing for message chips, tags, and selected options.

## Typography
The typographic system pairs the narrative, reflective character of **Literata** with the crisp, functional precision of **DM Sans**.

- **Editorial Body & Guidance (Literata):** Conversational AI responses, daily insights, meal breakdowns, and article excerpts rely on Literata. Its open counters and gentle organic terminals mimic the reading experience of a literary wellness journal, minimizing eye fatigue during deep conversational sessions.
- **Interface & Operational Data (DM Sans):** Primary buttons, interactive chips, ingredient metrics, charts, labels, and timestamps utilize DM Sans. This maintains high scannability and structural clarity within dense nutrient matrices and input areas.
- **Hierarchy Rules:** Always set AI assistant narrative answers in `body-md` or `body-lg` Literata. User chat prompts utilize `label-lg` or `body-md` DM Sans to subtly delineate human input from assistant wisdom.

## Layout & Spacing
The layout adheres to an airy, centered narrative container engineered for continuous chat flow alongside modular nutrition dashboards.

- **Grid & Content Flow:**
  - **Mobile (< 768px):** Single-column layout. Chat container utilizes full width minus `margin-sm` (16px) margins. Conversation bubbles expand up to 88% screen width.
  - **Tablet (768px - 1024px):** 8-column layout. Chat thread centers at max 680px width, while persistent action bars attach smoothly to the viewport bottom.
  - **Desktop (> 1024px):** 12-column layout. Asymmetric split: a 7-column primary stream for conversation and a 5-column glassmorphic tray for real-time macronutrient summaries, daily logs, and recipe snapshots.
- **Rhythm & Safe Insets:** Generous vertical rhythm prioritizes breathing room. Chat responses maintain a `space-lg` (24px) vertical distance between speaker exchanges, while intra-bubble elements (e.g., text paired with a recipe card preview) stay tightly bound with `space-sm` (8px).

## Elevation & Depth
Elevation is rendered through light-refracting glass layers and ambient, botanical shadows rather than heavy drop shadows.

- **Atmospheric Canvas:** The underlying background carries a radiant gradient (`#F4FBF7` to `#E8F7F0`). Higher-tier elements blur and tint this canvas, allowing subtle green hues to peek through.
- **Glass Tier 1 (Chat Bubbles, Passive Panels):**
  - Background: `rgba(255, 255, 255, 0.72)`
  - Backdrop Blur: `12px`
  - Border: 1px solid `rgba(167, 243, 208, 0.45)`
  - Shadow: `0 4px 20px -2px rgba(6, 78, 59, 0.04)`
- **Glass Tier 2 (Interactive Floating Cards, Drawer Sheets):**
  - Background: `rgba(255, 255, 255, 0.88)`
  - Backdrop Blur: `20px`
  - Border: 1px solid `#A7F3D0`
  - Shadow: `0 12px 32px -4px rgba(6, 78, 59, 0.08), 0 2px 6px -1px rgba(6, 78, 59, 0.03)`
- **Glass Tier 3 (Modals, Active Menus, Sticky Chat Input Bar):**
  - Background: `rgba(255, 255, 255, 0.94)`
  - Backdrop Blur: `24px`
  - Border: 1px solid `#A7F3D0`
  - Shadow: `0 20px 48px -8px rgba(6, 78, 59, 0.12), 0 4px 12px -2px rgba(16, 185, 129, 0.06)`
- **User Outbound Bubbles:** Rendered in solid `linear-gradient(135deg, #10B981 0%, #059669 100%)` with a soft emerald glow: `0 6px 16px -2px rgba(16, 185, 129, 0.25)`.

## Shapes
The shape strategy embraces organic, botanical curvature. Level 3 (pill-shaped) geometry eliminates aggressive corners, fostering an approachable, calming experience.

- **Pills (`rounded-full`):** Reserved for prompt chips, primary CTA buttons, search/chat input pills, and micro-metric badges.
- **Macro Enclosures (`rounded-2xl` to `rounded-3xl` / 1.5rem to 2rem):** Used for conversational AI response panels, meal card modules, and bottom sheets.
- **Chat Asymmetry:** Outbound user bubbles retain fully rounded pill-like geometries on three corners with a reduced radius (8px) on the bottom-right anchor, establishing intuitive directional cues. Assistant cards preserve balanced, gentle radii across all corners.

## Components

### Buttons
- **Primary:** Full pill contour. Emerald gradient (`#10B981` to `#059669`), white DM Sans `label-lg` typography. Padding: 14px 28px. Hover: subtle scale (1.02) and enhanced emerald glow.
- **Secondary / Ghost:** Frosted mint fill (`rgba(236, 253, 245, 0.8)`), border 1px solid `#A7F3D0`, forest green text (`#064E3B`).
- **Icon Actions:** Circular (44px × 44px) frosted glass disks for voice input, media attachments, and bookmarking.

### Chips & Conversational Starters
- **Quick-Reply Suggestions:** Floating pill capsules (`padding: 8px 16px`) with `rgba(255, 255, 255, 0.85)` surface, `#A7F3D0` border, and `#064E3B` text. Active or tapped state instantly transitions to `#10B981` with white text.
- **Category & Health Badges:**
  - *Calorie/Energy:* Soft amber backing (`rgba(245, 158, 11, 0.12)`), `#B45309` text.
  - *Hydration/Water:* Sky blue backing (`rgba(14, 165, 233, 0.12)`), `#0369A1` text.
  - *Plant-Based/Organic:* Mint mist backing (`#ECFDF5`), `#064E3B` text.

### Chat Stream & Assistant Cards
- **Assistant Response Envelope:** Frosted glass panel (`rgba(255, 255, 255, 0.78)`), hairline border `#A7F3D0`, 24px padding. Literata `body-md` typography with 1.7 line height for effortless readability.
- **User Bubble:** High-vibrancy emerald container, white DM Sans text, floating flush-right.

### Form Inputs & Chat Bar
- **Conversational Input Pill:** Sticky floating dock elevated with Glass Tier 3. Pill-shaped outer container housing an auto-expanding input field, voice-dictation trigger, and emerald send button. Inner placeholder set in Slate Gray (`#475569`) at 60% opacity.
- **Text Fields:** Subtle mint-white background, 1.5px border `#A7F3D0`, focusing to `#10B981` with zero harsh box shadows—only a 3px diffused mint aura (`rgba(16, 185, 129, 0.15)`).

### Selection Controls (Checkboxes & Radios)
- **Checkboxes:** Smooth rounded squares (8px border-radius) in `#ECFDF5`. Selected state fills with `#10B981` with a crisp white checkmark icon.
- **Radio Buttons:** Concentric circular rings. Inactive: `#A7F3D0` outer rim with transparent interior. Active: `#10B981` outer rim holding an inner floating emerald dot.

### Specialized NutriAI Components
- **Macro Distribution Ring:** A soft, tripartite ring visualizing Proteins, Fats, and Carbs using Emerald, Sky Blue, and Amber against a frosted circular glass backdrop.
- **Ingredient Pill Matrix:** Mini-pills displaying dietary tags (e.g., "Gluten-Free", "High-Iron") using 11px uppercase DM Sans tags embedded directly into meal suggestions.