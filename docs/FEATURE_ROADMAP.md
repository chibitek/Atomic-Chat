# Atomic Chat Feature Roadmap: Next-Gen AI Platform

> **Date:** 2026-05-16  
> **Status:** Planning / Architecture  
> **Goal:** Match and exceed Claude, ChatGPT, and leading AI platforms

---

## 📊 Feature Comparison Matrix

| Feature | ChatGPT | Claude | Gemini | Atomic Chat (Current) | Atomic Chat (Planned) |
|---------|---------|--------|--------|----------------------|----------------------|
| **Chat** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Multi-model** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Local LLMs** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Projects / Folders** | ✅ (Projects) | ✅ (Projects) | ❌ | ✅ (Basic) | ✅ (Advanced) |
| **Skills / GPTs** | ✅ (GPTs) | ✅ (Projects) | ❌ | ❌ | ✅ |
| **Workflows** | ❌ | ✅ (Artifacts) | ❌ | ❌ | ✅ |
| **Voice Input** | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Voice Output (TTS)** | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Scheduling / Agents** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Canvas / Artifacts** | ✅ (Canvas) | ✅ (Artifacts) | ❌ | ❌ | ✅ |
| **Knowledge Graph** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Real-time Sync** | ✅ | ❌ | ❌ | ✅ | ✅ |
| **E2E Encryption** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **MCP Tools** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Split-Model Compare** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Ambient Mode** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Model Personality** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Code Execution** | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Image Generation** | ✅ (DALL-E) | ❌ | ✅ | ❌ | ✅ |
| **Web Search** | ✅ | ❌ | ✅ | ❌ | ✅ |
| **Memory / Long-term** | ✅ | ✅ | ❌ | ❌ | ✅ |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  UI Layer (React + Tailwind + Framer Motion)                │
│  ├─ Chat Interface                                          │
│  ├─ Project / Folder Management                             │
│  ├─ Skill Builder / Marketplace                             │
│  ├─ Workflow Editor (Visual)                                │
│  ├─ Canvas / Artifact Viewer                                │
│  ├─ Knowledge Graph Visualization                           │
│  ├─ Voice Interface (Input/Output)                          │
│  ├─ Scheduler / Agent Dashboard                             │
│  └─ Split-Model Comparison                                  │
├─────────────────────────────────────────────────────────────┤
│  State Management (Zustand Stores)                          │
│  ├─ chatStore (threads, messages, streaming)              │
│  ├─ projectStore (folders, organization)                  │
│  ├─ skillStore (skills, versions, marketplace)              │
│  ├─ workflowStore (workflows, executions)                 │
│  ├─ voiceStore (recording, playback, TTS)                 │
│  ├─ scheduleStore (tasks, triggers, history)              │
│  ├─ canvasStore (artifacts, versions, diffs)              │
│  ├─ knowledgeStore (graph, embeddings, search)            │
│  └─ modelStore (personalities, parameters, compare)         │
├─────────────────────────────────────────────────────────────┤
│  Service Layer                                              │
│  ├─ LLM Service (multi-provider, streaming)               │
│  ├─ Skill Engine (skill loading, execution)               │
│  ├─ Workflow Engine (DAG execution, state)                │
│  ├─ Voice Service (STT, TTS, wake word)                   │
│  ├─ Scheduler Service (cron, triggers, agents)            │
│  ├─ Canvas Service (artifact CRUD, diff, render)            │
│  ├─ Knowledge Service (graph, RAG, search)                │
│  ├─ Code Execution (sandbox, interpreter)                 │
│  ├─ Image Generation (SD, DALL-E, etc.)                   │
│  └─ Web Search (serper, brave, etc.)                      │
├─────────────────────────────────────────────────────────────┤
│  Data Layer (Supabase + Local)                              │
│  ├─ PostgreSQL (structured data)                          │
│  ├─ Vector DB (embeddings, RAG)                           │
│  ├─ Local Storage (offline cache, settings)               │
│  ├─ File System (attachments, models, artifacts)        │
│  └─ Realtime (WebSocket sync)                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Feature Deep Dives

