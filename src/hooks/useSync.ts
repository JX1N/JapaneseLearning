import { useEffect, useCallback } from 'react'
import { db, seedIfEmpty } from '../db/database'
import { isConfigured, pullSyncData, pushSyncData, mergeRemoteIntoLocal, type SyncPayload } from '../utils/sync'

export function useSync() {
  const pull = useCallback(async () => {
    if (!isConfigured()) return
    try {
      await seedIfEmpty()
      const remote = await pullSyncData()
      await mergeRemoteIntoLocal(remote, db)
    } catch (err) {
      console.warn('Sync pull failed:', err)
    }
  }, [])

  const push = useCallback(async () => {
    if (!isConfigured()) return
    try {
      const payload: SyncPayload = {
        kana: await db.kana.toArray(),
        words: await db.words.toArray(),
        grammar: await db.grammar.toArray(),
        listening: await db.listening.toArray(),
        sessions: await db.sessions.toArray(),
      }
      await pushSyncData(payload)
    } catch (err) {
      console.warn('Sync push failed:', err)
    }
  }, [])

  useEffect(() => {
    pull()
  }, [pull])

  let pushTimer: ReturnType<typeof setTimeout> | null = null

  const schedulePush = useCallback(() => {
    if (pushTimer) clearTimeout(pushTimer)
    pushTimer = setTimeout(push, 3000)
  }, [push])

  return { pull, push, schedulePush }
}
