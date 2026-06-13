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
    explanation: 'A\'s B" or "B of A." Marks possession or association.',
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
    explanation: 'Past tense and past negative of verbs.',
    examples: ['昨日映画を見た。 (I watched a movie yesterday.)', 'まだ食べていない。 (I haven\'t eaten yet.)'],
  },
  {
    title: '～ない form (negative)',
    level: 'N5',
    pattern: 'V-ない',
    explanation: 'The plain negative form of verbs.',
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