---

### 1. Projects & Folders (Enhanced)

**Current State:** Basic `ThreadFolder` in localStorage  
**Target:** Full project system like Claude/ChatGPT

#### Features
- **Projects** = container for threads + files + settings
- **Folders** = nested organization within projects
- **Tags** = cross-cutting labels
- **Templates** = project blueprints (e.g., "Code Review", "Blog Writing")
- **Shared Projects** = team collaboration with permissions

#### Data Model
```typescript
interface Project {
  id: string
  name: string
  description?: string
  icon?: string          // emoji or custom
  color?: string         // theme color
  parentId?: string      // nested folders
  threads: string[]       // thread IDs
  files: ProjectFile[]   // attachments, knowledge
  settings: ProjectSettings
  templates?: string[]   // applied templates
  collaborators?: Collaborator[]
  createdAt: number
  updatedAt: number
}

interface ProjectFile {
  id: string
  name: string
  type: 'document' | 'code' | 'image' | 'data'
  content?: string       // for text files
  embedding?: number[]   // for RAG
  metadata: {
    size: number
    mimeType: string
    source: 'upload' | 'web' | 'generated'
  }
}

interface ProjectSettings {
  defaultModel: string
  defaultSystemPrompt?: string
  temperature: number
  skills: string[]       // active skills
  knowledgeBases: string[] // linked KBs
  autoSave: boolean
  shareSettings: ShareSettings
}
```

#### UI Components
- **Project Sidebar:** Tree view with drag-and-drop
- **Project Header:** Icon, name, settings, share
- **File Browser:** List/grid view, preview pane
- **Template Gallery:** Pre-built project templates

---

### 2. Skills System (Like GPTs / Claude Projects)

**Current State:** None  
**Target:** Reusable, shareable, versioned skills

#### What is a Skill?
A skill is a reusable configuration that customizes the AI for a specific task:
- **System prompt** (personality, instructions)
- **Tools** (MCP servers, APIs, code execution)
- **Knowledge** (files, embeddings, web sources)
- **Parameters** (temperature, max tokens, etc.)
- **Workflow** (pre-defined steps)

#### Skill Types
| Type | Description | Example |
|------|-------------|---------|
| **Persona** | Personality + expertise | "Sarcastic Python Expert" |
| **Task** | Specific task configuration | "Code Reviewer" |
| **Agent** | Autonomous with tools | "Research Assistant" |
| **Workflow** | Multi-step process | "Blog Post Writer" |

#### Data Model
```typescript
interface Skill {
  id: string
  name: string
  description: string
  version: string          // semver
  author: string
  icon: string
  color: string
  
  // Core configuration
  systemPrompt: string
  model: string            // default model
  parameters: ModelParameters
  
  // Tools & capabilities
  tools: ToolConfig[]      // MCP tools, APIs
  knowledge: KnowledgeConfig[] // files, URLs, embeddings
  
  // Workflow (optional)
  workflow?: WorkflowDefinition
  
  // UI customization
  ui: SkillUIConfig
  
  // Metadata
  tags: string[]
  rating: number
  downloads: number
  isPublic: boolean
  isOfficial: boolean
  createdAt: number
  updatedAt: number
}

interface SkillUIConfig {
  inputType: 'chat' | 'form' | 'canvas' | 'voice'
  showThinking: boolean
  showSources: boolean
  customCSS?: string
  welcomeMessage?: string
  suggestedPrompts: string[]
}
```

#### Skill Marketplace
- Browse, search, filter skills
- Install with one click
- Rate and review
- Fork and customize
- Publish your own

#### UI Components
- **Skill Builder:** Visual editor for creating skills
- **Skill Panel:** Sidebar showing active skills
- **Skill Store:** Marketplace browser
- **Skill Switcher:** Quick toggle between skills

---

### 3. Workflows (Visual + Code)

**Current State:** None  
**Target:** Visual workflow editor + code-based definitions

