const GIST_API = 'https://api.github.com/gists'

interface SyncConfig {
  token: string
  gistId: string | null
}

function getConfig(): SyncConfig {
  return {
    token: localStorage.getItem('github_token') || '',
    gistId: localStorage.getItem('gist_id'),
  }
}

export function isConfigured(): boolean {
  const cfg = getConfig()
  return !!(cfg.token && cfg.gistId)
}

async function gistHeaders(): Promise<HeadersInit> {
  const cfg = getConfig()
  return {
    'Authorization': `Bearer ${cfg.token}`,
    'Accept': 'application/vnd.github.v3+json',
  }
}

export async function createSyncGist(): Promise<string> {
  const res = await fetch(GIST_API, {
    method: 'POST',
    headers: await gistHeaders(),
    body: JSON.stringify({
      description: 'Japanese Learning App - sync data (private)',
      public: false,
      files: {
        'japanese-learning-data.json': { content: '{}' },
      },
    }),
  })
  if (!res.ok) throw new Error(`Failed to create gist: ${res.status}`)
  const data = await res.json()
  const gistId = data.id as string
  localStorage.setItem('gist_id', gistId)
  return gistId
}

export async function pullSyncData(): Promise<Record<string, any[]>> {
  const cfg = getConfig()
  if (!cfg.gistId) throw new Error('Gist not configured')

  const res = await fetch(`${GIST_API}/${cfg.gistId}`, {
    headers: await gistHeaders(),
  })
  if (!res.ok) throw new Error(`Failed to pull gist: ${res.status}`)
  const data = await res.json()
  const file = data.files?.['japanese-learning-data.json']
  if (!file?.content) return {}
  try {
    return JSON.parse(file.content)
  } catch {
    return {}
  }
}

export interface SyncPayload {
  kana: any[]
  words: any[]
  grammar: any[]
  listening: any[]
  sessions: any[]
}

export async function pushSyncData(payload: SyncPayload): Promise<void> {
  const cfg = getConfig()
  if (!cfg.gistId) throw new Error('Gist not configured')

  const res = await fetch(`${GIST_API}/${cfg.gistId}`, {
    method: 'PATCH',
    headers: await gistHeaders(),
    body: JSON.stringify({
      files: {
        'japanese-learning-data.json': { content: JSON.stringify(payload) },
      },
    }),
  })
  if (!res.ok) throw new Error(`Failed to push gist: ${res.status}`)
}

/**
 * Merge remote data into local DB. Last-write-wins per record by updatedAt.
 */
export async function mergeRemoteIntoLocal(remoteData: Record<string, any[]>, db: any): Promise<void> {
  const tables = ['kana', 'words', 'grammar', 'listening', 'sessions']
  for (const table of tables) {
    const remoteRecords = remoteData[table] || []
    if (remoteRecords.length === 0) continue

    for (const remote of remoteRecords) {
      const local = await db.table(table).get(remote.id ?? remote.id)
      if (!local || (remote.updatedAt && remote.updatedAt > (local.updatedAt || 0))) {
        await db.table(table).put(remote)
      }
    }
  }
}
