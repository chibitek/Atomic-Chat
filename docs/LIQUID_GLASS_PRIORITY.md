# Atomic Chat Feature Priority — Re-ranked with Liquid Glass UI

> **Date:** 2026-05-16  
> **Theme:** Liquid Glass (Apple iOS 26/macOS 16 design language)  
> **Status:** UI-first implementation

---

## 🏗️ New Priority Stack

### Phase 0: Liquid Glass Foundation (Week 1)
**Status:** ✅ CSS system created, Open Design prompt ready

| Feature | Status | Files |
|---------|--------|-------|
| Liquid Glass CSS System | ✅ Complete | `web-app/src/styles/liquid-glass.css` |
| 4 Theme Variants | ✅ Complete | Light, Dark, Clear, Tinted |
| Open Design Prompt | ✅ Complete | `docs/OPEN_DESIGN_PROMPT.md` |
| Theme Integration | ✅ Complete | Added to `index.css` |

**Next:** Send Open Design prompt to generate Figma designs

---

### Phase 1: Core UI with Liquid Glass (Weeks 2-3)
**Dependency:** Open Design delivers Figma files

| Feature | Priority | Why |
|---------|----------|-----|
| **Main Chat View** | P0 | Primary user interface |
| **Thread List Sidebar** | P0 | Navigation backbone |
| **Chat Input (Glass)** | P0 | Core interaction |
| **Message Bubbles** | P0 | Conversation display |
| **Model Selector** | P0 | Multi-model switching |
| **Settings Panel** | P0 | Configuration |
| **Onboarding Flow** | P1 | First impression |
| **Auth Screens** | P1 | Sign in/up |

**Liquid Glass Features to Implement:**
- [ ] Background extension (content under sidebar)
- [ ] Glass sidebar (blur 40px)
- [ ] Glass toolbar (floating pill)
- [ ] Glass message bubbles (user = blue tint, AI = neutral)
- [ ] Glass input area (blur + gradient fade)
- [ ] Glass modals (blur 60px)
- [ ] Glass cards (hover lift effect)
- [ ] Morphing animations (state transitions)
- [ ] Specular highlights (top-edge shine)
- [ ] Shimmer loading states

---

### Phase 2: Platform Polish (Week 4)

| Platform | Specific Features |
|----------|-------------------|
| **macOS** | Traffic light integration, native title bar, menu bar glass |
| **iOS** | Bottom sheets, safe areas, haptic feedback, pull-to-refresh |
| **Web** | PWA shell, responsive breakpoints, browser chrome awareness |

---

### Phase 3: Power Features (Weeks 5-8)
**Re-ranked based on user value + Liquid Glass fit**

| Rank | Feature | Week | Glass Integration |
|------|---------|------|-------------------|
| 1 | **Skills System** | 5 | Skill cards with glass, builder panel |
| 2 | **Canvas/Artifacts** | 6 | Split-pane glass editor, version timeline |
| 3 | **Voice Interface** | 6 | Full-screen glass waveform, voice mode |
| 4 | **Projects/Folders** | 7 | Glass folder tree, drag-and-drop |
| 5 | **Workflows** | 7 | Visual node editor with glass nodes |
| 6 | **Split-Model Chat** | 8 | Side-by-side glass panes |
| 7 | **Scheduler/Agents** | 8 | Glass dashboard, task cards |
| 8 | **Knowledge Graph** | 9 | Glass node visualization |
| 9 | **Ambient Mode** | 9 | Full-screen glass animation |
| 10 | **Model Personality** | 10 | Color auras, glass badges |

---

## 🎨 Liquid Glass Feature Integration

### How Each Feature Uses Liquid Glass

| Feature | Glass Element | Visual Effect |
|---------|---------------|---------------|
| **Chat Messages** | Bubble backgrounds | User = blue-tinted glass, AI = neutral glass |
| **Sidebar** | Panel background | Content extends underneath with blur |
| **Toolbar** | Floating bar | Pill-shaped, glass with shadow |
| **Model Selector** | Dropdown panel | Glass menu with model icons |
| **Settings** | Cards | Glass cards with hover lift |
| **Skills** | Cards + Builder | Glass skill cards, builder sidebar |
| **Canvas** | Editor panes | Split glass panes (code + preview) |
| **Voice** | Full-screen | Waveform on glass background |
| **Workflows** | Nodes | Glass node shapes with connections |
| **Ambient** | Background | Full-screen glass morphing animation |

---

## 🚀 Implementation Order (Updated)

### Week 1: ✅ DONE
- [x] Create Liquid Glass CSS system
- [x] Define 4 theme variants
- [x] Write Open Design prompt
- [x] Integrate CSS into build

### Week 2: Open Design → Code
- [ ] Receive Figma designs from Open Design
- [ ] Implement glass sidebar component
- [ ] Implement glass toolbar
- [ ] Implement glass message bubbles
- [ ] Implement glass input area

### Week 3: Chat Interface
- [ ] Thread list with glass items
- [ ] Model selector dropdown
- [ ] Settings panel with glass cards
- [ ] Onboarding flow
- [ ] Auth screens

### Week 4: Platform Polish
- [ ] macOS native chrome
- [ ] iOS bottom sheets + haptics
- [ ] Web responsive + PWA
- [ ] Animation performance (60fps)

### Week 5: Skills System
- [ ] Skill card component (glass)
- [ ] Skill panel sidebar
- [ ] Skill builder form
- [ ] Skill marketplace browser

### Week 6: Canvas + Voice
- [ ] Artifact viewer (split glass panes)
- [ ] Code execution panel
- [ ] Voice mode screen (glass waveform)
- [ ] Voice settings

### Week 7: Projects + Workflows
- [ ] Project folder tree (glass)
- [ ] File browser (glass cards)
- [ ] Workflow editor (glass nodes)
- [ ] Workflow runner

### Week 8: Advanced Features
- [ ] Split-model comparison (glass panes)
- [ ] Scheduler dashboard (glass cards)
- [ ] Agent monitor
- [ ] Knowledge graph (glass nodes)

### Week 9: Delight
- [ ] Ambient mode (full-screen glass)
- [ ] Model personality (color auras)
- [ ] Micro-interactions polish
- [ ] Theme transitions

---

## 🎯 What to Tell Open Design (Summary)

> "Design Atomic Chat with **Liquid Glass** as the default visual language. Think Apple's iOS 26 design: translucent surfaces, backdrop blur, content extending behind panels, specular highlights, and morphing animations. Four themes: Light, Dark, Clear, Tinted. Priority screens: Main Chat (3-panel desktop, single-panel mobile), Thread List Sidebar, Chat Input, Message Bubbles, Model Selector, Settings. All components should feel like they're made of glass — light passes through, content is visible underneath, surfaces respond to interaction with brightness changes."

---

## 📁 Files Ready for Open Design

| File | Purpose |
|------|---------|
| `docs/OPEN_DESIGN_PROMPT.md` | **Main prompt** — send this to Open Design |
| `web-app/src/styles/liquid-glass.css` | CSS implementation reference |
| `web-app/src/index.css` | Current theme (for color reference) |
| `docs/FEATURE_ROADMAP.md` | Full feature list with specs |

---

## ✅ Checklist Before Open Design

- [x] Liquid Glass CSS system created
- [x] Theme variants defined (light/dark/clear/tinted)
- [x] Component specifications written
- [x] Layout architecture documented
- [x] Animation guidelines defined
- [x] Platform adaptations noted
- [x] Priority screens ranked
- [x] Deliverables specified

**Ready to send to Open Design! 🚀**

---

*Document version: 1.0*  
*Last updated: 2026-05-16*
