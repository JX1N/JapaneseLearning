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
        {points.map(g => (
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

      {points.length === 0 && (
        <p className="text-center text-gray-400 py-8">该级别暂无语法点</p>
      )}
    </div>
  )
}
