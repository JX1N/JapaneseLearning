import { useState } from 'react'

interface Track {
  id: number
  title: string
  transcript: string
  translation: string
  difficulty: string
}

const PLACEHOLDER_TRACKS: Track[] = [
  {
    id: 1,
    title: '朝の会話 (Morning Conversation)',
    transcript: 'A: おはようございます。\nB: おはよう。今日はいい天気ですね。\nA: そうですね。どこに行きますか。\nB: 学校に行きます。',
    translation: 'A: Good morning.\nB: Morning. Nice weather today.\nA: Yes. Where are you going?\nB: I\'m going to school.',
    difficulty: 'beginner',
  },
  {
    id: 2,
    title: 'レストランで (At the Restaurant)',
    transcript: 'A: いらっしゃいませ。何名様ですか。\nB: 二人です。\nA: こちらへどうぞ。\nB: メニューをお願いします。',
    translation: 'A: Welcome. How many people?\nB: Two.\nA: This way please.\nB: Can I have the menu?',
    difficulty: 'beginner',
  },
  {
    id: 3,
    title: '買い物 (Shopping)',
    transcript: 'A: これ、いくらですか。\nB: 500円です。\nA: ちょっと高いですね。\nB: じゃあ、400円でどうですか。',
    translation: 'A: How much is this?\nB: 500 yen.\nA: That\'s a bit expensive.\nB: How about 400 yen?',
    difficulty: 'beginner',
  },
]

export default function ListeningPage() {
  const [selected, setSelected] = useState<Track | null>(null)
  const [showTranslation, setShowTranslation] = useState(false)

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-4">听力练习</h1>

      {!selected ? (
        <div className="space-y-3">
          {PLACEHOLDER_TRACKS.map(track => (
            <button
              key={track.id}
              onClick={() => { setSelected(track); setShowTranslation(false) }}
              className="w-full bg-white border border-gray-200 rounded-xl p-4 text-left active:scale-[0.99] transition-transform"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎧</span>
                <div>
                  <div className="font-semibold">{track.title}</div>
                  <div className="text-xs text-gray-400">{track.difficulty}</div>
                </div>
              </div>
            </button>
          ))}
          <p className="text-xs text-gray-400 text-center mt-4">
            📌 音频文件放到 public/audio/ 目录后即可播放
          </p>
        </div>
      ) : (
        <div>
          <button onClick={() => setSelected(null)} className="text-blue-600 text-sm mb-4">← 返回列表</button>

          <h2 className="text-lg font-bold mb-1">{selected.title}</h2>
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">{selected.difficulty}</span>

          <div className="bg-gray-100 rounded-xl p-6 text-center my-4">
            <div className="text-3xl mb-2">🔈</div>
            <p className="text-sm text-gray-500">音频播放器</p>
            <p className="text-xs text-gray-400 mt-1">将 .mp3 文件放入 public/audio/ 即可使用</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
            <h3 className="font-semibold mb-2">原文</h3>
            <p className="text-gray-800 whitespace-pre-line leading-relaxed">{selected.transcript}</p>
          </div>

          <button
            onClick={() => setShowTranslation(!showTranslation)}
            className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm mb-4"
          >
            {showTranslation ? '隐藏翻译' : '显示翻译'}
          </button>

          {showTranslation && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="font-semibold mb-2 text-blue-700">翻译</h3>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">{selected.translation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
