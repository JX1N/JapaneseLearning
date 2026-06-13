# Japanese Learning App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first Japanese learning SPA with SRS vocabulary review, kana chart, grammar lessons, and listening practice.

**Architecture:** React SPA with HashRouter, Dexie.js IndexedDB for local data, GitHub Gist API for cross-device sync. Feature-based folder structure: each domain (kana, vocabulary, grammar, listening) owns its components, while shared infrastructure (db, utils, hooks, ui) sits at the top level.

**Tech Stack:** React 18 / TypeScript / Vite / Tailwind CSS / React Router v6 (HashRouter) / Dexie.js v4 / Vitest / gh-pages

---

## File Map

```
JapaneseLearning/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── .gitignore
├── public/
│   └── audio/               # Listening practice audio files (placeholder)
├── src/
│   ├── main.tsx             # Entry point, renders App
│   ├── App.tsx              # HashRouter + route definitions
│   ├── index.css            # Tailwind directives + global styles
│   ├── db/
│   │   └── database.ts      # Dexie schema, db instance export
│   ├── data/
│   │   ├── kana.ts          # Static arrays: HIRAGANA, KATAKANA (46 chars each)
│   │   ├── grammar.ts       # Built-in grammar points (N5 starter set)
│   │   └── vocabulary.ts    # Built-in starter vocabulary
│   ├── utils/
│   │   ├── srs.ts           # SM-2 algorithm: computeNextReview()
│   │   └── sync.ts          # GitHub Gist API: pullGist(), pushGist()
│   ├── hooks/
│   │   └── useSync.ts       # Auto-sync on mount + after study
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Layout.tsx   # Shell: header + <Outlet/> + BottomNav
│   │   │   └── MoreMenu.tsx # Slide-up panel for "更多" tab
│   │   ├── dashboard/
│   │   │   └── Dashboard.tsx
│   │   ├── kana/
│   │   │   ├── KanaPage.tsx
│   │   │   ├── KanaChart.tsx
│   │   │   └── KanaQuiz.tsx
│   │   ├── vocabulary/
│   │   │   ├── ReviewPage.tsx
│   │   │   ├── ReviewCard.tsx
│   │   │   └── WordManager.tsx
│   │   ├── grammar/
│   │   │   ├── GrammarList.tsx
│   │   │   └── GrammarDetail.tsx
│   │   ├── listening/
│   │   │   └── ListeningPage.tsx
│   │   ├── settings/
│   │   │   └── SettingsPage.tsx
│   │   └── ui/
│   │       └── Button.tsx
│   └── __tests__/
│       ├── srs.test.ts
│       └── sync.test.ts
```

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `index.html`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `tailwind.config.js`, `postcss.config.js`, `.gitignore`, `src/main.tsx`, `src/App.tsx`, `src/index.css`

- [ ] **Step 1: Scaffold with Vite**

```bash
cd E:/cc/JapaneseLearning
npm create vite@latest . -- --template react-ts
```

- [ ] **Step 2: Install dependencies**

```bash
cd E:/cc/JapaneseLearning
npm install react-router-dom dexie
npm install -D tailwindcss @tailwindcss/vite vitest gh-pages
```

Wait for all installs to complete. Tailwind CSS v4 uses `@tailwindcss/vite` plugin.

- [ ] **Step 3: Configure Vite (vite.config.ts)**

After scaffold, replace `vite.config.ts` with:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',  // Required for GitHub Pages (relative paths)
})
```

- [ ] **Step 4: Configure Tailwind (src/index.css)**

Replace `src/index.css` with:

```css
@import "tailwindcss";
```

(Tailwind v4 uses CSS `@import` instead of `@tailwind` directives.)

- [ ] **Step 5: Add deploy script to package.json**

Read `package.json`, add to `"scripts"`:

```json
"deploy": "npm run build && npx gh-pages -d dist"
```

- [ ] **Step 6: Create .gitignore**

Write `.gitignore`:

```
node_modules
dist
.superpowers
```

- [ ] **Step 7: Set up src/main.tsx**

Replace `src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
```

- [ ] **Step 8: Verify scaffold works**

```bash
npm run dev
```

Expected: Vite dev server starts, blank page loads without errors.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + TS + Tailwind + Router + Dexie"
```

---

### Task 2: Database Schema (Dexie.js)

**Files:**
- Create: `src/db/database.ts`
- Create: `src/__tests__/srs.test.ts`

- [ ] **Step 1: Write database.ts**

```typescript
import Dexie, { type EntityTable } from 'dexie'

// --- Type definitions ---

export interface KanaRecord {
  id: string          // "hira-a", "kata-ka"
  character: string
  romaji: string
  type: 'hiragana' | 'katakana'
  proficiency: number // 0–100
  updatedAt: number   // Date.now()
}

export interface WordRecord {
  id?: number
  term: string
  reading: string
  meaning: string
  partOfSpeech: string
  exampleSentence?: string
  tags?: string[]
  srsInterval: number
  srsEase: number
  srsDue: number
  srsReps: number
  srsLapses: number
  createdAt: number
  updatedAt: number
}

export interface GrammarRecord {
  id?: number
  title: string
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1'
  pattern: string
  explanation: string
  examples: string[]
  notes?: string
  learned: boolean
  updatedAt: number
}

export interface ListeningRecord {
  id?: number
  title: string
  audioUrl: string
  transcript: string
  translation: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  updatedAt: number
}

export interface SessionRecord {
  id?: number
  date: string       // ISO date "2026-06-13"
  type: 'kana' | 'vocabulary' | 'grammar' | 'listening'
  reviewsCount: number
  newCount: number
}

// --- Database class ---

class JapaneseDB extends Dexie {
  kana!: EntityTable<KanaRecord, 'id'>
  words!: EntityTable<WordRecord, 'id'>
  grammar!: EntityTable<GrammarRecord, 'id'>
  listening!: EntityTable<ListeningRecord, 'id'>
  sessions!: EntityTable<SessionRecord, 'id'>

  constructor() {
    super('JapaneseLearning')
    this.version(1).stores({
      kana: 'id, type, updatedAt',
      words: '++id, srsDue, updatedAt, tags',
      grammar: '++id, level, updatedAt',
      listening: '++id, difficulty, updatedAt',
      sessions: '++id, date, type',
    })
  }
}

export const db = new JapaneseDB()
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/db/database.ts
git commit -m "feat: add Dexie database schema with all tables"
```

---

### Task 3: SRS Algorithm + Static Data

**Files:**
- Create: `src/utils/srs.ts`
- Create: `src/__tests__/srs.test.ts`
- Create: `src/data/kana.ts`
- Create: `src/data/grammar.ts`
- Create: `src/data/vocabulary.ts`

- [ ] **Step 1: Write SRS utility (src/utils/srs.ts)**

```typescript
export type Rating = 0 | 1 | 2 | 3 // Again | Hard | Good | Easy

export interface SrsState {
  interval: number   // days
  ease: number       // ease factor
  due: number        // timestamp ms
  reps: number       // successful review count
  lapses: number     // times forgotten
}

export function computeNextReview(prev: SrsState, rating: Rating, now: number = Date.now()): SrsState {
  let interval: number
  let ease = prev.ease
  let reps = prev.reps
  let lapses = prev.lapses

  if (rating === 0) {
    // Again — reset
    interval = 1 / 1440 // ~1 minute in days (same-session retry)
    lapses += 1
    reps = 0
  } else {
    if (reps === 0) {
      interval = 1      // 1 day
    } else if (reps === 1) {
      interval = 3      // 3 days
    } else {
      interval = Math.round(prev.interval * ease)
    }

    // Ease adjustment based on SM-2
    ease = ease + (0.1 - (2 - rating) * (0.08 + (2 - rating) * 0.02))
    if (ease < 1.3) ease = 1.3
    reps += 1
  }

  const due = now + interval * 86400000

  return { interval, ease, due, reps, lapses }
}

export function initSrsState(): SrsState {
  return {
    interval: 0,
    ease: 2.5,
    due: Date.now(),
    reps: 0,
    lapses: 0,
  }
}

export function isDue(srsDue: number, now: number = Date.now()): boolean {
  return srsDue <= now
}

export function getDueWords(words: Array<{ srsDue: number }>, now: number = Date.now()): typeof words {
  return words.filter(w => isDue(w.srsDue, now))
}
```

