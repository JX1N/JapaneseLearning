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

// --- Seed helpers ---

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