#### What is a Workflow?
A directed acyclic graph (DAG) of steps that the AI executes:
```
[User Input] → [Step 1: Research] → [Step 2: Draft] → [Step 3: Review] → [Output]
                ↓                      ↓                      ↓
           [Web Search]          [Generate Text]        [Critique]
```

#### Workflow Definition (YAML/JSON)
```yaml
name: Blog Post Writer
version: 1.0.0

steps:
  - id: research
    name: Research Topic
    type: llm
    model: claude-sonnet-4-6
    prompt: |
      Research the topic: {{input.topic}}
      Find 5 key points and sources.
    output: research_notes
    
  - id: outline
    name: Create Outline
    type: llm
    model: claude-sonnet-4-6
    prompt: |
      Based on this research:
      {{steps.research.output}}
      Create a detailed outline for a blog post.
    output: outline
    depends_on: [research]
    
  - id: draft
    name: Write Draft
    type: llm
    model: gpt-5
    prompt: |
      Write a blog post following this outline:
      {{steps.outline.output}}
    output: draft
    depends_on: [outline]
    
  - id: review
    name: Review & Edit
    type: llm
    model: claude-opus-4-7
    prompt: |
      Review this draft and suggest improvements:
      {{steps.draft.output}}
    output: review_notes
    depends_on: [draft]
    
  - id: finalize
    name: Finalize
    type: llm
    model: gpt-5
    prompt: |
      Apply these improvements to the draft:
      {{steps.review.output}}
      Original draft: {{steps.draft.output}}
    output: final_post
    depends_on: [review]
    
  - id: publish
    name: Publish to WordPress
    type: action
    action: wordpress.publish
    input:
      title: {{input.topic}}
      content: {{steps.finalize.output}}
    depends_on: [finalize]
```

#### Step Types
| Type | Description |
|------|-------------|
| `llm` | AI generation step |
| `action` | External API call (Zapier-like) |
| `condition` | If/else branch |
| `loop` | Iterate over collection |
| `parallel` | Run steps concurrently |
| `human` | Pause for human input |
| `code` | Execute Python/JS code |
| `search` | Web or knowledge search |
| `memory` | Read/write long-term memory |

#### UI Components
- **Workflow Editor:** Visual node-based editor (like n8n, ComfyUI)
- **Workflow Runner:** Progress view, step-by-step execution
- **Workflow Library:** Pre-built templates
- **Workflow Debugger:** Step through, inspect variables

---

### 4. Voice Interface (Input + Output)

**Current State:** None  
**Target:** Full voice mode like ChatGPT Voice

#### Features
- **Voice Input:** Wake word ("Hey Atomic"), push-to-talk, continuous
- **Voice Output:** TTS with multiple voices, speed control
- **Voice Mode UI:** Full-screen waveform, transcript, interrupt
- **Voice Commands:** "Switch to Claude", "Save this", "Search web"

#### Architecture
```
[Microphone] → [VAD] → [STT] → [LLM] → [TTS] → [Speaker]
                ↑        ↑        ↑        ↑
           (silero)  (whisper)  (atomic) (elevenlabs/
                                          openai/piper)
```

#### Data Model
```typescript
interface VoiceConfig {
  input: {
    mode: 'push_to_talk' | 'wake_word' | 'continuous'
    wakeWord: string
    vadSensitivity: number
    sttModel: 'whisper-local' | 'whisper-api' | 'deepgram'
    language: string
  }
  output: {
    enabled: boolean
    voice: string           // voice ID
    speed: number           // 0.5 - 2.0
    model: 'elevenlabs' | 'openai' | 'piper-local'
    autoPlay: boolean
  }
  commands: VoiceCommand[]
}

interface VoiceCommand {
  trigger: string          // "switch to {model}"
  action: string          // "switch_model"
  parameters: Record<string, string>
}
```

#### UI Components
- **Voice Button:** In chat input, pulse animation when listening
- **Voice Mode Screen:** Full-screen with waveform visualization
- **Voice Settings:** Voice selection, speed, wake word
- **Transcript Panel:** Real-time transcription display

