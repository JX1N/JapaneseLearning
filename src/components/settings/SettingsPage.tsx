import { useState, useEffect } from 'react'
import { isConfigured, createSyncGist } from '../../utils/sync'
import { db } from '../../db/database'
import { useSync } from '../../hooks/useSync'
import Button from '../ui/Button'

export default function SettingsPage() {
  const { pull, push } = useSync()
  const [configured, setConfigured] = useState(false)
  const [token, setToken] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    setConfigured(isConfigured())
    setToken(localStorage.getItem('github_token') || '')
  }, [])

  const handleSaveToken = async () => {
    if (!token.trim()) return
    localStorage.setItem('github_token', token.trim())
    try {
      setStatus('创建 Gist 中...')
      await createSyncGist()
      setConfigured(true)
      setStatus('✅ 同步已配置！首次推送中...')
      await push()
      setStatus('✅ 同步完成')
    } catch (err: any) {
      setStatus(`❌ 失败: ${err.message}`)
    }
  }

  const handleExportAll = async () => {
    const data = {
      kana: await db.kana.toArray(),
      words: await db.words.toArray(),
      grammar: await db.grammar.toArray(),
      listening: await db.listening.toArray(),
      sessions: await db.sessions.toArray(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `japanese-learning-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    try {
      const data = JSON.parse(text)
      const tables = ['kana', 'words', 'grammar', 'listening', 'sessions']
      for (const table of tables) {
        if (data[table]) {
          await db.table(table).bulkPut(data[table])
        }
      }
      setStatus('✅ 导入成功')
    } catch {
      setStatus('❌ JSON 格式错误')
    }
  }

  const handleClearToken = () => {
    localStorage.removeItem('github_token')
    localStorage.removeItem('gist_id')
    setConfigured(false)
    setToken('')
    setStatus('同步已断开')
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-bold">设置</h1>

      <section className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <h2 className="font-semibold">多设备同步</h2>
        <p className="text-sm text-gray-500">
          使用 GitHub Gist 在电脑和手机间同步学习进度。
          <a href="https://github.com/settings/tokens/new?scopes=gist&description=Japanese%20Learning%20App" target="_blank" rel="noopener" className="text-blue-600 ml-1">
            创建 Token →
          </a>
        </p>

        {configured ? (
          <div className="space-y-2">
            <p className="text-sm text-green-600">✅ 已配置</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={pull}>拉取</Button>
              <Button size="sm" variant="secondary" onClick={push}>推送</Button>
              <Button size="sm" variant="ghost" onClick={handleClearToken}>断开</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <input
              type="password"
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="粘贴 GitHub Token"
              className="w-full border border-gray-200 rounded-lg p-2.5 text-sm"
            />
            <Button onClick={handleSaveToken} className="w-full">连接 GitHub Gist</Button>
          </div>
        )}
        {status && <p className="text-xs text-gray-500">{status}</p>}
      </section>

      <section className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <h2 className="font-semibold">数据管理</h2>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleExportAll}>导出 JSON</Button>
          <label className="inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-800 rounded-xl font-semibold text-sm cursor-pointer hover:bg-gray-200">
            导入 JSON
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-xl p-4">
        <h2 className="font-semibold mb-2">关于</h2>
        <p className="text-sm text-gray-500">日语学习助手 v1.0</p>
        <p className="text-xs text-gray-400 mt-1">数据存储在你的浏览器和 GitHub Gist 中</p>
      </section>
    </div>
  )
}
