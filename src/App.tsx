import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './components/dashboard/Dashboard'
import KanaPage from './components/kana/KanaPage'
import ReviewPage from './components/vocabulary/ReviewPage'
import WordManager from './components/vocabulary/WordManager'
import GrammarList from './components/grammar/GrammarList'
import GrammarDetail from './components/grammar/GrammarDetail'
import ListeningPage from './components/listening/ListeningPage'
import SettingsPage from './components/settings/SettingsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="kana" element={<KanaPage />} />
        <Route path="vocabulary" element={<ReviewPage />} />
        <Route path="vocabulary/manage" element={<WordManager />} />
        <Route path="grammar" element={<GrammarList />} />
        <Route path="grammar/:id" element={<GrammarDetail />} />
        <Route path="listening" element={<ListeningPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}
