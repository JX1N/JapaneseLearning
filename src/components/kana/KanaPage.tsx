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