---

### 5. Scheduler & Agents (Autonomous Tasks)

**Current State:** None  
**Target:** Cron jobs, event triggers, autonomous agents

#### Features
- **Scheduled Tasks:** "Every morning at 9am, summarize my emails"
- **Event Triggers:** "When I get a GitHub PR, review it"
- **Recurring Chats:** "Weekly planning session every Monday"
- **Agent Loop:** Continuous monitoring + action

#### Data Model
```typescript
interface ScheduledTask {
  id: string
  name: string
  description: string
  
  // Trigger
  trigger: {
    type: 'cron' | 'interval' | 'event' | 'webhook'
    cron?: string           // "0 9 * * 1" (Mondays 9am)
    interval?: number        // minutes
    event?: EventTrigger     // "github.pr.opened"
    webhook?: WebhookConfig
  }
  
  // Action
  action: {
    type: 'chat' | 'workflow' | 'skill' | 'code' | 'notify'
    config: Record<string, unknown>
  }
  
  // Context
  projectId?: string
  threadId?: string
  skillId?: string
  workflowId?: string
  
  // Execution
  status: 'active' | 'paused' | 'error'
  lastRun?: number
  nextRun?: number
  runCount: number
  errorCount: number
  
  // History
  history: TaskRun[]
}

interface TaskRun {
  id: string
  taskId: string
  startedAt: number
  completedAt?: number
  status: 'running' | 'success' | 'error' | 'cancelled'
  output?: string
  error?: string
  tokensUsed: number
  cost: number
}
```

#### UI Components
- **Scheduler Dashboard:** Calendar view, list view
- **Task Builder:** Form-based task creation
- **Agent Monitor:** Live agent status, logs
- **Run History:** Past executions, outputs

---

### 6. Canvas / Artifacts (Interactive Documents)

**Current State:** None  
**Target:** Like Claude Artifacts + ChatGPT Canvas

#### What are Artifacts?
Interactive, versioned documents that the AI can create and edit:
- **Documents** (markdown, rich text)
- **Code** (with syntax highlighting, execution)
- **Diagrams** (Mermaid, Graphviz)
- **Spreadsheets** (tables with formulas)
- **Web Pages** (HTML/CSS/JS preview)
- **Data Visualizations** (charts, graphs)

#### Features
- **Create:** AI generates artifact from prompt
- **Edit:** Inline editing with AI assistance
- **Version:** History of changes, diff view
- **Fork:** Create copy to experiment
- **Share:** Export, publish, collaborate
- **Embed:** Use artifact in other threads

#### Data Model
```typescript
interface Artifact {
  id: string
  threadId: string
  type: ArtifactType
  title: string
  content: string           // current version
  language?: string         // for code
  
  // Versions
  versions: ArtifactVersion[]
  currentVersion: number
  
  // UI state
  viewMode: 'split' | 'code' | 'preview' | 'diff'
  width: 'narrow' | 'medium' | 'wide' | 'full'
  
  // Metadata
  createdAt: number
  updatedAt: number
  author: string
  isPublic: boolean
}

interface ArtifactVersion {
  id: string
  version: number
  content: string
  changes: string           // AI-generated change summary
  createdAt: number
  createdBy: string        // 'user' | 'assistant' | 'system'
}

type ArtifactType = 
  | 'document'      // Markdown, rich text
  | 'code'          // Any programming language
  | 'diagram'       // Mermaid, Graphviz
  | 'spreadsheet'   // CSV-like with formulas
  | 'webpage'       // HTML/CSS/JS
  | 'chart'         // Data visualization
  | 'math'          // LaTeX equations
  | 'sql'           // SQL with execution
```

#### UI Components
- **Artifact Viewer:** Split-pane (code + preview)
- **Artifact Toolbar:** Edit, fork, share, export, version history
- **Artifact Gallery:** Browse all artifacts in a project
- **Inline Artifact:** Embedded in chat messages

---

### 7. Knowledge Graph (Thread Connections)

