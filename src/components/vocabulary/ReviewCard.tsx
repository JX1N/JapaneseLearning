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
      <div className="text-center text-sm text-gray-400 py-3">
        {current} / {total}
      </div>

      <div
        onClick={handleReveal}
        className={`flex-1 flex flex-col items-center justify-center p-6 cursor-pointer select-none ${
          revealed ? 'bg-blue-50/50' : ''
        }`}
      >
        <div className="text-4xl font-bold text-gray-900 mb-2">{term}</div>
        <div className="text-lg text-gray-500 mb-3">{reading}</div>
        <div className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-500">{partOfSpeech}</div>

        {revealed ? (
          <div className="mt-8 text-center">
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
