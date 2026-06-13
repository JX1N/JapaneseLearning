import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import MoreMenu from './MoreMenu'

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)

  const path = location.pathname
  const activeTab =
    path === '/' ? 'home' :
    path.startsWith('/vocabulary') ? 'vocab' :
    path.startsWith('/grammar') ? 'grammar' :
    path.startsWith('/listening') ? 'listening' :
    'more'

  const tabs = [
    { key: 'home', label: '首页', emoji: '🏠', path: '/' },
    { key: 'vocab', label: '单词', emoji: '📝', path: '/vocabulary' },
    { key: 'grammar', label: '语法', emoji: '📖', path: '/grammar' },
    { key: 'listening', label: '听力', emoji: '🎧', path: '/listening' },
    { key: 'more', label: '更多', emoji: '⋯', action: () => setMoreOpen(true) },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 pb-16">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
        <div className="flex max-w-lg mx-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => tab.action ? tab.action() : navigate(tab.path!)}
              className={`flex-1 flex flex-col items-center py-2 text-[10px] ${
                activeTab === tab.key ? 'text-blue-600 font-semibold' : 'text-gray-500'
              }`}
            >
              <span className="text-lg leading-none">{tab.emoji}</span>
              <span className="mt-0.5">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <MoreMenu open={moreOpen} onClose={() => setMoreOpen(false)} />
    </div>
  )
}
