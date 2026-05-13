# Neural OPS

AI agent orchestration platform — multi-agent pipeline with real-time Claude streaming, workflow graph, browser replay, and voice narration.

> **Demo GIF placeholder** — record with Loom or `npx @screencapture/cli` after running locally

## Stack

- **Next.js 14** App Router · TypeScript · Tailwind CSS
- **Anthropic SDK** — `claude-sonnet-4-6` streaming via SSE
- **ReactFlow** — live workflow graph
- **Framer Motion** — 60fps animations throughout
- **Web Speech API** — voice narration of final summary

## Setup

### 1. Clone & install

```bash
git clone https://github.com/your-username/neural-ops.git
cd neural-ops
npm install
```

### 2. Configure environment

```bash
cp .env.local .env.local.bak   # backup
```

Edit `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-...        # required — get from console.anthropic.com
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
```

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard).

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘K` | Focus command input |
| `⌘↵` | Execute pipeline |
| `Esc` | Stop execution / close modal |
| `⌘E` | Export report as `.md` |

---

## Agent Pipeline

```
User Query
  └── Planner          decomposes intent into sub-tasks
       ├── Research    synthesizes information           (parallel)
       ├── Browser     web navigation + extraction       (parallel)
       └── Finance     technical + quantitative analysis
            ├── Voice   spoken narration via Web Speech API
            └── Summary structured JSON final report
```

---

## Features

| Feature | Details |
|---------|---------|
| **Streaming** | Token-by-token Claude output in agent cards |
| **Thinking shimmer** | Purple gradient sweep while waiting for first token |
| **Workflow graph** | ReactFlow with animated edges during active steps |
| **Voice narration** | Web Speech API reads summary aloud; animated waveform |
| **Run history** | Last 5 runs in sidebar; click to replay |
| **Simulate failure** | Toggle forces browser agent to fail once then retry |
| **Export** | Full pipeline output as formatted Markdown |
| **Mobile** | Responsive layout with hamburger drawer |

---

## Deploy to Vercel

```bash
npm i -g vercel

# Add your API key as a Vercel secret
vercel env add ANTHROPIC_API_KEY

vercel deploy --prod
```

Or one-click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/neural-ops)

---

## Project Structure

```
app/
  page.tsx                       Landing page
  dashboard/page.tsx             Command center
  api/agent/route.ts             Streaming Claude API route
components/dashboard/
  agent-fleet.tsx                Agent status cards + waveform
  browser-replay.tsx             Browser chrome simulation
  command-input.tsx              Terminal input + failure toggle
  final-report.tsx               Results modal with export
  infra-heatmap.tsx              Metrics grid
  live-log.tsx                   Streaming log panel
  memory-nodes.tsx               KV memory store
  sidebar.tsx                    Nav + run history panel
  topbar.tsx                     Status + mobile menu
  waveform.tsx                   Animated audio bars
  workflow-graph.tsx             ReactFlow graph
hooks/
  use-dashboard.ts               State machine (useReducer)
  use-speech.ts                  Web Speech API wrapper
  use-workflow-history.ts        localStorage run history
```
