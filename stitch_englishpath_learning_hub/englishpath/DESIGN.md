---
name: EnglishPath
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
  on-surface-variant: '#444653'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#747684'
  outline-variant: '#c4c5d5'
  surface-tint: '#3257c0'
  primary: '#002d89'
  on-primary: '#ffffff'
  primary-container: '#1a44ad'
  on-primary-container: '#a9bbff'
  inverse-primary: '#b5c4ff'
  secondary: '#5c5f61'
  on-secondary: '#ffffff'
  secondary-container: '#e0e3e5'
  on-secondary-container: '#626567'
  tertiary: '#003e29'
  on-tertiary: '#ffffff'
  tertiary-container: '#00583b'
  on-tertiary-container: '#42d59a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b5c4ff'
  on-primary-fixed: '#00164e'
  on-primary-fixed-variant: '#0e3da7'
  secondary-fixed: '#e0e3e5'
  secondary-fixed-dim: '#c4c7c9'
  on-secondary-fixed: '#191c1e'
  on-secondary-fixed-variant: '#444749'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
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
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
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
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
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
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  container-margin: 20px
  gutter: 16px
---

## Brand & Style

The design system is built on a **Modern Corporate** foundation infused with **Motivational Minimalist** elements. It is designed to feel like a premium educational tool that is both authoritative and highly accessible. The interface prioritizes clarity and focus, reducing cognitive load for language learners while providing a sense of momentum through vibrant accents and tactile feedback.

The aesthetic balance is achieved through:
- **Clarity:** Generous whitespace and a rigid typographic hierarchy to ensure learning content is never obscured.
- **Encouragement:** Using soft elevation and friendly shapes to make the interface feel approachable rather than intimidating.
- **Momentum:** High-contrast accent colors that signify progress, achievement, and successful interactions.

## Colors

The palette is anchored by a deep **Trustworthy Blue** (`primary`), which provides a stable, professional backdrop for educational content. The interface relies heavily on a "layered white" approach using **Soft Grays** (`secondary`) to distinguish between different content zones without introducing visual noise.

- **Success & Progress:** A vibrant **Emerald Green** (`tertiary`) is used exclusively for "Correct" states, completed lessons, and positive progress indicators.
- **Motivation & Focus:** An **Amber Orange** (`accent_warning`) is utilized for streaks, high-priority notifications, and call-to-action elements that require immediate attention.
- **Surface Strategy:** Backgrounds utilize the secondary color to reduce screen glare during long study sessions, while active cards and modules use pure white (#FFFFFF) to pop against the base.

## Typography

The design system utilizes **Inter** for all primary communication due to its exceptional legibility and neutral character, which prevents the UI from distracting from the linguistic nuances of the English language. 

- **Language Content:** For specific vocabulary examples or phonetic transcriptions, the system incorporates **JetBrains Mono** to provide a distinct visual "container" for technical language data.
- **Hierarchy:** Headlines use tighter letter-spacing and heavier weights to create a strong sense of place. 
- **Readability:** Body text maintains a generous line height (1.5x+) to ensure that learners, particularly at A1-A2 levels, can easily parse sentences and recognize word boundaries.

## Layout & Spacing

This design system follows a **Mobile-First Fluid Grid** philosophy. Since language learning often happens on the go, the layout is optimized for single-handed thumb interaction.

- **Grid System:** A 4-column grid for mobile (375px+) and a 12-column centered grid for desktop (1440px max-width).
- **Spacing Rhythm:** An 8px linear scale is used for component relationships, while 4px increments are reserved for internal component padding (e.g., inside chips or small buttons).
- **Verticality:** Content is stacked vertically in "learning blocks." On larger screens, these blocks reflow into a multi-column dashboard view while maintaining a maximum line length of 70 characters for reading comfort.

## Elevation & Depth

Hierarchy is established through **Ambient Shadows** and **Tonal Layering**. 

- **Level 0 (Surface):** The background layer using the secondary color.
- **Level 1 (Cards):** Pure white surfaces with a subtle, highly diffused shadow (0px 4px 20px rgba(0,0,0,0.05)). This is the primary container for lessons and exercises.
- **Level 2 (Interactive):** Elements like "Check Answer" buttons or active input fields utilize a slightly more pronounced shadow (0px 8px 24px rgba(26, 68, 173, 0.12)) to indicate interactivity.
- **Backdrop Blurs:** Used sparingly behind modal overlays to maintain context while focusing the user's attention on the task at hand.

## Shapes

The design system employs a **Rounded** shape language to evoke friendliness and safety. 

- **Standard Radius:** 8px (0.5rem) for small components like inputs and checkboxes.
- **Large Radius:** 16px (1rem) for content cards, progress containers, and large action buttons.
- **Pill Shapes:** Used exclusively for badges, tags, and progress bar caps to create a distinct "gamified" feel that contrasts with the more structural rectangular cards.

## Components

### Buttons
- **Primary:** High-saturation blue with 16px corner radius. Text is centered, bold, and white.
- **Secondary:** White background with a 1px border of the primary blue.
- **Ghost:** No background or border; used for secondary navigation like "Skip" or "Back."

### Progress Elements
- **Progress Bars:** Thicker, 12px height bars with pill-shaped ends. Use a "Track" color of light gray and a "Fill" color of the primary blue or tertiary green.
- **Badges:** Small, circular or pill-shaped containers for level indicators (e.g., "B2") using high-contrast backgrounds.

### Cards & Exercise Containers
- Exercises are housed in cards with 16px padding and 16px corner radius.
- **State Feedback:** When a user selects an option, the card border should thicken to 2px and change color (Primary for selection, Tertiary for correct, and a soft red for incorrect).

### Inputs
- **Text Fields:** 12px rounded corners, 1px light gray border. On focus, the border transitions to Primary Blue with a subtle outer glow.
- **Selection Chips:** Used for word-bank exercises. These should have a slight "lift" (Level 1 elevation) and a 12px radius.

### Navigation
- **Mobile Bottom Bar:** A persistent, blurred background bar with minimalist line icons. The "Active" state is indicated by a Primary Blue icon and a small dot indicator underneath.