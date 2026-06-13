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
