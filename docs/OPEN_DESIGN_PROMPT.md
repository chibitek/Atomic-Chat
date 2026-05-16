# Open Design Prompt: Atomic Chat UI with Liquid Glass

> **Project:** Atomic Chat — AI Chat Platform  
> **Design System:** Apple Liquid Glass (translated to web)  
> **Platforms:** macOS, iOS, Web  
> **Framework:** React 19 + Tailwind CSS v4 + Framer Motion  
> **Date:** 2026-05-16

---

## 🎯 Design Philosophy

**Liquid Glass for the Web**

Translate Apple's iOS 26/macOS 16 Liquid Glass design language into a cross-platform web application. The design should feel:

- **Translucent** — Content bleeds through surfaces with backdrop blur
- **Depth-rich** — Multiple layers of glass with varying opacity/blur
- **Dynamic** — Surfaces morph and respond to interaction
- **Immersive** — Edge-to-edge content that extends behind panels
- **Premium** — Specular highlights, subtle shadows, refined borders

**Key Principles:**
1. **Background Extension** — Content (images, gradients, video) extends under sidebars and panels with blur
2. **Glass Hierarchy** — Toolbars, sidebars, cards, and modals each have distinct glass treatments
3. **Morphing** — UI elements smoothly transition between states with glass refraction
4. **Light Play** — Specular highlights, shimmer effects, light refraction on interaction
5. **Content First** — Glass is the frame, content is the focus

---

## 🎨 Theme System

### Four Variants (User Switchable)

| Variant | Description | Use Case |
|---------|-------------|----------|
| **Light** | White translucent glass, dark text | Daytime, bright environments |
| **Dark** | Dark translucent glass, light text | Nighttime, dark environments |
| **Clear** | Nearly transparent, minimal chrome | Maximum content visibility |
| **Tinted** | Colored glass (blue/purple tint) | Brand expression, personality |

### CSS Variables (Tailwind v4 Compatible)

```css
@theme inline {
  /* Glass opacity */
  --glass-opacity: 0.25;
  --glass-opacity-hover: 0.35;
  --glass-opacity-active: 0.45;

  /* Blur amounts */
  --glass-blur-sm: 8px;
  --glass-blur-md: 20px;
  --glass-blur-lg: 40px;
  --glass-blur-xl: 60px;

  /* Borders */
  --glass-border: rgba(255, 255, 255, 0.2);
  --glass-border-dark: rgba(255, 255, 255, 0.1);

  /* Highlights */
  --glass-highlight: rgba(255, 255, 255, 0.15);
  --glass-shadow: rgba(0, 0, 0, 0.1);

  /* Colors */
  --color-glass-bg: rgba(255, 255, 255, var(--glass-opacity));
  --color-glass-text: rgba(0, 0, 0, 0.85);
  --color-glass-text-secondary: rgba(0, 0, 0, 0.5);

  /* Radius */
  --radius-glass: 1rem;
  --radius-glass-lg: 1.5rem;
}
```

---

## 📐 Layout Architecture

### Desktop (macOS / Web > 1024px)

```
┌─────────────────────────────────────────────────────────────┐
│  Title Bar (glass-toolbar)                                  │
│  [◀] [🔍 Global Search] [Share] [⚙️] [👤]                 │
├────────┬──────────────────────────────────────┬───────────────┤
│        │                                      │               │
│ Sidebar│         Main Content Area            │   Inspector   │
│ (glass)│         (content extends here)        │   (glass)     │
│        │                                      │               │
│ Threads│    ┌────────────────────────────┐   │  Model Params │
│ List   │    │  Chat Messages             │   │  Token Usage  │
│        │    │  (glass-message bubbles)    │   │  Files        │
│ [+]    │    │                            │   │  Tools        │
│        │    │  User: Hello!              │   │               │
│        │    │  ┌────────────────────┐    │   │               │
│        │    │  │ 🤖 AI Response     │    │   │               │
│        │    │  │ with code blocks   │    │   │               │
│        │    │  │ and artifacts      │    │   │               │
│        │    │  └────────────────────┘    │   │               │
│        │    └────────────────────────────┘   │               │
│        │                                      │               │
│        │    [📎] [Type message...    ] [⬆️]   │               │
│        │    [🎙️] [🛠️] [👁️] [⚡]              │               │
├────────┴──────────────────────────────────────┴───────────────┤
│  Status Bar (glass)                                         │
│  🟢 Synced • 2.4 GB • GPT-5 • $0.002                        │
└─────────────────────────────────────────────────────────────┘
```