- [ ] **Step 2: Write SRS tests (src/__tests__/srs.test.ts)**

```typescript
import { describe, it, expect } from 'vitest'
import { computeNextReview, initSrsState, isDue } from '../utils/srs'

describe('computeNextReview', () => {
  const now = 1700000000000

  it('rating Again (0) resets interval and increments lapses', () => {
    const prev = { interval: 7, ease: 2.5, due: now, reps: 3, lapses: 0 }
    const next = computeNextReview(prev, 0, now)
    expect(next.interval).toBeLessThan(1)   // ~1 minute
    expect(next.lapses).toBe(1)
    expect(next.reps).toBe(0)
    expect(next.due).toBeGreaterThan(now)
  })

  it('rating Good (2) on first review sets interval to 1 day', () => {
    const prev = initSrsState()
    const next = computeNextReview(prev, 2, now)
    expect(next.interval).toBe(1)
    expect(next.reps).toBe(1)
    expect(next.lapses).toBe(0)
  })

  it('rating Good (2) on second review sets interval to 3 days', () => {
    const prev = { interval: 1, ease: 2.5, due: now, reps: 1, lapses: 0 }
    const next = computeNextReview(prev, 2, now)
    expect(next.interval).toBe(3)
    expect(next.reps).toBe(2)
  })

  it('rating Good (2) on third+ review multiplies interval by ease', () => {
    const prev = { interval: 3, ease: 2.5, due: now, reps: 2, lapses: 0 }
    const next = computeNextReview(prev, 2, now)
    expect(next.interval).toBe(8) // Math.round(3 * 2.5) = 8
  })

  it('rating Easy (3) increases ease factor', () => {
    const prev = { interval: 7, ease: 2.5, due: now, reps: 3, lapses: 0 }
    const next = computeNextReview(prev, 3, now)
    expect(next.ease).toBeGreaterThan(2.5)
    expect(next.reps).toBe(4)
  })

  it('ease never drops below 1.3', () => {
    const prev = { interval: 1, ease: 1.3, due: now, reps: 2, lapses: 0 }
    const next = computeNextReview(prev, 1, now) // Hard with low ease
    expect(next.ease).toBeGreaterThanOrEqual(1.3)
  })
})

describe('isDue', () => {
  it('returns true when due is in the past', () => {
    expect(isDue(1000, 2000)).toBe(true)
  })

  it('returns false when due is in the future', () => {
    expect(isDue(3000, 2000)).toBe(false)
  })
})
```

- [ ] **Step 3: Run tests**

```bash
npx vitest run
```

Expected: 8 tests pass.

- [ ] **Step 4: Write kana data (src/data/kana.ts)**

```typescript
export interface KanaChar {
  id: string
  character: string
  romaji: string
}

const HIRAGANA_RAW: [string, string][] = [
  ['あ','a'],['い','i'],['う','u'],['え','e'],['お','o'],
  ['か','ka'],['き','ki'],['く','ku'],['け','ke'],['こ','ko'],
  ['さ','sa'],['し','shi'],['す','su'],['せ','se'],['そ','so'],
  ['た','ta'],['ち','chi'],['つ','tsu'],['て','te'],['と','to'],
  ['な','na'],['に','ni'],['ぬ','nu'],['ね','ne'],['の','no'],
  ['は','ha'],['ひ','hi'],['ふ','fu'],['へ','he'],['ほ','ho'],
  ['ま','ma'],['み','mi'],['む','mu'],['め','me'],['も','mo'],
  ['や','ya'],['ゆ','yu'],['よ','yo'],
  ['ら','ra'],['り','ri'],['る','ru'],['れ','re'],['ろ','ro'],
  ['わ','wa'],['を','wo'],['ん','n'],
]

const KATAKANA_RAW: [string, string][] = [
  ['ア','a'],['イ','i'],['ウ','u'],['エ','e'],['オ','o'],
  ['カ','ka'],['キ','ki'],['ク','ku'],['ケ','ke'],['コ','ko'],
  ['サ','sa'],['シ','shi'],['ス','su'],['セ','se'],['ソ','so'],
  ['タ','ta'],['チ','chi'],['ツ','tsu'],['テ','te'],['ト','to'],
  ['ナ','na'],['ニ','ni'],['ヌ','nu'],['ネ','ne'],['ノ','no'],
  ['ハ','ha'],['ヒ','hi'],['フ','fu'],['ヘ','he'],['ホ','ho'],
  ['マ','ma'],['ミ','mi'],['ム','mu'],['メ','me'],['モ','mo'],
  ['ヤ','ya'],['ユ','yu'],['ヨ','yo'],
  ['ラ','ra'],['リ','ri'],['ル','ru'],['レ','re'],['ロ','ro'],
  ['ワ','wa'],['ヲ','wo'],['ン','n'],
]

export const HIRAGANA: KanaChar[] = HIRAGANA_RAW.map(([character, romaji], i) => ({
  id: `hira-${romaji}`,
  character,
  romaji,
}))

export const KATAKANA: KanaChar[] = KATAKANA_RAW.map(([character, romaji], i) => ({
  id: `kata-${romaji}`,
  character,
  romaji,
}))
```

- [ ] **Step 5: Write grammar data seed (src/data/grammar.ts)**

```typescript
import type { GrammarRecord } from '../db/database'

export const BUILTIN_GRAMMAR: Omit<GrammarRecord, 'id' | 'learned' | 'updatedAt'>[] = [
  {
    title: '～は～です',
    level: 'N5',
    pattern: 'A は B です',
    explanation: '"A is B." The most basic sentence pattern in Japanese. は (wa) marks the topic, です (desu) is the copula.',
    examples: ['私は学生です。 (I am a student.)', 'これは本です。 (This is a book.)'],
  },
  {
    title: '～の (possessive)',
    level: 'N5',
    pattern: 'A の B',
    explanation: '"A\'s B" or "B of A." Marks possession or association.',
    examples: ['私の名前 (my name)', '日本語の本 (a Japanese book)'],
  },
  {
    title: '～を (direct object)',
    level: 'N5',
    pattern: 'N を V',
    explanation: 'Marks the direct object of a transitive verb.',
    examples: ['水を飲む。 (I drink water.)', '本を読む。 (I read a book.)'],
  },
  {
    title: '～に (time/direction)',
    level: 'N5',
    pattern: 'Time/Place に',
    explanation: 'Marks a specific time or direction/destination.',
    examples: ['7時に起きる。 (I wake up at 7.)', '学校に行く。 (I go to school.)'],
  },
  {
    title: '～て form (conjunction)',
    level: 'N5',
    pattern: 'V-て ...',
    explanation: 'The て-form connects verbs and adjectives. Also used for requests (〜てください) and progressive (〜ている).',
    examples: ['食べて寝る。 (I eat and sleep.)', '見てください。 (Please look.)', '食べている。 (I am eating.)'],
  },
  {
    title: '～た form (past tense)',
    level: 'N5',
    pattern: 'V-た / V-なかった',
    explanation: 'Past tense and past negative of verbs. The た-form also appears in expressions like 〜たことがある (have done).',
    examples: ['昨日映画を見た。 (I watched a movie yesterday.)', 'まだ食べていない。 (I haven\'t eaten yet.)'],
  },
  {
    title: '～ない form (negative)',
    level: 'N5',
    pattern: 'V-ない',
    explanation: 'The plain negative form of verbs. Also used in patterns like 〜ないでください (please don\'t) and 〜なければならない (must).',
    examples: ['肉を食べない。 (I don\'t eat meat.)', '行かないでください。 (Please don\'t go.)'],
  },
  {
    title: '～から (because)',
    level: 'N5',
    pattern: 'A から B',
    explanation: '"Because A, B." States a reason or cause.',
    examples: ['疲れたから寝る。 (I\'m tired so I\'ll sleep.)', '高いから買わない。 (It\'s expensive so I won\'t buy it.)'],
  },
]
```

