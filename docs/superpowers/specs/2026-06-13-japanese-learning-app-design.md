# Japanese Learning App — Design Spec

## Overview

A mobile-first Japanese learning web app with SRS-based vocabulary review, kana chart, grammar lessons, and listening practice. Pure frontend (React + TypeScript + Vite), data in IndexedDB (Dexie.js), multi-device sync via GitHub Gist, deployed to GitHub Pages.

## Tech Stack

- React 18 / TypeScript / Vite
- Tailwind CSS
- React Router v6 (HashRouter — required by GitHub Pages)
- Dexie.js v4 (IndexedDB)
- GitHub Gist API (cross-device sync)
- gh-pages (deployment)

## UI Design Decisions

### 1. Dashboard Layout — Hybrid

Dashboard is the landing page. Structure (top to bottom):
- **Greeting** — "おはようございます" + "今日の目標"
- **Hero card** — Today's primary task highlighted (e.g., "12 words to review") with a prominent CTA button
- **Stats row** — 4 compact stats: new words today, kana mastery %, current grammar level, streak days
- **Module grid** — 2×2 grid of icon cards: 五十音 / 语法 / 听力 / 设置

### 2. Review Card — Top/Bottom Split

SRS review flow for vocabulary:
- **Top zone (2/3 screen)** — Shows the word (kanji + reading) as the prompt. User tries to recall. Tapping anywhere reveals: meaning, example sentence, part of speech.
- **Bottom zone (1/3 screen)** — 4 rating buttons in a row: Again (red) / Hard (yellow) / Good (green) / Easy (blue). Optimized for thumb reach.
- Card shows progress: "Card 3/12"
- After rating, auto-advance to next card with a subtle transition

### 3. Bottom Navigation — 4 Core + More

Persistent bottom tab bar:
| Tab | Icon | Target |
|-----|------|--------|
| 首页 | 🏠 | Dashboard |
| 单词 | 📝 | Vocabulary SRS review |
| 语法 | 📖 | Grammar list (N5~N1) |
| 听力 | 🎧 | Listening practice |
| 更多 | ⋯ | Slide-up menu: 五十音, Settings |

The "更多" tab opens a slide-up panel (not a navigation) with links to 五十音 and 设置.

## Routes

```
/#/                  → Dashboard
/#/kana              → Kana chart + quiz
/#/vocabulary        → Vocabulary review session
/#/vocabulary/manage → Word list management
/#/grammar           → Grammar topic list
/#/grammar/:id       → Grammar detail
/#/listening         → Listening tracks
/#/settings          → Settings (sync, SRS params, data export/import)
```

## Data Models

### Dexie Tables

**kana** — Kana character mastery
- `id: string` (e.g. "hira-a", "kata-ka")
- `character: string`
- `romaji: string`
- `type: 'hiragana' | 'katakana'`
- `proficiency: number` (0–100)
- `updatedAt: number` (timestamp for sync merge)

**words** — Vocabulary with SRS state
- `id: number` (auto-increment)
- `term: string`
- `reading: string`
- `meaning: string`
- `partOfSpeech: string`
- `exampleSentence?: string`
- `tags?: string[]`
- `srsInterval: number` (days until next review)
- `srsEase: number` (ease factor, default 2.5)
- `srsDue: number` (timestamp when due)
- `srsReps: number` (total review count)
- `srsLapses: number` (times forgotten)
- `createdAt: number`
- `updatedAt: number`

**grammar** — Grammar points
- `id: number` (auto-increment)
- `title: string`
- `level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1'`
- `pattern: string`
- `explanation: string`
- `examples: string[]`
- `notes?: string`
- `learned: boolean`
- `updatedAt: number`

**listening** — Listening tracks
- `id: number` (auto-increment)
- `title: string`
- `audioUrl: string`
- `transcript: string`
- `translation: string`
- `difficulty: 'beginner' | 'intermediate' | 'advanced'`
- `updatedAt: number`

**sessions** — Study session log
- `id: number` (auto-increment)
- `date: string` (ISO date)
- `type: 'kana' | 'vocabulary' | 'grammar' | 'listening'`
- `reviewsCount: number`
- `newCount: number`

## SRS Algorithm (SM-2 Simplified)

Rating scale: Again(0) / Hard(1) / Good(2) / Easy(3)

```
if rating === 0 (Again):
  interval = 1 (minute, for same-session retry)
  lapses += 1
  reps = 0

else:
  if reps === 0:
    interval = 1 (day)
  elif reps === 1:
    interval = 3
  else:
    interval = Math.round(previousInterval * ease)

  ease = ease + (0.1 - (2 - rating) * (0.08 + (2 - rating) * 0.02))
  ease = max(1.3, ease)  // minimum ease factor
  reps += 1

due = now + interval * 86400000  // convert days to ms
```

## Sync (GitHub Gist)

- Token stored in localStorage, scoped to `gist` only
- Data serialized as a single JSON blob per table, stored in one Gist file
- Sync on app open (pull → merge → render) and after study sessions (push with 3s debounce)
- Merge strategy: per-record last-write-wins via `updatedAt` timestamp
- Conflict prevention: only push after pull to ensure base is current

## Non-Goals (v1)

- User authentication / multi-user
- Audio recording / speech recognition
- Handwriting recognition
- Social features / leaderboards
- Custom word lists uploaded via CSV (can be added later)
