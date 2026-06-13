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
