import { useNavigate } from 'react-router-dom'
import { useEffect, useRef } from 'react'

interface MoreMenuProps {
  open: boolean
  onClose: () => void
}

export default function MoreMenu({ open, onClose }: MoreMenuProps) {
  const navigate = useNavigate()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      const handler = (e: MouseEvent) => {
        if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
          onClose()
        }
      }
      document.addEventListener('mousedown', handler)
      return () => document.removeEventListener('mousedown', handler)
    }
  }, [open, onClose])

  if (!open) return null

  const items = [
    { label: '五十音', emoji: '🔤', path: '/kana' },
    { label: '设置', emoji: '⚙️', path: '/settings' },
  ]

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div
        ref={panelRef}
        className="fixed bottom-16 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl"
      >
        <div className="p-4 space-y-2">
          {items.map(item => (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); onClose() }}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-left"
            >
              <span className="text-2xl">{item.emoji}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