**Key Layout Features:**
- **Background Extension:** The main content area's background (gradient, image, or video) extends under the sidebar and inspector with heavy blur
- **Glass Sidebar:** 280px width, `backdrop-filter: blur(40px)`, content visible underneath
- **Glass Inspector:** 320px width, collapsible, same treatment
- **Floating Toolbar:** Not attached to edges, floats with glass treatment
- **Edge-to-Edge:** No visible window chrome, content goes to screen edges

### Mobile (iOS)

```
┌─────────────────────────────┐
│  Status Bar (system)          │
├─────────────────────────────┤
│  [◀] Chat Title        [⚙️]  │
├─────────────────────────────┤
│                             │
│  ┌───────────────────────┐  │
│  │ 🤖 AI Response        │  │
│  │ with glass bubble     │  │
│  │ treatment             │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ 👤 User message       │  │
│  │ blue-tinted glass     │  │
│  └───────────────────────┘  │
│                             │
├─────────────────────────────┤
│  [📎] [Type...      ] [⬆️]  │
│  [🎙️] [🛠️] [👁️]           │
├─────────────────────────────┤
│  [💬] [🔍] [+] [⚙️] [👤]   │
│  Chat Hub  New  Set. Profile│
└─────────────────────────────┘
```

**Key Mobile Features:**
- **Bottom Sheet:** Inspector pulls up from bottom as glass sheet
- **Safe Areas:** Content respects `env(safe-area-inset-*)`
- **Haptic Feedback:** Glass morphs on press with spring physics
- **Swipe Gestures:** Swipe sidebar from left edge

---

## 🧩 Component Specifications

### 1. Glass Surface (Base Component)

**All glass surfaces share these properties:**

```
Background:    rgba(255, 255, 255, 0.25)  [light]
               rgba(30, 30, 30, 0.15)      [dark]
Backdrop:      blur(20px) saturate(1.2)
Border:        1px solid rgba(255, 255, 255, 0.2)
Border Radius: 1rem (16px)
Shadow:        none (glass provides depth via blur)
Highlight:     Linear gradient from top (white, 15% opacity)
```

**Hover State:**
```
Background:    rgba(255, 255, 255, 0.35)  [light]
Transition:    all 0.3s cubic-bezier(0.4, 0, 0.2, 1)
```

**Active/Pressed State:**
```
Background:    rgba(255, 255, 255, 0.45)  [light]
Transform:     scale(0.98)
```

---

### 2. Sidebar (Thread List)

```
Width:         280px (desktop), 100% (mobile drawer)
Background:    glass-lg (blur 40px)
Border:        1px solid rgba(255, 255, 255, 0.15) right edge
Content:       Threads list with glass-item rows
```

**Thread List Item:**
```
Height:        64px
Padding:       12px 16px
Background:    transparent (default)
               glass-sm (hover)
Border Radius: 12px
Margin:        4px 8px

Content:
  - Avatar/Icon (32px, circular, glass-sm)
  - Title (14px, medium weight)
  - Preview (12px, secondary color, truncated)
  - Timestamp (12px, secondary)
  - Status dot (8px, colored, with glow)
```

**Active Thread:**
```
Background:    rgba(0, 122, 255, 0.15)
Border:        1px solid rgba(0, 122, 255, 0.3)
Left Border:   3px solid #007AFF (accent)
```

---

### 3. Chat Message Bubbles

**User Message:**
```
Background:    rgba(0, 122, 255, 0.2)  [blue-tinted glass]
Backdrop:      blur(8px)
Border:        1px solid rgba(0, 122, 255, 0.3)
Border Radius: 16px (top-left, top-right, bottom-left)
               4px (bottom-right)  [pointy corner]
Padding:       16px
Max Width:     80% (desktop), 90% (mobile)
Text Color:    rgba(0, 0, 0, 0.9) [light] / white [dark]
```

**AI Message:**
```
Background:    rgba(255, 255, 255, 0.2)  [neutral glass]
Backdrop:      blur(12px)
Border:        1px solid rgba(255, 255, 255, 0.15)
Border Radius: 16px (all corners)
Padding:       16px
Max Width:     80% (desktop), 90% (mobile)
```

**Model Indicator (inside AI bubble):**
```
Position:      Top-left, inside bubble
Content:       [🟣] Claude 4  [badge]
Background:    glass-sm
Padding:       4px 8px
Border Radius: 12px
Font Size:     11px
```

---

### 4. Chat Input Area