- [ ] **Step 6: Verify vocabulary seed data exists (src/data/vocabulary.ts)**

The file `src/data/vocabulary.ts` is **auto-generated** by `scripts/generate-vocabulary.py`. Data sources:
- **Tanos JLPT N5 word list** (from Bluskyo/JLPT_Vocabulary): ~675 N5 words with readings
- **JMdict** (via AnchorI/jlpt-kanji-dictionary): English meanings, part of speech

To regenerate (if data sources update):
```bash
# Clone source repos
git clone --depth 1 https://github.com/Bluskyo/JLPT_Vocabulary.git temp_jlpt_data
git clone --depth 1 https://github.com/AnchorI/jlpt-kanji-dictionary.git temp_anchor_jlpt
# Generate
python3 scripts/generate-vocabulary.py
# Cleanup
rm -rf temp_jlpt_data temp_anchor_jlpt
```

The generated file exports `BUILTIN_VOCABULARY: SeedWord[]` with ~675 entries, each having: `term`, `reading`, `meaning`, `partOfSpeech`, `tags: ['N5']`, and default SRS fields. If the file already exists, skip regeneration and verify it compiles:

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 7: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 8: Commit**

```bash
git add src/utils/srs.ts src/__tests__/ src/data/
git commit -m "feat: add SRS algorithm, tests, and seed data (kana, grammar, vocabulary)"
```

---

### Task 4: UI Primitives + Layout Shell

**Files:**
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/layout/Layout.tsx`
- Create: `src/components/layout/MoreMenu.tsx`
- Create: `src/App.tsx` (route setup)

- [ ] **Step 1: Write Button component (src/components/ui/Button.tsx)**

```tsx
import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

export default function Button({ variant = 'primary', size = 'md', children, className = '', ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1'

  const variants: Record<string, string> = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-400',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-300',
  }

  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  )
}
```

- [ ] **Step 2: Write MoreMenu slide-up panel (src/components/layout/MoreMenu.tsx)**

```tsx
import { useNavigate } from 'react-router-dom'
import { useEffect, useRef } from 'react'

interface MoreMenuProps {
  open: boolean
  onClose: () => void
}

export default function MoreMenu({ open, onClose }: MoreMenuProps) {
  const navigate = useNavigate()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      const handler = (e: MouseEvent) => {
        if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
          onClose()
        }
      }
      document.addEventListener('mousedown', handler)
      return () => document.removeEventListener('mousedown', handler)
    }
  }, [open, onClose])

  if (!open) return null

  const items = [
    { label: '五十音', emoji: '🔤', path: '/kana' },
    { label: '设置', emoji: '⚙️', path: '/settings' },
  ]

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed bottom-16 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl animate-slide-up"
      >
        <div className="p-4 space-y-2">
          {items.map(item => (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); onClose() }}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-left"
            >
              <span className="text-2xl">{item.emoji}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 3: Write Layout shell (src/components/layout/Layout.tsx)**

```tsx
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import MoreMenu from './MoreMenu'

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)

  // Determine active tab from current path
  const path = location.pathname
  const activeTab =
    path === '/' ? 'home' :
    path.startsWith('/vocabulary') ? 'vocab' :
    path.startsWith('/grammar') ? 'grammar' :
    path.startsWith('/listening') ? 'listening' :
    'more'

  const tabs = [
    { key: 'home', label: '首页', emoji: '🏠', path: '/' },
    { key: 'vocab', label: '单词', emoji: '📝', path: '/vocabulary' },
    { key: 'grammar', label: '语法', emoji: '📖', path: '/grammar' },
    { key: 'listening', label: '听力', emoji: '🎧', path: '/listening' },
    { key: 'more', label: '更多', emoji: '⋯', action: () => setMoreOpen(true) },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Page content */}
      <main className="flex-1 pb-16">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 safe-area-bottom">
        <div className="flex max-w-lg mx-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => tab.action ? tab.action() : navigate(tab.path!)}
              className={`flex-1 flex flex-col items-center py-2 text-[10px] ${
                activeTab === tab.key ? 'text-blue-600 font-semibold' : 'text-gray-500'
              }`}
            >
              <span className="text-lg leading-none">{tab.emoji}</span>
              <span className="mt-0.5">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <MoreMenu open={moreOpen} onClose={() => setMoreOpen(false)} />
    </div>
  )
}
```

- [ ] **Step 4: Write App.tsx with routes**

```tsx
import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './components/dashboard/Dashboard'
// Placeholder pages — will be replaced as we build each module
import KanaPage from './components/kana/KanaPage'
import ReviewPage from './components/vocabulary/ReviewPage'
import WordManager from './components/vocabulary/WordManager'
import GrammarList from './components/grammar/GrammarList'
import GrammarDetail from './components/grammar/GrammarDetail'
import ListeningPage from './components/listening/ListeningPage'
import SettingsPage from './components/settings/SettingsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="kana" element={<KanaPage />} />
        <Route path="vocabulary" element={<ReviewPage />} />
        <Route path="vocabulary/manage" element={<WordManager />} />
        <Route path="grammar" element={<GrammarList />} />
        <Route path="grammar/:id" element={<GrammarDetail />} />
        <Route path="listening" element={<ListeningPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}
```

- [ ] **Step 5: Create placeholder pages**

Create each page file as a minimal stub. Example for `src/components/dashboard/Dashboard.tsx`:

```tsx
export default function Dashboard() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Dashboard</h1>
    </div>
  )
}
```

Create identical stubs for:
- `src/components/kana/KanaPage.tsx`
- `src/components/vocabulary/ReviewPage.tsx`
- `src/components/vocabulary/WordManager.tsx`
- `src/components/grammar/GrammarList.tsx`
- `src/components/grammar/GrammarDetail.tsx`
- `src/components/listening/ListeningPage.tsx`
- `src/components/settings/SettingsPage.tsx`

Each exports a default component with the component name as the title.

- [ ] **Step 6: Verify app loads and navigation works**

```bash
npm run dev
```

Expected: App loads, bottom nav visible, clicking tabs navigates between placeholder pages, "更多" opens slide-up with 五十音 and 设置 links.

- [ ] **Step 7: Commit**

```bash
git add src/components/ src/App.tsx
git commit -m "feat: add layout shell, bottom nav, more menu, routing with placeholder pages"
```

---

### Task 5: Dashboard Page

**Files:**
- Modify: `src/components/dashboard/Dashboard.tsx`

- [ ] **Step 1: Build Dashboard with all sections**

Replace the placeholder Dashboard with the full implementation:

```tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../../db/database'
import { getDueWords } from '../../utils/srs'

export default function Dashboard() {
  const navigate = useNavigate()
  const [dueCount, setDueCount] = useState(0)
  const [newToday, setNewToday] = useState(0)
  const [kanaProficiency, setKanaProficiency] = useState(0)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    // Load stats
    async function load() {
      // Due words count
      const allWords = await db.words.toArray()
      setDueCount(getDueWords(allWords).length)

      // New words learned today
      const today = new Date().toISOString().split('T')[0]
      const todaySession = await db.sessions.where({ date: today, type: 'vocabulary' }).first()
      setNewToday(todaySession?.newCount ?? 0)

      // Kana proficiency
      const kanaRecords = await db.kana.toArray()
      if (kanaRecords.length > 0) {
        const avg = kanaRecords.reduce((s, k) => s + k.proficiency, 0) / kanaRecords.length
        setKanaProficiency(Math.round(avg))
      }

      // Streak (consecutive days with sessions, going backwards from today)
      const sessions = await db.sessions.orderBy('date').reverse().toArray()
      let count = 0
      const dates = new Set(sessions.map(s => s.date))
      const d = new Date()
      while (dates.has(d.toISOString().split('T')[0])) {
        count++
        d.setDate(d.getDate() - 1)
      }
      setStreak(count)
    }
    load()
  }, [])

  const modules = [
    { label: '五十音', emoji: '🔤', desc: kanaProficiency > 0 ? `掌握度 ${kanaProficiency}%` : '开始学习', path: '/kana', color: 'bg-blue-50 border-blue-200' },
    { label: '语法', emoji: '📖', desc: 'N5 语法', path: '/grammar', color: 'bg-green-50 border-green-200' },
    { label: '听力', emoji: '🎧', desc: '初级对话', path: '/listening', color: 'bg-yellow-50 border-yellow-200' },
    { label: '设置', emoji: '⚙️', desc: '同步 & 更多', path: '/settings', color: 'bg-gray-50 border-gray-200' },
  ]

  return (
    <div className="p-4 max-w-lg mx-auto space-y-5">
      {/* Greeting */}
      <div>
        <p className="text-sm text-gray-500">おはようございます</p>
        <h1 className="text-2xl font-bold text-gray-900">今日の目標</h1>
      </div>

      {/* Hero card */}
      <div className="bg-gradient-to-br from-blue-900 to-blue-600 rounded-2xl p-5 text-white text-center"
        style={{ background: 'linear-gradient(135deg, #1e3a5f, #2563eb)' }}>
        <div className="text-4xl font-bold mb-1">🔥 {dueCount}</div>
        <div className="text-sm opacity-80 mb-4">个单词等你复习</div>
        <button
          onClick={() => navigate('/vocabulary')}
          className="bg-white text-blue-600 px-6 py-2.5 rounded-full font-semibold text-sm active:scale-95 transition-transform"
        >
          开始复习
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <div className="text-lg font-bold text-green-600">+{newToday}</div>
          <div className="text-[10px] text-gray-500">今日新词</div>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <div className="text-lg font-bold text-blue-600">{kanaProficiency}%</div>
          <div className="text-[10px] text-gray-500">假名</div>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <div className="text-lg font-bold text-purple-600">N5</div>
          <div className="text-[10px] text-gray-500">语法</div>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <div className="text-lg font-bold text-orange-600">{streak}天</div>
          <div className="text-[10px] text-gray-500">连续</div>
        </div>
      </div>

      {/* Module grid */}
      <div className="grid grid-cols-2 gap-3">
        {modules.map(m => (
          <button
            key={m.path}
            onClick={() => navigate(m.path)}
            className={`border rounded-xl p-4 text-left flex items-center gap-3 active:scale-[0.98] transition-transform ${m.color}`}
          >
            <span className="text-2xl">{m.emoji}</span>
            <div>
              <div className="font-semibold text-sm">{m.label}</div>
              <div className="text-[11px] text-gray-500">{m.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify dashboard renders**

```bash
npm run dev
```

Expected: Dashboard shows greeting, hero card with due count, stats row, and 2×2 module grid. Clicking "开始复习" navigates to `/vocabulary`.

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/Dashboard.tsx
git commit -m "feat: implement dashboard with stats, hero card, and module grid"
```

---

### Task 6: Kana Page (Chart + Quiz)

**Files:**
- Modify: `src/components/kana/KanaPage.tsx`
- Create: `src/components/kana/KanaChart.tsx`
- Create: `src/components/kana/KanaQuiz.tsx`

- [ ] **Step 1: Write KanaPage with tab switching**

```tsx
import { useState } from 'react'
import KanaChart from './KanaChart'
import KanaQuiz from './KanaQuiz'

export default function KanaPage() {
  const [tab, setTab] = useState<'chart' | 'quiz'>('chart')

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('chart')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium ${
            tab === 'chart' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          五十音图
        </button>
        <button
          onClick={() => setTab('quiz')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium ${
            tab === 'quiz' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          测验
        </button>
      </div>

      {tab === 'chart' ? <KanaChart /> : <KanaQuiz />}
    </div>
  )
}
```

- [ ] **Step 2: Write KanaChart (grid display)**