**Current State:** None  
**Target:** Visual graph of all knowledge

#### Features
- **Thread Graph:** Visual connections between threads
- **Topic Clustering:** Auto-group by topic
- **Entity Extraction:** People, places, concepts
- **Semantic Search:** Find related content
- **Timeline View:** Chronological exploration

#### Data Model
```typescript
interface KnowledgeGraph {
  nodes: KnowledgeNode[]
  edges: KnowledgeEdge[]
}

interface KnowledgeNode {
  id: string
  type: 'thread' | 'message' | 'entity' | 'topic' | 'file' | 'artifact'
  label: string
  content?: string
  embedding?: number[]
  metadata: Record<string, unknown>
  x?: number              // layout position
  y?: number
}

interface KnowledgeEdge {
  source: string
  target: string
  type: 'reply' | 'reference' | 'similar' | 'contains' | 'mentions'
  weight: number          // 0-1 similarity
}
```

#### UI Components
- **Graph Canvas:** Interactive D3/Force-directed graph
- **Node Inspector:** Click to see details
- **Filter Controls:** By type, date, project
- **Search Overlay:** Find and highlight nodes
- **Timeline Slider:** Filter by time range

---

### 8. Split-Model Chat (A/B Testing)

**Current State:** None  
**Target:** Compare two models side-by-side

#### Features
- **Side-by-side:** Two panes, same prompt, different models
- **A/B Mode:** Blind comparison, vote for better response
- **Multi-model:** Compare 2-4 models simultaneously
- **Metrics:** Token speed, cost, quality score

#### Data Model
```typescript
interface SplitChat {
  id: string
  threadId: string
  prompt: string
  
  branches: SplitBranch[]
  
  // Comparison
  userVote?: string        // branch ID voted best
  autoScore?: SplitScore   // AI-evaluated quality
}

interface SplitBranch {
  id: string
  modelId: string
  provider: string
  messages: ThreadMessage[]
  status: 'loading' | 'streaming' | 'complete' | 'error'
  metrics: BranchMetrics
}

interface BranchMetrics {
  tokensIn: number
  tokensOut: number
  timeMs: number
  tokensPerSecond: number
  cost: number
  quality?: number         // 0-100
}
```

#### UI Components
- **Split View:** 2-4 vertical panes
- **Comparison Bar:** Metrics side-by-side
- **Voting Buttons:** 👍 / 👎 per response
- **Model Selector:** Per-pane model picker

---

### 9. Ambient Mode (Idle Visualization)

**Current State:** None  
**Target:** Beautiful idle screen

#### Features
- **Attention Heatmap:** Abstract visualization of model attention
- **Token Flow:** Animated stream of tokens
- **Model State:** Current model, temperature, mood
- **System Status:** CPU, memory, sync status
- **Recent Activity:** Floating bubbles of recent threads

#### Implementation
```typescript
interface AmbientConfig {
  visualization: 'heatmap' | 'tokens' | 'particles' | 'waveform'
  colorScheme: string
  speed: number
  complexity: number
  showStats: boolean
  showRecent: boolean
}
```

#### UI Components
- **Ambient Canvas:** Full-screen WebGL/Canvas animation
- **Stats Overlay:** Subtle system info
- **Recent Bubbles:** Floating thread previews
- **Wake Interaction:** Click/tap to exit ambient mode

---

### 10. Model Personality (Visual Identity)

**Current State:** None  
**Target:** Each model has a unique visual aura

#### Features
- **Color Aura:** Unique color per model (Claude = purple, GPT = green)
- **Avatar:** Model-specific icon/avatar
- **Typing Style:** Different cursor animations
- **Voice:** Unique TTS voice per model
- **Thinking Indicator:** Different animation styles

