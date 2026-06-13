import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, seedIfEmpty, type WordRecord } from '../../db/database'
import { getDueWords, computeNextReview, type Rating } from '../../utils/srs'
import ReviewCard from './ReviewCard'

export default function ReviewPage() {
  const navigate = useNavigate()
  const [words, setWords] = useState<WordRecord[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [reviewed, setReviewed] = useState(0)

  useEffect(() => {
    async function load() {
      await seedIfEmpty()
      const all = await db.words.toArray()
      const due = getDueWords(all)
      if (due.length === 0) {
        setCompleted(true)
      } else {
        setWords(due)
      }
    }
    load()
  }, [])

  const handleRate = async (rating: Rating) => {
    const word = words[currentIndex]
    const prevState = {
      interval: word.srsInterval,
      ease: word.srsEase,
      due: word.srsDue,
      reps: word.srsReps,
      lapses: word.srsLapses,
    }
    const next = computeNextReview(prevState, rating)
    const newWordCount = word.srsReps === 0 ? 1 : 0

    await db.words.update(word.id!, {
      srsInterval: next.interval,
      srsEase: next.ease,
      srsDue: next.due,
      srsReps: next.reps,
      srsLapses: next.lapses,
      updatedAt: Date.now(),
    })

    const today = new Date().toISOString().split('T')[0]
    const existing = await db.sessions.where({ date: today, type: 'vocabulary' }).first()
    if (existing) {
      await db.sessions.update(existing.id!, {
        reviewsCount: existing.reviewsCount + 1,
        newCount: existing.newCount + newWordCount,
      })
    } else {
      await db.sessions.add({
        date: today,
        type: 'vocabulary',
        reviewsCount: 1,
        newCount: newWordCount,
      })
    }

    setReviewed(r => r + 1)

    if (currentIndex + 1 >= words.length) {
      setCompleted(true)
    } else {
      setCurrentIndex(i => i + 1)
    }
  }

  if (completed) {
    return (
      <div className="p-4 max-w-lg mx-auto text-center py-20">
        {words.length === 0 ? (
          <>
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-xl font-bold mb-2">全部搞定！</h2>
            <p className="text-gray-500 mb-6">没有待复习的单词了</p>
            <button onClick={() => navigate('/vocabulary/manage')}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium">
              添加新单词
            </button>
          </>
        ) : (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-bold mb-2">复习完成</h2>
            <p className="text-gray-500 mb-6">本次复习了 {reviewed} 个单词</p>
            <button onClick={() => navigate('/')}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium">
              返回首页
            </button>
          </>
        )}
      </div>
    )
  }

  if (words.length === 0) return null

  const word = words[currentIndex]

  return (
    <ReviewCard
      term={word.term}
      reading={word.reading}
      meaning={word.meaning}
      partOfSpeech={word.partOfSpeech}
      exampleSentence={word.exampleSentence}
      current={currentIndex + 1}
      total={words.length}
      onRate={handleRate}
    />
  )
}
