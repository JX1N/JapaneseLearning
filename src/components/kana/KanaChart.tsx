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