#### Data Model
```typescript
interface ModelPersonality {
  modelId: string
  
  // Visual
  color: string            // primary brand color
  gradient: [string, string] // aura gradient
  avatar: string           // SVG or emoji
  cursor: CursorStyle
  
  // Animation
  thinkingAnimation: 'pulse' | 'wave' | 'orbit' | 'sparkle'
  responseAnimation: 'fade' | 'slide' | 'typewriter' | 'stream'
  
  // Audio
  voiceId?: string         // TTS voice
  soundEffects?: boolean
  
  // Behavior
  greeting?: string
  farewell?: string
  emojiUsage: 'none' | 'minimal' | 'moderate' | 'heavy'
}
```

#### UI Components
- **Model Badge:** Color dot + name in header
- **Aura Effect:** Subtle glow around model responses
- **Avatar:** Model icon in thread list
- **Transition:** Smooth color transition on model switch

---

## 🗄️ Database Schema Additions

```sql
-- Projects (enhanced)
ALTER TABLE public.threads ADD COLUMN project_id UUID REFERENCES public.projects(id);
ALTER TABLE public.threads ADD COLUMN folder_path TEXT[] DEFAULT '{}';
ALTER TABLE public.threads ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Skills
CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  version TEXT DEFAULT '1.0.0',
  system_prompt TEXT,
  model TEXT,
  parameters JSONB DEFAULT '{}',
  tools JSONB DEFAULT '[]',
  knowledge JSONB DEFAULT '[]',
  workflow JSONB,
  ui_config JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  is_official BOOLEAN DEFAULT false,
  rating NUMERIC DEFAULT 0,
  downloads INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Workflows
CREATE TABLE public.workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  definition JSONB NOT NULL, -- DAG definition
  is_template BOOLEAN DEFAULT false,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Workflow Runs
CREATE TABLE public.workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'success', 'error', 'cancelled')),
  input JSONB,
  output JSONB,
  step_results JSONB DEFAULT '[]',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  tokens_used INTEGER DEFAULT 0,
  cost NUMERIC DEFAULT 0
);

-- Scheduled Tasks
CREATE TABLE public.scheduled_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('cron', 'interval', 'event', 'webhook')),
  trigger_config JSONB NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('chat', 'workflow', 'skill', 'code', 'notify')),
  action_config JSONB NOT NULL,
  project_id UUID REFERENCES public.projects(id),
  thread_id UUID REFERENCES public.threads(id),
  skill_id UUID REFERENCES public.skills(id),
  workflow_id UUID REFERENCES public.workflows(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error')),
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  run_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Artifacts
CREATE TABLE public.artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES public.threads(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('document', 'code', 'diagram', 'spreadsheet', 'webpage', 'chart', 'math', 'sql')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  language TEXT,
  versions JSONB DEFAULT '[]',
  current_version INTEGER DEFAULT 1,
  view_mode TEXT DEFAULT 'split',
  width TEXT DEFAULT 'medium',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Knowledge Graph Nodes
CREATE TABLE public.kg_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('thread', 'message', 'entity', 'topic', 'file', 'artifact')),
  label TEXT NOT NULL,
  content TEXT,
  embedding VECTOR(1536), -- pgvector
  metadata JSONB DEFAULT '{}',
  x NUMERIC,
  y NUMERIC
);

-- Knowledge Graph Edges
CREATE TABLE public.kg_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  source_id UUID REFERENCES public.kg_nodes(id) ON DELETE CASCADE,
  target_id UUID REFERENCES public.kg_nodes(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('reply', 'reference', 'similar', 'contains', 'mentions')),
  weight NUMERIC DEFAULT 1.0
);

-- Voice Config
CREATE TABLE public.voice_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  input_mode TEXT DEFAULT 'push_to_talk',
  wake_word TEXT DEFAULT 'Hey Atomic',
  stt_model TEXT DEFAULT 'whisper-local',
  output_enabled BOOLEAN DEFAULT true,
  voice_id TEXT,
  speed NUMERIC DEFAULT 1.0,
  tts_model TEXT DEFAULT 'openai',
  commands JSONB DEFAULT '[]'
);

-- Model Personalities
CREATE TABLE public.model_personalities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  model_id TEXT NOT NULL,
  color TEXT,
  gradient JSONB,
  avatar TEXT,
  thinking_animation TEXT DEFAULT 'pulse',
  response_animation TEXT DEFAULT 'fade',
  voice_id TEXT,
  greeting TEXT,
  farewell TEXT,
  emoji_usage TEXT DEFAULT 'minimal',
  UNIQUE(user_id, model_id)
);
```