```tsx
import { useState } from 'react'
import { HIRAGANA, KATAKANA } from '../../data/kana'

export default function KanaChart() {
  const [type, setType] = useState<'hiragana' | 'katakana'>('hiragana')
  const chars = type === 'hiragana' ? HIRAGANA : KATAKANA

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setType('hiragana')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${
            type === 'hiragana' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
          }`}
        >
          平假名
        </button>
        <button
          onClick={() => setType('katakana')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${
            type === 'katakana' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
          }`}
        >
          片假名
        </button>
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {chars.map(c => (
          <div
            key={c.id}
            className="bg-white border border-gray-200 rounded-lg p-2 text-center hover:border-blue-300 cursor-pointer transition-colors"
          >
            <div className="text-2xl font-medium">{c.character}</div>
            <div className="text-[10px] text-gray-400">{c.romaji}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Write KanaQuiz (flash-card style quiz)**

```tsx
import { useState, useMemo } from 'react'
import { HIRAGANA, KATAKANA } from '../../data/kana'

export default function KanaQuiz() {
  const [pool, setPool] = useState<'hiragana' | 'katakana'>('hiragana')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [total, setTotal] = useState(0)
  const [finished, setFinished] = useState(false)

  const chars = useMemo(() => {
    const list = pool === 'hiragana' ? HIRAGANA : KATAKANA
    return [...list].sort(() => Math.random() - 0.5)
  }, [pool])

  const current = chars[currentIndex]

  const handleAnswer = (knew: boolean) => {
    if (knew) setCorrectCount(c => c + 1)
    setTotal(t => t + 1)
    if (currentIndex + 1 >= chars.length) {
      setFinished(true)
    } else {
      setCurrentIndex(i => i + 1)
      setShowAnswer(false)
    }
  }

  const restart = () => {
    setCurrentIndex(0)
    setShowAnswer(false)
    setCorrectCount(0)
    setTotal(0)
    setFinished(false)
  }

  if (finished) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🎉</div>
        <div className="text-2xl font-bold mb-2">{correctCount} / {total}</div>
        <p className="text-gray-500 mb-6">
          {correctCount === total ? '完美！' : correctCount / total >= 0.8 ? '很不错！' : '继续加油！'}
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={restart} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium">
            再来一次
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => { setPool('hiragana'); restart() }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${
            pool === 'hiragana' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
          }`}
        >
          平假名
        </button>
        <button
          onClick={() => { setPool('katakana'); restart() }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${
            pool === 'katakana' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
          }`}
        >
          片假名
        </button>
      </div>

      <div className="text-center text-sm text-gray-400 mb-6">
        {currentIndex + 1} / {chars.length}
      </div>

      {/* Kana card */}
      <div
        onClick={() => setShowAnswer(true)}
        className="bg-white border-2 border-gray-200 rounded-2xl p-12 text-center cursor-pointer select-none"
      >
        <div className="text-6xl font-medium mb-4">{current.character}</div>
        {showAnswer && (
          <div className="text-xl text-blue-600 font-medium animate-fade-in">
            {current.romaji}
          </div>
        )}
        {!showAnswer && (
          <div className="text-xs text-gray-400">点击看答案</div>
        )}
      </div>

      {/* Rating after reveal */}
      {showAnswer && (
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => handleAnswer(false)}
            className="flex-1 py-3 bg-red-50 border border-red-200 text-red-600 rounded-xl font-medium text-sm"
          >
            ✕ 不认识
          </button>
          <button
            onClick={() => handleAnswer(true)}
            className="flex-1 py-3 bg-green-50 border border-green-200 text-green-600 rounded-xl font-medium text-sm"
          >
            ✓ 认识
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Verify kana page**

```bash
npm run dev
```

Navigate to `/kana`. Expected: Tab switch between chart and quiz. Chart shows grid of characters. Quiz shows random character, tap to reveal romaji, rate correct/incorrect, shows score at end.

- [ ] **Step 5: Commit**

```bash
git add src/components/kana/
git commit -m "feat: implement kana chart and quiz"
```

---

### Task 7: Vocabulary Review (SRS Session)

**Files:**
- Modify: `src/components/vocabulary/ReviewPage.tsx`
- Create: `src/components/vocabulary/ReviewCard.tsx`

- [ ] **Step 1: Write ReviewCard (src/components/vocabulary/ReviewCard.tsx)**

```tsx
import { useState } from 'react'
import type { Rating } from '../../utils/srs'

interface ReviewCardProps {
  term: string
  reading: string
  meaning: string
  partOfSpeech: string
  exampleSentence?: string
  current: number
  total: number
  onRate: (rating: Rating) => void
}

export default function ReviewCard({ term, reading, meaning, partOfSpeech, exampleSentence, current, total, onRate }: ReviewCardProps) {
  const [revealed, setRevealed] = useState(false)

  const handleReveal = () => {
    if (!revealed) setRevealed(true)
  }

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 6rem)' }}>
      {/* Progress */}
      <div className="text-center text-sm text-gray-400 py-3">
        {current} / {total}
      </div>

      {/* Top zone: prompt / answer */}
      <div
        onClick={handleReveal}
        className={`flex-1 flex flex-col items-center justify-center p-6 cursor-pointer select-none transition-all ${
          revealed ? 'bg-blue-50/50' : ''
        }`}
      >
        <div className="text-4xl font-bold text-gray-900 mb-2">{term}</div>
        <div className="text-lg text-gray-500 mb-3">{reading}</div>
        <div className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-500">{partOfSpeech}</div>

        {revealed ? (
          <div className="mt-8 text-center animate-fade-in">
            <div className="text-2xl font-bold text-blue-600 mb-3">{meaning}</div>
            {exampleSentence && (
              <p className="text-sm text-gray-500 max-w-xs">{exampleSentence}</p>
            )}
          </div>
        ) : (
          <div className="mt-8 text-xs text-gray-400">
            タップして答えを見る
          </div>
        )}
      </div>

      {/* Bottom zone: rating buttons */}
      <div className="border-t border-gray-200 bg-white p-3">
        <p className="text-xs text-gray-400 text-center mb-2">思い出せましたか？</p>
        <div className="flex gap-2">
          <button onClick={() => { onRate(0); setRevealed(false) }}
            className="flex-1 py-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold">
            ✕<br />Again
          </button>
          <button onClick={() => { onRate(1); setRevealed(false) }}
            className="flex-1 py-3 bg-yellow-50 border border-yellow-200 text-yellow-600 rounded-xl text-xs font-semibold">
            △<br />Hard
          </button>
          <button onClick={() => { onRate(2); setRevealed(false) }}
            className="flex-1 py-3 bg-green-50 border border-green-200 text-green-600 rounded-xl text-xs font-semibold">
            ○<br />Good
          </button>
          <button onClick={() => { onRate(3); setRevealed(false) }}
            className="flex-1 py-3 bg-blue-50 border border-blue-200 text-blue-600 rounded-xl text-xs font-semibold">
            ◎<br />Easy
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write ReviewPage (src/components/vocabulary/ReviewPage.tsx)**

```tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, type WordRecord } from '../../db/database'
import { getDueWords, computeNextReview, type Rating } from '../../utils/srs'
import ReviewCard from './ReviewCard'

export default function ReviewPage() {
  const navigate = useNavigate()
  const [words, setWords] = useState<WordRecord[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [reviewed, setReviewed] = useState(0)

  useEffect(() => {
    async function load() {
      const all = await db.words.toArray()
      const due = getDueWords(all)
      if (due.length === 0) {
        setCompleted(true)
      } else {
        setWords(due)
      }
    }
    load()
  }, [])

  const handleRate = async (rating: Rating) => {
    const word = words[currentIndex]
    const prevState = {
      interval: word.srsInterval,
      ease: word.srsEase,
      due: word.srsDue,
      reps: word.srsReps,
      lapses: word.srsLapses,
    }
    const next = computeNextReview(prevState, rating)
    const newWordCount = word.srsReps === 0 ? 1 : 0

    // Update word in DB
    await db.words.update(word.id!, {
      srsInterval: next.interval,
      srsEase: next.ease,
      srsDue: next.due,
      srsReps: next.reps,
      srsLapses: next.lapses,
      updatedAt: Date.now(),
    })

    // Log session
    const today = new Date().toISOString().split('T')[0]
    const existing = await db.sessions.where({ date: today, type: 'vocabulary' }).first()
    if (existing) {
      await db.sessions.update(existing.id!, {
        reviewsCount: existing.reviewsCount + 1,
        newCount: existing.newCount + newWordCount,
      })
    } else {
      await db.sessions.add({
        date: today,
        type: 'vocabulary',
        reviewsCount: 1,
        newCount: newWordCount,
      })
    }

    setReviewed(r => r + 1)

    if (currentIndex + 1 >= words.length) {
      setCompleted(true)
    } else {
      setCurrentIndex(i => i + 1)
    }
  }

  if (completed) {
    return (
      <div className="p-4 max-w-lg mx-auto text-center py-20">
        {words.length === 0 ? (
          <>
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-xl font-bold mb-2">全部搞定！</h2>
            <p className="text-gray-500 mb-6">没有待复习的单词了</p>
            <button onClick={() => navigate('/vocabulary/manage')}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium">
              添加新单词
            </button>
          </>
        ) : (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-bold mb-2">复习完成</h2>
            <p className="text-gray-500 mb-6">本次复习了 {reviewed} 个单词</p>
            <button onClick={() => navigate('/')}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium">
              返回首页
            </button>
          </>
        )}
      </div>
    )
  }

  if (words.length === 0) return null

  const word = words[currentIndex]

  return (
    <ReviewCard
      term={word.term}
      reading={word.reading}
      meaning={word.meaning}
      partOfSpeech={word.partOfSpeech}
      exampleSentence={word.exampleSentence}
      current={currentIndex + 1}
      total={words.length}
      onRate={handleRate}
    />
  )
}
```

- [ ] **Step 3: Seed words into DB on first load**

The seed data should be inserted when the dashboard first detects an empty words table. Add a `seedIfEmpty` utility. Modify `src/db/database.ts` — append after the class definition:

```typescript
import { BUILTIN_VOCABULARY } from '../data/vocabulary'
import { BUILTIN_GRAMMAR } from '../data/grammar'
import { HIRAGANA, KATAKANA } from '../data/kana'

export async function seedIfEmpty() {
  const wordCount = await db.words.count()
  if (wordCount === 0) {
    const now = Date.now()
    for (const w of BUILTIN_VOCABULARY) {
      await db.words.add({ ...w, createdAt: now, updatedAt: now } as WordRecord)
    }
  }

  const grammarCount = await db.grammar.count()
  if (grammarCount === 0) {
    const now = Date.now()
    for (const g of BUILTIN_GRAMMAR) {
      await db.grammar.add({ ...g, learned: false, updatedAt: now } as GrammarRecord)
    }
  }

  const kanaCount = await db.kana.count()
  if (kanaCount === 0) {
    const now = Date.now()
    for (const k of [...HIRAGANA, ...KATAKANA]) {
      await db.kana.add({ id: k.id, character: k.character, romaji: k.romaji, type: k.id.startsWith('hira') ? 'hiragana' : 'katakana', proficiency: 0, updatedAt: now })
    }
  }
}
```

- [ ] **Step 4: Call seedIfEmpty from Dashboard useEffect**

In `Dashboard.tsx`, add `import { seedIfEmpty } from '../../db/database'` and call `await seedIfEmpty()` before loading stats in the `load()` function.

- [ ] **Step 5: Verify review flow**

```bash
npm run dev
```

Expected: Navigate to `/vocabulary`. If words are seeded, review session starts. Tap card to reveal meaning, rate with bottom buttons, card advances. After all cards, shows completion screen.

- [ ] **Step 6: Commit**

```bash
git add src/components/vocabulary/ src/db/database.ts src/components/dashboard/Dashboard.tsx
git commit -m "feat: implement SRS vocabulary review with seed data initialization"
```

---

### Task 8: Word Manager (Add/View Words)

**Files:**
- Modify: `src/components/vocabulary/WordManager.tsx`

- [ ] **Step 1: Write WordManager page**

```tsx
import { useEffect, useState } from 'react'
import { db, type WordRecord } from '../../db/database'
import { initSrsState } from '../../utils/srs'
import Button from '../ui/Button'

export default function WordManager() {
  const [words, setWords] = useState<WordRecord[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [term, setTerm] = useState('')
  const [reading, setReading] = useState('')
  const [meaning, setMeaning] = useState('')
  const [partOfSpeech, setPartOfSpeech] = useState('')
  const [exampleSentence, setExampleSentence] = useState('')

  const loadWords = async () => {
    const all = await db.words.orderBy('createdAt').reverse().toArray()
    setWords(all)
  }

  useEffect(() => { loadWords() }, [])

  const handleAdd = async () => {
    if (!term || !reading || !meaning) return
    const now = Date.now()
    const srs = initSrsState()
    await db.words.add({
      term, reading, meaning,
      partOfSpeech: partOfSpeech || '名詞',
      exampleSentence: exampleSentence || undefined,
      srsInterval: srs.interval,
      srsEase: srs.ease,
      srsDue: srs.due,
      srsReps: srs.reps,
      srsLapses: srs.lapses,
      createdAt: now,
      updatedAt: now,
    })
    setTerm(''); setReading(''); setMeaning('')
    setPartOfSpeech(''); setExampleSentence('')
    setShowAdd(false)
    loadWords()
  }

  const handleDelete = async (id: number) => {
    await db.words.delete(id)
    loadWords()
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">单词库 ({words.length})</h1>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? '取消' : '+ 添加'}
        </Button>
      </div>

      {showAdd && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 mb-4">
          <input className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" placeholder="单词 (e.g. 食べる)" value={term} onChange={e => setTerm(e.target.value)} />
          <input className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" placeholder="读音 (e.g. たべる)" value={reading} onChange={e => setReading(e.target.value)} />
          <input className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" placeholder="意思 (e.g. to eat)" value={meaning} onChange={e => setMeaning(e.target.value)} />
          <input className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" placeholder="词性 (e.g. 動詞)" value={partOfSpeech} onChange={e => setPartOfSpeech(e.target.value)} />
          <input className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" placeholder="例句 (可选)" value={exampleSentence} onChange={e => setExampleSentence(e.target.value)} />
          <Button onClick={handleAdd} className="w-full">确认添加</Button>
        </div>
      )}

      <div className="space-y-2">
        {words.map(w => (
          <div key={w.id} className="bg-white border border-gray-200 rounded-xl p-3 flex justify-between items-center">
            <div>
              <div className="font-medium">{w.term} <span className="text-gray-400 text-sm">{w.reading}</span></div>
              <div className="text-sm text-gray-500">{w.meaning}</div>
              <div className="text-xs text-gray-400 mt-1">
                间隔 {w.srsInterval > 1 ? `${Math.round(w.srsInterval)}天` : '新'} · 复习 {w.srsReps}次
              </div>
            </div>
            <button onClick={() => w.id && handleDelete(w.id)}
              className="text-red-400 hover:text-red-600 text-sm px-2">
              删除
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify word manager**

```bash
npm run dev
```

Navigate to `/vocabulary/manage`. Expected: List of seeded words with SRS stats. Add form toggles, can add a new word. Delete button removes word.

- [ ] **Step 3: Commit**

```bash
git add src/components/vocabulary/WordManager.tsx
git commit -m "feat: implement word manager with add/delete"
```

---

### Task 9: Grammar Pages

**Files:**
- Modify: `src/components/grammar/GrammarList.tsx`
- Modify: `src/components/grammar/GrammarDetail.tsx`

- [ ] **Step 1: Write GrammarList**

```tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, type GrammarRecord } from '../../db/database'

const LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'] as const

export default function GrammarList() {
  const navigate = useNavigate()
  const [points, setPoints] = useState<GrammarRecord[]>([])
  const [filter, setFilter] = useState<string>('N5')

  useEffect(() => {
    async function load() {
      const all = await db.grammar.where('level').equals(filter as any).toArray()
      setPoints(all)
    }
    load()
  }, [filter])

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-4">语法学习</h1>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {LEVELS.map(level => (
          <button
            key={level}
            onClick={() => setFilter(level)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
              filter === level ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {level}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {points.map((g, i) => (
          <button
            key={g.id}
            onClick={() => navigate(`/grammar/${g.id}`)}
            className="w-full bg-white border border-gray-200 rounded-xl p-4 text-left active:scale-[0.99] transition-transform"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                g.learned ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {g.learned ? '学完' : g.level}
              </span>
              <span className="font-semibold">{g.title}</span>
            </div>
            <div className="text-sm text-blue-600 font-mono">{g.pattern}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write GrammarDetail**

```tsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db, type GrammarRecord } from '../../db/database'
import Button from '../ui/Button'

export default function GrammarDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [point, setPoint] = useState<GrammarRecord | null>(null)

  useEffect(() => {
    async function load() {
      const g = await db.grammar.get(Number(id))
      if (g) setPoint(g)
    }
    load()
  }, [id])

  const markLearned = async () => {
    if (!point?.id) return
    await db.grammar.update(point.id, { learned: true, updatedAt: Date.now() })
    setPoint(p => p ? { ...p, learned: true } : null)
  }

  if (!point) return <div className="p-4 text-gray-500">加载中...</div>

  return (
    <div className="p-4 max-w-lg mx-auto">
      <button onClick={() => navigate(-1)} className="text-blue-600 text-sm mb-4">← 返回</button>

      <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{point.level}</span>
      <h1 className="text-2xl font-bold mt-2 mb-1">{point.title}</h1>

      <div className="bg-blue-50 rounded-xl p-4 my-4">
        <div className="text-sm text-gray-500 mb-1">句型</div>
        <div className="text-lg font-mono text-blue-700 font-semibold">{point.pattern}</div>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold mb-2">说明</h3>
        <p className="text-gray-700 leading-relaxed">{point.explanation}</p>
      </div>

      {point.notes && (
        <div className="mb-6 bg-yellow-50 rounded-xl p-4">
          <h3 className="font-semibold mb-1">注意</h3>
          <p className="text-gray-700 text-sm">{point.notes}</p>
        </div>
      )}

      <div className="mb-6">
        <h3 className="font-semibold mb-2">例句</h3>
        <div className="space-y-3">
          {point.examples.map((ex, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-3">
              <p className="text-gray-900">{ex}</p>
            </div>
          ))}
        </div>
      </div>

      {!point.learned && (
        <Button onClick={markLearned} className="w-full">标记为已学</Button>
      )}
      {point.learned && (
        <p className="text-center text-green-600 font-medium">✅ 已学习</p>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verify grammar pages**

```bash
npm run dev
```

Expected: Navigate to `/grammar`. See N5 grammar points listed. Click one to see detail with pattern, explanation, examples. "Mark learned" button works.

- [ ] **Step 4: Commit**

```bash
git add src/components/grammar/
git commit -m "feat: implement grammar list and detail pages"
```

---

### Task 10: Listening Page

**Files:**
- Modify: `src/components/listening/ListeningPage.tsx`

- [ ] **Step 1: Write ListeningPage with hardcoded tracks**

Since audio files won't exist yet, create a page with placeholder tracks that demonstrates the UI structure. Real audio can be added later to `public/audio/`.

```tsx
import { useState } from 'react'

interface Track {
  id: number
  title: string
  transcript: string
  translation: string
  difficulty: string
}

const PLACEHOLDER_TRACKS: Track[] = [
  {
    id: 1,
    title: '朝の会話 (Morning Conversation)',
    transcript: 'A: おはようございます。\nB: おはよう。今日はいい天気ですね。\nA: そうですね。どこに行きますか。\nB: 学校に行きます。',
    translation: 'A: Good morning.\nB: Morning. Nice weather today.\nA: Yes. Where are you going?\nB: I\'m going to school.',
    difficulty: 'beginner',
  },
  {
    id: 2,
    title: 'レストランで (At the Restaurant)',
    transcript: 'A: いらっしゃいませ。何名様ですか。\nB: 二人です。\nA: こちらへどうぞ。\nB: メニューをお願いします。',
    translation: 'A: Welcome. How many people?\nB: Two.\nA: This way please.\nB: Can I have the menu?',
    difficulty: 'beginner',
  },
  {
    id: 3,
    title: '買い物 (Shopping)',
    transcript: 'A: これ、いくらですか。\nB: 500円です。\nA: ちょっと高いですね。\nB: じゃあ、400円でどうですか。',
    translation: 'A: How much is this?\nB: 500 yen.\nA: That\'s a bit expensive.\nB: How about 400 yen?',
    difficulty: 'beginner',
  },
]

export default function ListeningPage() {
  const [selected, setSelected] = useState<Track | null>(null)
  const [showTranslation, setShowTranslation] = useState(false)

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-4">听力练习</h1>

      {!selected ? (
        <div className="space-y-3">
          {PLACEHOLDER_TRACKS.map(track => (
            <button
              key={track.id}
              onClick={() => { setSelected(track); setShowTranslation(false) }}
              className="w-full bg-white border border-gray-200 rounded-xl p-4 text-left active:scale-[0.99] transition-transform"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎧</span>
                <div>
                  <div className="font-semibold">{track.title}</div>
                  <div className="text-xs text-gray-400">{track.difficulty}</div>
                </div>
              </div>
            </button>
          ))}
          <p className="text-xs text-gray-400 text-center mt-4">
            📌 音频文件放到 public/audio/ 目录后即可播放
          </p>
        </div>
      ) : (
        <div>
          <button onClick={() => setSelected(null)} className="text-blue-600 text-sm mb-4">← 返回列表</button>

          <h2 className="text-lg font-bold mb-1">{selected.title}</h2>
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">{selected.difficulty}</span>

          {/* Audio player placeholder — replace with <audio> when files exist */}
          <div className="bg-gray-100 rounded-xl p-6 text-center my-4">
            <div className="text-3xl mb-2">🔈</div>
            <p className="text-sm text-gray-500">音频播放器</p>
            <p className="text-xs text-gray-400 mt-1">将 .mp3 文件放入 public/audio/ 即可使用</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
            <h3 className="font-semibold mb-2">原文</h3>
            <p className="text-gray-800 whitespace-pre-line leading-relaxed">{selected.transcript}</p>
          </div>

          <button
            onClick={() => setShowTranslation(!showTranslation)}
            className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm mb-4"
          >
            {showTranslation ? '隐藏翻译' : '显示翻译'}
          </button>

          {showTranslation && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="font-semibold mb-2 text-blue-700">翻译</h3>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">{selected.translation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify listening page**

```bash
npm run dev
```

Expected: Navigate to `/listening`. See list of tracks. Click one to see transcript, audio placeholder, and toggleable translation.

- [ ] **Step 3: Commit**

```bash
git add src/components/listening/
git commit -m "feat: implement listening page with placeholder tracks"
```

---

### Task 11: Settings Page + GitHub Gist Sync

**Files:**
- Modify: `src/components/settings/SettingsPage.tsx`
- Create: `src/utils/sync.ts`
- Create: `src/hooks/useSync.ts`

- [ ] **Step 1: Write GitHub Gist sync utility (src/utils/sync.ts)**

```typescript
const GIST_API = 'https://api.github.com/gists'

interface SyncConfig {
  token: string
  gistId: string | null
}

function getConfig(): SyncConfig {
  return {
    token: localStorage.getItem('github_token') || '',
    gistId: localStorage.getItem('gist_id'),
  }
}

export function isConfigured(): boolean {
  const cfg = getConfig()
  return !!(cfg.token && cfg.gistId)
}

async function gistHeaders(): Promise<HeadersInit> {
  const cfg = getConfig()
  return {
    'Authorization': `Bearer ${cfg.token}`,
    'Accept': 'application/vnd.github.v3+json',
  }
}

export async function createSyncGist(): Promise<string> {
  const cfg = getConfig()
  const res = await fetch(GIST_API, {
    method: 'POST',
    headers: await gistHeaders(),
    body: JSON.stringify({
      description: 'Japanese Learning App — sync data (private)',
      public: false,
      files: {
        'japanese-learning-data.json': { content: '{}' },
      },
    }),
  })
  if (!res.ok) throw new Error(`Failed to create gist: ${res.status}`)
  const data = await res.json()
  const gistId = data.id as string
  localStorage.setItem('gist_id', gistId)
  return gistId
}

export async function pullSyncData(): Promise<Record<string, any[]>> {
  const cfg = getConfig()
  if (!cfg.gistId) throw new Error('Gist not configured')

  const res = await fetch(`${GIST_API}/${cfg.gistId}`, {
    headers: await gistHeaders(),
  })
  if (!res.ok) throw new Error(`Failed to pull gist: ${res.status}`)
  const data = await res.json()
  const file = data.files?.['japanese-learning-data.json']
  if (!file?.content) return {}
  try {
    return JSON.parse(file.content)
  } catch {
    return {}
  }
}

export interface SyncPayload {
  kana: any[]
  words: any[]
  grammar: any[]
  listening: any[]
  sessions: any[]
}

export async function pushSyncData(payload: SyncPayload): Promise<void> {
  const cfg = getConfig()
  if (!cfg.gistId) throw new Error('Gist not configured')

  const res = await fetch(`${GIST_API}/${cfg.gistId}`, {
    method: 'PATCH',
    headers: await gistHeaders(),
    body: JSON.stringify({
      files: {
        'japanese-learning-data.json': { content: JSON.stringify(payload) },
      },
    }),
  })
  if (!res.ok) throw new Error(`Failed to push gist: ${res.status}`)
}

/**
 * Merge remote data into local DB. Last-write-wins per record by updatedAt.
 */
export async function mergeRemoteIntoLocal(remoteData: Record<string, any[]>, db: any): Promise<void> {
  const tables = ['kana', 'words', 'grammar', 'listening', 'sessions']
  for (const table of tables) {
    const remoteRecords = remoteData[table] || []
    if (remoteRecords.length === 0) continue

    for (const remote of remoteRecords) {
      const local = await db.table(table).get(remote.id ?? remote.id)
      if (!local || (remote.updatedAt && remote.updatedAt > (local.updatedAt || 0))) {
        await db.table(table).put(remote)
      }
    }
  }
}
```

- [ ] **Step 2: Write useSync hook (src/hooks/useSync.ts)**

```typescript
import { useEffect, useCallback } from 'react'
import { db } from '../db/database'
import { isConfigured, pullSyncData, pushSyncData, mergeRemoteIntoLocal, type SyncPayload } from '../utils/sync'
import { seedIfEmpty } from '../db/database'

export function useSync() {
  const pull = useCallback(async () => {
    if (!isConfigured()) return
    try {
      await seedIfEmpty()
      const remote = await pullSyncData()
      await mergeRemoteIntoLocal(remote, db)
    } catch (err) {
      console.warn('Sync pull failed:', err)
    }
  }, [])

  const push = useCallback(async () => {
    if (!isConfigured()) return
    try {
      const payload: SyncPayload = {
        kana: await db.kana.toArray(),
        words: await db.words.toArray(),
        grammar: await db.grammar.toArray(),
        listening: await db.listening.toArray(),
        sessions: await db.sessions.toArray(),
      }
      await pushSyncData(payload)
    } catch (err) {
      console.warn('Sync push failed:', err)
    }
  }, [])

  // Pull on mount
  useEffect(() => {
    pull()
  }, [pull])

  let pushTimer: ReturnType<typeof setTimeout> | null = null

  const schedulePush = useCallback(() => {
    if (pushTimer) clearTimeout(pushTimer)
    pushTimer = setTimeout(push, 3000) // 3s debounce
  }, [push])

  return { pull, push, schedulePush }
}
```

- [ ] **Step 3: Write SettingsPage**

```tsx
import { useState, useEffect } from 'react'
import { isConfigured, createSyncGist } from '../../utils/sync'
import { db } from '../../db/database'
import { useSync } from '../../hooks/useSync'
import Button from '../ui/Button'

export default function SettingsPage() {
  const { pull, push } = useSync()
  const [configured, setConfigured] = useState(false)
  const [token, setToken] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    setConfigured(isConfigured())
    setToken(localStorage.getItem('github_token') || '')
  }, [])

  const handleSaveToken = async () => {
    if (!token.trim()) return
    localStorage.setItem('github_token', token.trim())
    try {
      setStatus('创建 Gist 中...')
      await createSyncGist()
      setConfigured(true)
      setStatus('✅ 同步已配置！首次推送中...')
      await push()
      setStatus('✅ 同步完成')
    } catch (err: any) {
      setStatus(`❌ 失败: ${err.message}`)
    }
  }

  const handleExportAll = async () => {
    const data = {
      kana: await db.kana.toArray(),
      words: await db.words.toArray(),
      grammar: await db.grammar.toArray(),
      listening: await db.listening.toArray(),
      sessions: await db.sessions.toArray(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `japanese-learning-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    try {
      const data = JSON.parse(text)
      const tables = ['kana', 'words', 'grammar', 'listening', 'sessions']
      for (const table of tables) {
        if (data[table]) {
          await db.table(table).bulkPut(data[table])
        }
      }
      setStatus('✅ 导入成功')
    } catch {
      setStatus('❌ JSON 格式错误')
    }
  }

  const handleClearToken = () => {
    localStorage.removeItem('github_token')
    localStorage.removeItem('gist_id')
    setConfigured(false)
    setToken('')
    setStatus('同步已断开')
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-bold">设置</h1>

      {/* Sync section */}
      <section className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <h2 className="font-semibold">多设备同步</h2>
        <p className="text-sm text-gray-500">
          使用 GitHub Gist 在电脑和手机间同步学习进度。
          <a href="https://github.com/settings/tokens/new?scopes=gist&description=Japanese%20Learning%20App" target="_blank" rel="noopener" className="text-blue-600 ml-1">
            创建 Token →
          </a>
        </p>

        {configured ? (
          <div className="space-y-2">
            <p className="text-sm text-green-600">✅ 已配置</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={pull}>拉取</Button>
              <Button size="sm" variant="secondary" onClick={push}>推送</Button>
              <Button size="sm" variant="ghost" onClick={handleClearToken}>断开</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <input
              type="password"
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="粘贴 GitHub Token"
              className="w-full border border-gray-200 rounded-lg p-2.5 text-sm"
            />
            <Button onClick={handleSaveToken} className="w-full">连接 GitHub Gist</Button>
          </div>
        )}
        {status && <p className="text-xs text-gray-500">{status}</p>}
      </section>

      {/* Data section */}
      <section className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <h2 className="font-semibold">数据管理</h2>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleExportAll}>导出 JSON</Button>
          <label className="inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-800 rounded-xl font-semibold text-sm cursor-pointer hover:bg-gray-200">
            导入 JSON
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </section>

      {/* About */}
      <section className="bg-white border border-gray-200 rounded-xl p-4">
        <h2 className="font-semibold mb-2">关于</h2>
        <p className="text-sm text-gray-500">日语学习助手 v1.0</p>
        <p className="text-xs text-gray-400 mt-1">数据存储在你的浏览器和 GitHub Gist 中</p>
      </section>
    </div>
  )
}
```

- [ ] **Step 4: Add useSync to Dashboard for auto-sync**

Modify `Dashboard.tsx` — add `import { useSync } from '../../hooks/useSync'` and call `const { pull } = useSync()` inside the component. Call `await pull()` before the stats loading in `useEffect`. This ensures data is synced on app open.

- [ ] **Step 5: Verify settings and sync**

```bash
npm run dev
```

Expected: Settings page shows sync configuration. Token input works. Export downloads JSON. Import reads JSON file. Manual pull/push buttons.

- [ ] **Step 6: Commit**

```bash
git add src/utils/sync.ts src/hooks/useSync.ts src/components/settings/ src/components/dashboard/Dashboard.tsx
git commit -m "feat: implement GitHub Gist sync and settings page"
```

---

### Task 12: Deployment Setup

**Files:**
- Create: `public/audio/.gitkeep`
- Modify: `.gitignore` (add `dist` if not there)
- Modify: `package.json` (verify deploy script)

- [ ] **Step 1: Create placeholder for audio directory**

```bash
mkdir -p public/audio
touch public/audio/.gitkeep
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: Build succeeds, output in `dist/` with `index.html` and assets. No errors.

- [ ] **Step 3: Verify deploy script in package.json**

The `"deploy"` script should be:
```
"deploy": "npm run build && npx gh-pages -d dist"
```

- [ ] **Step 4: Deploy to GitHub Pages**

```bash
npm run deploy
```

Expected: Site published to `https://<username>.github.io/<repo>/`. Verify on phone browser.

- [ ] **Step 5: Commit**

```bash
git add public/audio/.gitkeep .gitignore package.json
git commit -m "chore: add deploy setup and audio placeholder"
```

---

### Task 13: Final Verification

- [ ] **Step 1: Run full TypeScript check**

```bash
npx tsc --noEmit
```

Expected: Zero type errors.

- [ ] **Step 2: Run all tests**

```bash
npx vitest run
```

Expected: All SRS tests pass (8 tests).

- [ ] **Step 3: Manual smoke test**

```bash
npm run dev
```

Walk through every page:
1. Dashboard loads with seeded data, due count shows
2. Bottom nav works (all 4 tabs + more menu)
3. Kana chart displays, quiz works end-to-end
4. Vocabulary review session works (tap reveal → rate → advance)
5. Word manager shows words, add/delete works
6. Grammar list shows N5 points, detail page renders with mark-learned
7. Listening page shows tracks with transcript and translation toggle
8. Settings page: token input, export JSON, import JSON

- [ ] **Step 4: Commit any final fixes**

```bash
git add -A
git commit -m "chore: final verification fixes"
```

---

## Spec Coverage Check

| Spec Requirement | Task |
|-----------------|------|
| Dashboard (hybrid layout) | Task 5 |
| Review card (top/bottom split) | Task 7 |
| Bottom navigation (4+More) | Task 4 |
| All routes defined | Task 4 step 4 |
| Dexie schema (5 tables) | Task 2 |
| SRS SM-2 algorithm | Task 3 |
| Kana chart + quiz | Task 6 |
| Vocabulary review session | Task 7 |
| Word manager (add/delete) | Task 8 |
| Grammar list + detail | Task 9 |
| Listening page | Task 10 |
| GitHub Gist sync | Task 11 |
| Seed data (kana, grammar, vocab) | Task 3, Task 7 step 3 |
| GitHub Pages deploy | Task 12 |
| SRS unit tests | Task 3 step 2 |
| Non-goals excluded | All tasks |
