export type Workspace = {
  ideas: Array<{
    id: string
    title: string
    pillar: string
    status: string
    rating: number
    note: string
  }>
  videos: Array<{
    id: string
    title: string
    idea: string
    transcript: string
    script: {
      hook: string
      spokenScript: string
      onScreenText: string
    }
    recordings: Array<{
      id: string
      label: string
      storagePath: string | null
      takeId: string | null
      durationMs: number | null
      createdAt: string | null
    }>
    editingJob: {
      id: string
      status: 'queued' | 'processing' | 'ready' | 'failed'
      finalPath: string | null
      errorMessage: string | null
    } | null
    editing: Array<{ label: string; done: boolean }>
    inProduction: boolean
    preview: string
    publish: string
    stages: Array<{ label: string; done: boolean }>
  }>
  brandBrain: Array<{
    id: string
    key: string
    title: string
    summary: string
    fields: Array<{ id: string; label: string; value: string }>
  }>
}

export type WorkspaceTab = 'ideas' | 'videos' | 'brand'
export type Idea = Workspace['ideas'][number]
export type Video = Workspace['videos'][number]
export type BrandSection = Workspace['brandBrain'][number]