---

## 🛠️ Implementation Priority

### Phase 1: Foundation (Weeks 1-2)
- [ ] Enhanced Projects & Folders
- [ ] Skill System (basic)
- [ ] Canvas / Artifacts (basic)

### Phase 2: Power User (Weeks 3-4)
- [ ] Workflows (visual editor)
- [ ] Split-Model Chat
- [ ] Knowledge Graph (basic)

### Phase 3: Autonomy (Weeks 5-6)
- [ ] Voice Interface (input + output)
- [ ] Scheduler / Agents
- [ ] Model Personality

### Phase 4: Polish (Weeks 7-8)
- [ ] Ambient Mode
- [ ] Advanced Workflows (conditions, loops)
- [ ] Skill Marketplace
- [ ] Knowledge Graph (advanced)

---

## 🎨 UI Component Requirements

### New Components Needed

| Component | Complexity | Used By |
|-----------|-----------|---------|
| `ProjectSidebar` | Medium | Projects, Folders |
| `ProjectHeader` | Low | Project view |
| `FileBrowser` | Medium | Projects, Knowledge |
| `SkillCard` | Low | Skill Store, Builder |
| `SkillBuilder` | High | Skill creation |
| `SkillPanel` | Medium | Chat sidebar |
| `WorkflowEditor` | Very High | Workflow creation |
| `WorkflowRunner` | Medium | Workflow execution |
| `WorkflowNode` | Medium | Workflow editor |
| `VoiceButton` | Low | Chat input |
| `VoiceModeScreen` | Medium | Voice interface |
| `WaveformVisualizer` | Medium | Voice, Ambient |
| `SchedulerDashboard` | Medium | Task management |
| `TaskBuilder` | Medium | Task creation |
| `ArtifactViewer` | High | Canvas, Artifacts |
| `ArtifactToolbar` | Low | Artifact actions |
| `CodeExecutor` | Medium | Code artifacts |
| `GraphCanvas` | Very High | Knowledge Graph |
| `GraphNode` | Medium | Knowledge Graph |
| `SplitChatView` | Medium | Model comparison |
| `SplitBranch` | Low | Split chat |
| `AmbientCanvas` | High | Ambient mode |
| `ModelAura` | Low | Model personality |
| `PersonalityBadge` | Low | Model indicator |

---

## 🔌 External APIs & Services

| Feature | Service | Cost |
|---------|---------|------|
| **STT** | Whisper (local) / Deepgram / AssemblyAI | Free / $0.0043/min |
| **TTS** | ElevenLabs / OpenAI / Piper (local) | $0.30/1K chars |
| **Voice Cloning** | ElevenLabs | $5/month |
| **Web Search** | Serper / Brave / Tavily | $0.001/query |
| **Code Execution** | E2B / Modal / Local Docker | $0.05/run |
| **Image Gen** | Stable Diffusion (local) / DALL-E / Midjourney | Variable |
| **Embeddings** | OpenAI / Local (all-MiniLM) | $0.02/1K tokens |
| **Vector DB** | Supabase pgvector / Pinecone / Qdrant | Free tier |
| **Workflow Triggers** | Zapier / Make / Webhooks | Variable |

---

## 📈 Success Metrics

| Metric | Target |
|--------|--------|
| **User Retention** | 40% D30 (vs 20% baseline) |
| **Session Length** | 15 min avg (vs 5 min baseline) |
| **Feature Adoption** | 60% use Projects, 30% use Skills |
| **Voice Usage** | 20% of mobile sessions |
| **Workflow Runs** | 5 per power user per week |
| **NPS Score** | 50+ |

---

*Document version: 1.0*  
*Last updated: 2026-05-16*
