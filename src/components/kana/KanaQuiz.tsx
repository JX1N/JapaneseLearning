import { useState, useMemo } from 'react'
import { HIRAGANA, KATAKANA } from '../../data/kana'

export default function KanaQuiz() {
  const [pool, setPool] = useState<'hiragana' | 'katakana'>('hiragana')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [total, setTotal] = useState(0)
  const [finished, setFinished] = useState(false)

  const chars = useMemo(() => {
    const list = pool === 'hiragana' ? HIRAGANA : KATAKANA
    return [...list].sort(() => Math.random() - 0.5)
  }, [pool])

  const current = chars[currentIndex]

  const handleAnswer = (knew: boolean) => {
    if (knew) setCorrectCount(c => c + 1)
    setTotal(t => t + 1)
    if (currentIndex + 1 >= chars.length) {
      setFinished(true)
    } else {
      setCurrentIndex(i => i + 1)
      setShowAnswer(false)
    }
  }

  const restart = () => {
    setCurrentIndex(0)
    setShowAnswer(false)
    setCorrectCount(0)
    setTotal(0)
    setFinished(false)
  }

  if (finished) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🎉</div>
        <div className="text-2xl font-bold mb-2">{correctCount} / {total}</div>
        <p className="text-gray-500 mb-6">
          {correctCount === total ? '完美！' : correctCount / total >= 0.8 ? '很不错！' : '继续加油！'}
        </p>
        <button onClick={restart} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium">
          再来一次
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => { setPool('hiragana'); restart() }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${
            pool === 'hiragana' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
          }`}
        >
          平假名
        </button>
        <button
          onClick={() => { setPool('katakana'); restart() }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${
            pool === 'katakana' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
          }`}
        >
          片假名
        </button>
      </div>

      <div className="text-center text-sm text-gray-400 mb-6">
        {currentIndex + 1} / {chars.length}
      </div>

      <div
        onClick={() => setShowAnswer(true)}
        className="bg-white border-2 border-gray-200 rounded-2xl p-12 text-center cursor-pointer select-none"
      >
        <div className="text-6xl font-medium mb-4">{current.character}</div>
        {showAnswer && (
          <div className="text-xl text-blue-600 font-medium">
            {current.romaji}
          </div>
        )}
        {!showAnswer && (
          <div className="text-xs text-gray-400">点击看答案</div>
        )}
      </div>

      {showAnswer && (
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => handleAnswer(false)}
            className="flex-1 py-3 bg-red-50 border border-red-200 text-red-600 rounded-xl font-medium text-sm"
          >
            ✕ 不认识
          </button>
          <button
            onClick={() => handleAnswer(true)}
            className="flex-1 py-3 bg-green-50 border border-green-200 text-green-600 rounded-xl font-medium text-sm"
          >
            ✓ 认识
          </button>
        </div>
      )}
    </div>
  )
}