```
Position:      Bottom of main content
Background:    glass-lg (blur 40px) with gradient fade from bottom
Border:        1px solid rgba(255, 255, 255, 0.15) top edge
Padding:       16px
```

**Input Field:**
```
Background:    glass-sm (blur 8px)
Border:        1px solid rgba(255, 255, 255, 0.2)
Border Radius: 20px (pill shape)
Padding:       12px 20px
Min Height:    48px
Max Height:    200px (auto-expand)
Placeholder:   "Ask anything..." (secondary color)
Focus:         Border color → accent blue, glow effect
```

**Action Buttons (around input):**
```
Size:          40px circular
Background:    glass-sm
Border:        1px solid rgba(255, 255, 255, 0.2)
Icon:          20px, centered
Hover:         Scale 1.1, background brightens
Active:        Scale 0.95

Buttons:
  [📎] Attachment
  [🎙️] Voice (pulse animation when recording)
  [🛠️] Tools (badge count if active)
  [👁️] Vision
  [⬆️] Send (accent color when enabled)
```

---

### 5. Toolbar

```
Position:      Top of window (floating, not edge-attached)
Height:        52px
Background:    glass-md (blur 20px)
Border:        1px solid rgba(255, 255, 255, 0.15)
Border Radius: 16px (floating pill)
Margin:        16px from edges
Padding:       8px 16px
Shadow:        0 4px 24px rgba(0, 0, 0, 0.1)
```

**Toolbar Groups (separated by glass dividers):**
```
Group 1: Navigation
  [◀] Back
  [🏠] Home

Group 2: Global Actions
  [🔍] Search (expands to glass search modal)
  [✨] New Chat

Group 3: Context
  [Share]
  [Favorite ⭐]

Group 4: User
  [🌙/☀️] Theme toggle
  [🔔] Notifications (glass badge)
  [👤] Avatar (glass circular)
```

**Glass Divider:**
```
Width:         1px
Height:        24px
Background:    linear-gradient(transparent, rgba(255,255,255,0.2), transparent)
```

---

### 6. Model Selector

```
Trigger:       Button in toolbar or input area
Dropdown:      Glass panel (blur 40px)
Width:         320px
Max Height:    400px
Border Radius: 16px
Padding:       8px
```

**Model Item:**
```
Height:        56px
Padding:       12px
Border Radius: 12px
Background:    transparent (default)
               glass-sm (hover)
               rgba(0, 122, 255, 0.15) (selected)

Content:
  - Provider icon (24px, colored)
  - Model name (14px, medium)
  - Provider name (12px, secondary)
  - Status dot (8px)
  - Capability badges (🏠 local, ☁️ cloud, 🍎 mlx)
```

**Section Headers:**
```
Font Size:     11px
Font Weight:   600
Text Transform: Uppercase
Letter Spacing: 0.05em
Color:         Secondary
Padding:       8px 12px
```

---

### 7. Cards (Settings, Model Hub, etc.)

```
Background:    glass-md (blur 20px)
Border:        1px solid rgba(255, 255, 255, 0.15)
Border Radius: 20px
Padding:       24px
Shadow:        0 8px 32px rgba(0, 0, 0, 0.08)

Hover:
  Transform:   translateY(-2px)
  Shadow:      0 12px 48px rgba(0, 0, 0, 0.12)
  Border:      1px solid rgba(255, 255, 255, 0.25)
```

**Card Header:**
```
Border Bottom: 1px solid glass-divider
Padding Bottom: 16px
Margin Bottom:  16px

Title:         18px, semibold
Subtitle:      14px, secondary
```

---

### 8. Modal / Dialog

```
Overlay:
  Background:    rgba(0, 0, 0, 0.4)
  Backdrop:      blur(8px)

Panel:
  Background:    glass-xl (blur 60px)
  Border:        1px solid rgba(255, 255, 255, 0.2)
  Border Radius: 24px
  Padding:       32px
  Max Width:     560px
  Shadow:        0 25px 50px rgba(0, 0, 0, 0.25)

Animation:
  Enter:         Scale 0.95 → 1, opacity 0 → 1, 200ms
  Exit:          Scale 1 → 0.95, opacity 1 → 0, 150ms
```

---

### 9. Buttons

**Primary Button:**
```
Background:    rgba(0, 122, 255, 0.3)
Backdrop:      blur(8px)
Border:        1px solid rgba(0, 122, 255, 0.4)
Border Radius: 12px
Padding:       10px 20px
Color:         white
Font Weight:   500

Hover:
  Background:    rgba(0, 122, 255, 0.4)
  Shadow:        0 4px 16px rgba(0, 122, 255, 0.2)

Active:
  Transform:     scale(0.97)
```

