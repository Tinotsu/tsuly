import { useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, Download, Play, RefreshCcw, Save } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Button, buttonVariants } from '@/components/ui/button'
import { queryClient } from '@/lib/query_client'
import { query } from '@/lib/tuyau'
import { cn } from '@/lib/utils'

import { AutomationPanel } from './automation-panel'
import { parseSrt } from './captions'
import { captionFont, useGoogleCaptionFonts } from './caption-fonts'
import { apiBaseUrl, captionFontOptions } from './constants'
import { SettingsPanel } from './settings-panel'
import { draftFrom, settingsPayload } from './settings'
import type { DraftSettings } from './types'
import { VideoPreview } from './video-preview'

export function EditPage({ videoId }: { videoId: string }) {
  const { data: workspace } = useSuspenseQuery(
    query.workspace.show.queryOptions({}, { staleTime: 0 }),
  )
  const video = workspace.videos.find(item => item.id === videoId)
  const editingJob = video?.editingJob ?? null
  const recording = video?.recordings.find(item => item.id === editingJob?.recordingId) ?? null
  const [draft, setDraft] = useState<DraftSettings | null>(() =>
    editingJob && recording ? draftFrom(editingJob, recording) : null,
  )
  const saveSettings = useMutation(
    query.workspace.updateVideoEditingSettings.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: query.workspace.show.queryOptions({}).queryKey,
        })
      },
    }),
  )
  const startEditing = useMutation(
    query.workspace.startVideoEditingJob.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: query.workspace.show.queryOptions({}).queryKey,
        })
      },
    }),
  )
  const renderFinal = useMutation(
    query.workspace.renderFinalVideoEditingJob.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: query.workspace.show.queryOptions({}).queryKey,
        })
      },
    }),
  )
  const googleFonts = useQuery({
    queryKey: ['google-fonts'],
    queryFn: async () => {
      const response = await fetch(`${apiBaseUrl}/content/google-fonts`, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      })

      if (!response.ok) throw new Error('Could not load Google Fonts')

      const data = (await response.json()) as { fonts?: string[] }
      return data.fonts ?? []
    },
    staleTime: 24 * 60 * 60 * 1000,
  })
  const captionsPath = editingJob?.captionsPath ?? ''
  const captions = useQuery({
    queryKey: ['edit-captions', captionsPath],
    enabled: Boolean(captionsPath),
    queryFn: async () => {
      const response = await fetch(`${apiBaseUrl}${captionsPath}`, {
        credentials: 'include',
        headers: { Accept: 'text/plain' },
      })

      if (!response.ok) throw new Error('Could not load captions')

      return parseSrt(await response.text())
    },
  })
  const selectedCaptionFont = captionFont(draft?.captionFont ?? '')
  const fontOptions = useMemo(() => {
    if (captionFontOptions.includes(selectedCaptionFont as (typeof captionFontOptions)[number])) {
      return [...captionFontOptions]
    }

    return [selectedCaptionFont, ...captionFontOptions]
  }, [selectedCaptionFont])
  const searchableFontOptions = useMemo(() => {
    const fonts = googleFonts.data ?? []
    if (!fonts.length) return fontOptions
    if (fonts.includes(selectedCaptionFont)) return fonts
    return [selectedCaptionFont, ...fonts]
  }, [fontOptions, googleFonts.data, selectedCaptionFont])

  useGoogleCaptionFonts(fontOptions)

  useEffect(() => {
    if (editingJob && recording) setDraft(draftFrom(editingJob, recording))
  }, [editingJob, recording])

  useEffect(() => {
    if (!editingJob || !['queued', 'processing'].includes(editingJob.status)) return

    const interval = window.setInterval(() => {
      void queryClient.invalidateQueries({
        queryKey: query.workspace.show.queryOptions({}).queryKey,
      })
    }, 2000)

    return () => window.clearInterval(interval)
  }, [editingJob])

  if (!video) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-[#f6f7f5] p-6 text-[#171812]">
        <div className="mx-auto max-w-3xl rounded-lg border bg-card p-6">
          <p className="text-lg font-semibold">Video not found</p>
          <Link to="/" hash="videos" className={cn(buttonVariants({ variant: 'outline' }), 'mt-4')}>
            <ArrowLeft />
            Back to videos
          </Link>
        </div>
      </main>
    )
  }

  if (!editingJob || !recording || !draft) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-[#f6f7f5] p-6 text-[#171812]">
        <div className="mx-auto max-w-3xl rounded-lg border bg-card p-6">
          <p className="text-lg font-semibold">No editable recording yet</p>
          <Link
            to="/videos/$videoId/record"
            params={{ videoId: video.id }}
            className={cn(buttonVariants({ variant: 'outline' }), 'mt-4')}
          >
            Record
          </Link>
        </div>
      </main>
    )
  }

  const activeEditingJob = editingJob
  const activeRecording = recording
  const activeDraft = draft
  const rawVideoUrl = activeRecording.storagePath
    ? `${apiBaseUrl}${activeRecording.storagePath}`
    : ''
  const normalizedVideoUrl = activeEditingJob.normalizedPath
    ? `${apiBaseUrl}${activeEditingJob.normalizedPath}`
    : ''
  const finalVideoUrl = activeEditingJob.finalPath
    ? `${apiBaseUrl}${activeEditingJob.finalPath}`
    : ''
  const finalDownloadUrl = `${apiBaseUrl}/content/videos/${video.id}/final.mp4`
  const isPrepared = Boolean(activeEditingJob.normalizedPath && activeEditingJob.captionsPath)
  const isRunning = ['queued', 'processing'].includes(activeEditingJob.status)
  const canChangeSettings = !isRunning
  const canPrepare = ['draft', 'failed'].includes(activeEditingJob.status) && !isPrepared
  const canRender = isPrepared && !isRunning
  const isBusy = saveSettings.isPending || startEditing.isPending || renderFinal.isPending
  const trimStartSeconds = activeDraft.trimStartMs / 1000
  const trimEndSeconds = activeDraft.trimEndMs / 1000
  const durationSeconds = Math.max(
    0.1,
    (activeRecording.durationMs ?? activeDraft.trimEndMs) / 1000,
  )
  const trimValid =
    activeDraft.trimStartMs >= 0 &&
    activeDraft.trimEndMs > activeDraft.trimStartMs &&
    trimEndSeconds <= durationSeconds
  const previewDurationSeconds = Math.max(0.1, trimEndSeconds - trimStartSeconds)
  const showFinal = activeEditingJob.status === 'ready' && Boolean(finalVideoUrl)
  const previewVideoUrl = showFinal ? finalVideoUrl : normalizedVideoUrl || rawVideoUrl

  async function saveDraft() {
    await saveSettings.mutateAsync({
      params: { id: activeEditingJob.id },
      body: settingsPayload(activeDraft),
    })
  }

  async function prepareEdit() {
    if (activeEditingJob.status === 'draft' || activeEditingJob.status === 'failed') {
      await saveDraft()
    }

    await startEditing.mutateAsync({
      params: { id: activeEditingJob.id },
    })
  }

  async function renderFinalEdit() {
    await saveDraft()

    await renderFinal.mutateAsync({
      params: { id: activeEditingJob.id },
    })
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#f6f7f5] text-[#171812] lg:h-[calc(100vh-4rem)] lg:overflow-hidden">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:grid lg:h-full lg:grid-rows-[auto_minmax(0,1fr)_auto] lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link
              to="/"
              hash="videos"
              className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Videos
            </Link>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">{video.title}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {canChangeSettings ? (
              <Button
                type="button"
                variant="outline"
                disabled={isBusy || !trimValid}
                onClick={saveDraft}
              >
                <Save />
                Save
              </Button>
            ) : null}
            {canPrepare ? (
              <Button type="button" disabled={isBusy || !trimValid} onClick={prepareEdit}>
                <RefreshCcw />
                {activeEditingJob.status === 'failed' ? 'Retry prepare' : 'Prepare edit'}
              </Button>
            ) : canRender ? (
              <Button type="button" disabled={isBusy || !trimValid} onClick={renderFinalEdit}>
                <Play />
                {activeEditingJob.status === 'failed' ? 'Retry render' : 'Render final'}
              </Button>
            ) : null}
            {finalVideoUrl ? (
              <a href={finalDownloadUrl} download className={buttonVariants()}>
                <Download />
                Download MP4
              </a>
            ) : null}
          </div>
        </div>

        <div className="grid min-h-0 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <VideoPreview
            videoUrl={previewVideoUrl}
            captions={captions.data ?? []}
            draft={activeDraft}
            status={activeEditingJob.status}
            durationFrames={Math.max(1, Math.ceil(previewDurationSeconds * 30))}
            showFinal={showFinal}
          />

          <aside className="space-y-4 lg:min-h-0 lg:overflow-y-auto">
            <SettingsPanel
              draft={activeDraft}
              fontOptions={fontOptions}
              searchOptions={searchableFontOptions}
              disabled={!canChangeSettings || isBusy}
              trimDisabled={activeEditingJob.status !== 'draft'}
              durationSeconds={durationSeconds}
              trimStartSeconds={trimStartSeconds}
              trimEndSeconds={trimEndSeconds}
              onChange={setDraft}
            />
            {!trimValid ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                Trim end must be after trim start and inside the recording duration.
              </p>
            ) : null}
          </aside>
        </div>

        <AutomationPanel editingJob={activeEditingJob} />
      </div>
    </main>
  )
}
