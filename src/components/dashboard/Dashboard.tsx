import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, seedIfEmpty } from '../../db/database'
import { getDueWords } from '../../utils/srs'

export default function Dashboard() {
  const navigate = useNavigate()
  const [dueCount, setDueCount] = useState(0)
  const [newToday, setNewToday] = useState(0)
  const [kanaProficiency, setKanaProficiency] = useState(0)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    async function load() {
      await seedIfEmpty()

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

      // Streak (consecutive days with sessions)
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
      <div>
        <p className="text-sm text-gray-500">おはようございます</p>
        <h1 className="text-2xl font-bold text-gray-900">今日の目標</h1>
      </div>

      <div className="rounded-2xl p-5 text-white text-center"
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