**Secondary Button:**
```
Background:    glass-sm
Border:        1px solid rgba(255, 255, 255, 0.2)
Color:         var(--glass-text)
```

**Icon Button:**
```
Size:          36px circular
Background:    transparent
Border:        none
Hover:         glass-sm background
Active:        scale(0.95)
```

---

### 10. Form Inputs

```
Background:    glass-sm (blur 8px)
Border:        1px solid rgba(255, 255, 255, 0.2)
Border Radius: 12px
Padding:       12px 16px
Color:         var(--glass-text)

Focus:
  Border:        1px solid rgba(0, 122, 255, 0.5)
  Shadow:        0 0 0 3px rgba(0, 122, 255, 0.1)
  Background:    glass-md

Error:
  Border:        1px solid rgba(255, 59, 48, 0.5)
  Shadow:        0 0 0 3px rgba(255, 59, 48, 0.1)
```

---

### 11. Status Indicators

**Sync Status:**
```
🟢 Online:    Green dot with glow, "Synced"
🔄 Syncing:   Blue dot, pulse animation, "Syncing..."
🏠 Local:      Gray dot, "Local only"
🔒 Encrypted:  Lock icon, "Encrypted"
```

**Model Status:**
```
🟢 Loaded:     Green, "Active"
⚪ Unloaded:   Gray, "Tap to load"
🟡 Loading:    Yellow spinner, "Loading..."
🔴 Error:      Red, "Failed"
```

---

### 12. Scrollbars

```
Width:         8px
Track:         Transparent
Thumb:
  Background:    rgba(255, 255, 255, 0.2)
  Border Radius: 9999px
  Border:        2px solid transparent (padding effect)

Thumb Hover:
  Background:    rgba(255, 255, 255, 0.3)
```

---

### 13. Animations & Micro-interactions

**Glass Morph (state transitions):**
```
Duration:      300ms
Easing:        cubic-bezier(0.4, 0, 0.2, 1)
Properties:    background, backdrop-filter, border-color, transform
```

**Message Appear:**
```
Initial:       opacity 0, translateY(10px)
Animate:       opacity 1, translateY(0)
Duration:      200ms
Easing:        ease-out
```

**Typing Indicator:**
```
Three dots, staggered pulse:
  Dot 1:       0ms delay
  Dot 2:       150ms delay
  Dot 3:       300ms delay
  Animation:   scale 0.5 → 1, opacity 0.3 → 1, 600ms, infinite
```

**Shimmer Effect (loading states):**
```
Background:    linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)
Background Size: 200% 100%
Animation:     background-position -200% → 200%, 2s, infinite
```

**Panel Slide:**
```
Sidebar:       translateX(-100%) → translateX(0), 300ms, spring
Inspector:     translateX(100%) → translateX(0), 300ms, spring
Bottom Sheet:  translateY(100%) → translateY(0), 400ms, spring (mobile)
```

---

## 🖼️ Background Treatments

### Background Extension (Key Liquid Glass Feature)

The main content background (gradient, image, or abstract art) extends under the sidebar and inspector with heavy blur:

```css
.content-area {
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.content-area::before {
  content: '';
  position: absolute;
  inset: 0;
  background: inherit;
  filter: blur(60px) saturate(1.2);
  opacity: 0.6;
  z-index: -1;
}
```

**Dynamic Background Options:**
1. **Gradient Mesh:** Animated mesh gradient (purple/blue/pink)
2. **Abstract Art:** Generative art that responds to conversation
3. **Ambient Video:** Subtle looping video (particles, aurora)
4. **User Image:** User's chosen wallpaper with blur
5. **Dark Matter:** Dark with subtle floating particles

---

## 📱 Platform-Specific Adaptations

### macOS
- **Traffic Lights:** Native window controls, glass title bar
- **Menu Bar:** Glass menu bar integration
- **Split View:** Support for macOS split view
- **Touch Bar:** Glass touch bar controls (if applicable)

### iOS
- **Safe Areas:** Respect `env(safe-area-inset-*)`
- **Bottom Sheet:** Inspector pulls up from bottom
- **Haptic:** Light impact on button press, medium on send
- **Pull to Refresh:** Glass refresh indicator
- **Swipe Actions:** Swipe thread to pin/delete

### Web
- **PWA:** Install prompt, offline glass shell
- **Responsive:** Breakpoints at 768px (tablet) and 1024px (desktop)
- **Browser Chrome:** Account for mobile browser UI

---

## 🎨 Color Palette (Per Theme)

### Light Glass
```
Background:      #F5F5F7 (system gray)
Glass Surface:   rgba(255, 255, 255, 0.25)
Text Primary:    #1D1D1F
Text Secondary:  #86868B
Accent:          #007AFF (blue)
Success:         #34C759 (green)
Warning:         #FF9500 (orange)
Error:           #FF3B30 (red)
```

### Dark Glass
```
Background:      #000000
Glass Surface:   rgba(30, 30, 30, 0.15)
Text Primary:    #FFFFFF
Text Secondary:  #98989D
Accent:          #0A84FF (blue)
Success:         #30D158 (green)
Warning:         #FF9F0A (orange)
Error:           #FF453A (red)
```

### Tinted Glass (Blue)
```
Background:      #1a1a2e
Glass Surface:   rgba(100, 149, 237, 0.25)
Text Primary:    #FFFFFF
Accent:          #6495ED (cornflower blue)
```

---

## 🔤 Typography

```
Font Family:     -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif
Monospace:       "SF Mono", "JetBrains Mono", monospace

Hierarchy:
  Display:       32px / 40px, bold
  Title 1:       24px / 32px, semibold
  Title 2:       20px / 28px, semibold
  Title 3:       18px / 24px, medium
  Body:          16px / 24px, regular
  Callout:       14px / 20px, medium
  Footnote:      12px / 16px, regular
  Caption:       11px / 14px, medium (uppercase for labels)
```

---

## 🎯 Priority Screens for Open Design

### P0 (Must Design First)
1. **Main Chat View** (desktop + mobile)
2. **Thread List Sidebar**
3. **Chat Input with Glass Treatment**
4. **Message Bubbles (User + AI)**
5. **Model Selector Dropdown**
6. **Settings / Preferences**

### P1 (Next)
7. **Onboarding Flow**
8. **Model Hub / Browser**
9. **Provider Settings (API Keys)**
10. **Project / Folder Management**
11. **Skill Builder / Panel**

### P2 (Later)
12. **Workflow Editor**
13. **Canvas / Artifact Viewer**
14. **Voice Mode Screen**
15. **Knowledge Graph**
16. **Ambient Mode**
17. **Split-Model Comparison**

---

## 📦 Deliverables Needed from Open Design

1. **Figma File** with:
   - All P0 screens (desktop 1440px, mobile 375px)
   - Component library (glass variants, buttons, inputs, cards)
   - Color styles (4 themes)
   - Text styles (full hierarchy)
   - Effect styles (shadows, blurs)

2. **Design Tokens** (JSON):
   ```json
   {
     "theme": {
       "light": { "glassBg": "rgba(255,255,255,0.25)", ... },
       "dark": { "glassBg": "rgba(30,30,30,0.15)", ... }
     },
     "blur": { "sm": "8px", "md": "20px", "lg": "40px" },
     "radius": { "sm": "8px", "md": "12px", "lg": "16px", "xl": "24px" }
   }
   ```

3. **Asset Exports**:
   - Icons (SVG, 24x24 base)
   - App icon (with glass treatment)
   - Empty state illustrations
   - Loading animations (Lottie)

4. **Prototype**:
   - Clickable flow: Onboarding → Chat → Settings
   - Micro-interactions demo
   - Theme switching

---

## 🔗 Reference Links

- **Apple Liquid Glass:** https://developer.apple.com/documentation/SwiftUI/Landmarks-Building-an-app-with-Liquid-Glass
- **Current CSS Implementation:** `web-app/src/styles/liquid-glass.css`
- **Existing Theme:** `web-app/src/index.css`
- **Project Repo:** https://github.com/AtomicBot-ai/Atomic-Chat

---

## ✅ Acceptance Criteria

- [ ] All glass surfaces use `backdrop-filter: blur()` with fallback
- [ ] Four themes (light/dark/clear/tinted) are visually distinct
- [ ] Background extension effect works on main content area
- [ ] Content remains readable on all background types
- [ ] Animations are smooth (60fps) on target devices
- [ ] Reduced motion preference is respected
- [ ] Design works at all breakpoints (375px → 1440px+)
- [ ] macOS, iOS, and web feel native to their platforms
- [ ] Accessibility: WCAG 2.1 AA contrast ratios met

---

*Prompt version: 1.0*  
*Created: 2026-05-16*  
*For: Open Design / Atomic Chat UI Package*
