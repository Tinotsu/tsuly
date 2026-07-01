import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  Check,
  Circle,
  Download,
  LoaderCircle,
  Play,
  RefreshCcw,
  Save,
  SlidersHorizontal,
} from 'lucide-react'
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'

import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { queryClient } from '@/lib/query_client'
import { query } from '@/lib/tuyau'
import { cn } from '@/lib/utils'
import type { Video } from '@/workspace/types'

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3333'
const fontOptions = [
  { value: 'sans', label: 'Sans' },
  { value: 'serif', label: 'Serif' },
  { value: 'mono', label: 'Mono' },
] as const
const positionOptions = [
  { value: 'top', label: 'Top' },
  { value: 'middle', label: 'Middle' },
  { value: 'bottom', label: 'Bottom' },
] as const

type EditingJob = NonNullable<Video['editingJob']>
type Recording = Video['recordings'][number]
type CaptionFont = (typeof fontOptions)[number]['value']
type CaptionPosition = (typeof positionOptions)[number]['value']
type DraftSettings = Omit<EditingJob['settings'], 'captionFont' | 'captionPosition'> & {
  captionFont: CaptionFont
  captionPosition: CaptionPosition
  trimStartMs: number
  trimEndMs: number
}

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
  const finalVideoUrl = activeEditingJob.finalPath
    ? `${apiBaseUrl}${activeEditingJob.finalPath}`
    : ''
  const finalDownloadUrl = `${apiBaseUrl}/content/videos/${video.id}/final.mp4`
  const canEdit = activeEditingJob.status === 'draft'
  const isBusy = saveSettings.isPending || startEditing.isPending
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

  async function saveDraft() {
    await saveSettings.mutateAsync({
      params: { id: activeEditingJob.id },
      body: settingsPayload(activeDraft),
    })
  }

  async function saveAndStart() {
    if (activeEditingJob.status === 'draft') await saveDraft()

    await startEditing.mutateAsync({
      params: { id: activeEditingJob.id },
    })
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#f6f7f5] text-[#171812]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
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
            {canEdit ? (
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
            {activeEditingJob.status === 'failed' ? (
              <Button type="button" disabled={isBusy} onClick={saveAndStart}>
                <RefreshCcw />
                Retry
              </Button>
            ) : canEdit ? (
              <Button type="button" disabled={isBusy || !trimValid} onClick={saveAndStart}>
                <Play />
                Start auto edit
              </Button>
            ) : finalVideoUrl ? (
              <a href={finalDownloadUrl} download className={buttonVariants()}>
                <Download />
                Download MP4
              </a>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="grid gap-4 lg:grid-cols-[minmax(260px,360px)_minmax(0,1fr)]">
            <VideoPreview
              rawVideoUrl={rawVideoUrl}
              finalVideoUrl={finalVideoUrl}
              draft={activeDraft}
              status={activeEditingJob.status}
            />
            <AutomationPanel editingJob={activeEditingJob} />
          </section>

          <aside className="space-y-4">
            <SettingsPanel
              draft={activeDraft}
              disabled={!canEdit || isBusy}
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
      </div>
    </main>
  )
}

function VideoPreview({
  rawVideoUrl,
  finalVideoUrl,
  draft,
  status,
}: {
  rawVideoUrl: string
  finalVideoUrl: string
  draft: DraftSettings
  status: EditingJob['status']
}) {
  const source = finalVideoUrl || rawVideoUrl

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Preview</p>
          <h2 className="text-lg font-semibold">
            {status === 'ready' ? 'Final edit' : 'Raw take'}
          </h2>
        </div>
        <span className="rounded-md border bg-background px-2 py-1 text-xs font-medium capitalize">
          {status}
        </span>
      </div>

      <div className="mt-4 flex justify-center">
        <div className="relative w-full max-w-[320px] overflow-hidden rounded-md bg-black">
          {source ? (
            <video
              src={source}
              className="aspect-[9/16] w-full object-cover"
              controls
              playsInline
              preload="metadata"
            />
          ) : (
            <div className="aspect-[9/16]" />
          )}
          {!finalVideoUrl ? <SubtitlePreview draft={draft} /> : null}
        </div>
      </div>
    </div>
  )
}

function SubtitlePreview({ draft }: { draft: DraftSettings }) {
  const positionClass =
    draft.captionPosition === 'top'
      ? 'top-[12%]'
      : draft.captionPosition === 'middle'
        ? 'top-1/2 -translate-y-1/2'
        : 'bottom-[10%]'

  return (
    <div
      className={cn('pointer-events-none absolute inset-x-5 flex justify-center', positionClass)}
    >
      <div
        className="max-w-full whitespace-pre-line px-3 py-2 text-center font-bold leading-tight"
        style={{
          backgroundColor: draft.captionBackgroundEnabled
            ? rgba(draft.captionBackgroundColor, draft.captionBackgroundOpacity)
            : 'transparent',
          color: draft.captionTextColor,
          fontFamily: fontFamily(draft.captionFont),
          fontSize: Math.max(17, Math.round(draft.captionFontSize * 0.34)),
        }}
      >
        {lineBreakPreview('Your caption style appears here')}
      </div>
    </div>
  )
}

function AutomationPanel({ editingJob }: { editingJob: EditingJob }) {
  const steps = useMemo(() => automationSteps(editingJob), [editingJob])

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="size-4 text-sky-700" />
        <h2 className="text-lg font-semibold">Automation</h2>
      </div>

      {editingJob.status === 'failed' ? (
        <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {editingJob.errorMessage || 'Render failed'}
        </p>
      ) : null}

      <div className="mt-4 space-y-2">
        {steps.map(step => (
          <div
            key={step.label}
            className="flex items-center gap-3 rounded-md border bg-background p-3"
          >
            <span
              className={cn(
                'flex size-6 items-center justify-center rounded-full border',
                step.done && 'border-emerald-600 bg-emerald-600 text-white',
                step.active && !step.done && 'border-sky-700 text-sky-700',
              )}
            >
              {step.done ? (
                <Check className="size-3.5" />
              ) : step.active ? (
                <LoaderCircle className="size-3.5 animate-spin" />
              ) : (
                <Circle className="size-3" />
              )}
            </span>
            <div>
              <p className="text-sm font-medium">{step.label}</p>
              <p className="text-xs text-muted-foreground">{step.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SettingsPanel({
  draft,
  disabled,
  durationSeconds,
  trimStartSeconds,
  trimEndSeconds,
  onChange,
}: {
  draft: DraftSettings
  disabled: boolean
  durationSeconds: number
  trimStartSeconds: number
  trimEndSeconds: number
  onChange: Dispatch<SetStateAction<DraftSettings | null>>
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="text-lg font-semibold">Edit settings</h2>

      <div className="mt-4 space-y-5">
        <div className="space-y-2">
          <Label>Font</Label>
          <div className="grid grid-cols-3 gap-2">
            {fontOptions.map(option => (
              <Button
                key={option.value}
                type="button"
                variant={draft.captionFont === option.value ? 'default' : 'outline'}
                disabled={disabled}
                onClick={() => updateDraft(onChange, 'captionFont', option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label="Font size"
            value={draft.captionFontSize}
            min={36}
            max={96}
            disabled={disabled}
            onChange={value => updateDraft(onChange, 'captionFontSize', value)}
          />
          <NumberField
            label="Words"
            value={draft.wordsPerCaption}
            min={3}
            max={12}
            disabled={disabled}
            onChange={value => updateDraft(onChange, 'wordsPerCaption', value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ColorField
            label="Text"
            value={draft.captionTextColor}
            disabled={disabled}
            onChange={value => updateDraft(onChange, 'captionTextColor', value)}
          />
          <ColorField
            label="Background"
            value={draft.captionBackgroundColor}
            disabled={disabled || !draft.captionBackgroundEnabled}
            onChange={value => updateDraft(onChange, 'captionBackgroundColor', value)}
          />
        </div>

        <label className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2 text-sm font-medium">
          Background box
          <input
            type="checkbox"
            checked={draft.captionBackgroundEnabled}
            disabled={disabled}
            onChange={event =>
              updateDraft(onChange, 'captionBackgroundEnabled', event.target.checked)
            }
            className="size-4"
          />
        </label>

        <NumberField
          label="Background opacity"
          value={draft.captionBackgroundOpacity}
          min={0}
          max={100}
          disabled={disabled || !draft.captionBackgroundEnabled}
          onChange={value => updateDraft(onChange, 'captionBackgroundOpacity', value)}
        />

        <div className="space-y-2">
          <Label>Position</Label>
          <div className="grid grid-cols-3 gap-2">
            {positionOptions.map(option => (
              <Button
                key={option.value}
                type="button"
                variant={draft.captionPosition === option.value ? 'default' : 'outline'}
                disabled={disabled}
                onClick={() => updateDraft(onChange, 'captionPosition', option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label="Trim start"
            value={roundSeconds(trimStartSeconds)}
            min={0}
            max={durationSeconds}
            step={0.1}
            disabled={disabled}
            onChange={value => updateDraft(onChange, 'trimStartMs', Math.round(value * 1000))}
          />
          <NumberField
            label="Trim end"
            value={roundSeconds(trimEndSeconds)}
            min={0.1}
            max={durationSeconds}
            step={0.1}
            disabled={disabled}
            onChange={value => updateDraft(onChange, 'trimEndMs', Math.round(value * 1000))}
          />
        </div>

        <label className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2 text-sm font-medium">
          Silence removal
          <input
            type="checkbox"
            checked={draft.removeSilence}
            disabled={disabled}
            onChange={event => updateDraft(onChange, 'removeSilence', event.target.checked)}
            className="size-4"
          />
        </label>

        <NumberField
          label="Silence threshold"
          value={draft.silenceThresholdSeconds}
          min={0.2}
          max={2}
          step={0.1}
          disabled={disabled || !draft.removeSilence}
          onChange={value => updateDraft(onChange, 'silenceThresholdSeconds', value)}
        />
      </div>
    </div>
  )
}

function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  disabled,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  disabled: boolean
  onChange: (value: number) => void
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={event => onChange(Number(event.target.value))}
      />
    </div>
  )
}

function ColorField({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string
  value: string
  disabled: boolean
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="color"
        value={value}
        disabled={disabled}
        onChange={event => onChange(event.target.value)}
        className="p-1"
      />
    </div>
  )
}

function updateDraft<K extends keyof DraftSettings>(
  setDraft: Dispatch<SetStateAction<DraftSettings | null>>,
  key: K,
  value: DraftSettings[K],
) {
  setDraft(current => (current ? { ...current, [key]: value } : current))
}

function draftFrom(editingJob: EditingJob, recording: Recording): DraftSettings {
  return {
    ...editingJob.settings,
    captionFont: captionFont(editingJob.settings.captionFont),
    captionPosition: captionPosition(editingJob.settings.captionPosition),
    trimStartMs: recording.trimStartMs ?? 0,
    trimEndMs: recording.trimEndMs ?? recording.durationMs ?? 0,
  }
}

function captionFont(value: string): CaptionFont {
  if (value === 'serif' || value === 'mono') return value
  return 'sans'
}

function captionPosition(value: string): CaptionPosition {
  if (value === 'top' || value === 'middle') return value
  return 'bottom'
}

function settingsPayload(draft: DraftSettings) {
  return {
    trimStartMs: draft.trimStartMs,
    trimEndMs: draft.trimEndMs,
    captionFont: draft.captionFont,
    captionFontSize: draft.captionFontSize,
    captionTextColor: draft.captionTextColor,
    captionBackgroundEnabled: draft.captionBackgroundEnabled,
    captionBackgroundColor: draft.captionBackgroundColor,
    captionBackgroundOpacity: draft.captionBackgroundOpacity,
    captionPosition: draft.captionPosition,
    wordsPerCaption: draft.wordsPerCaption,
    removeSilence: draft.removeSilence,
    silenceThresholdSeconds: draft.silenceThresholdSeconds,
  }
}

function automationSteps(editingJob: EditingJob) {
  const currentStep = editingJob.currentStep
  const afterSilence = ['captioning', 'rendering', 'done'].includes(currentStep ?? '')

  return [
    {
      label: 'Queued',
      detail: 'Waiting for the worker',
      active: editingJob.status === 'queued',
      done: !['draft', 'queued'].includes(editingJob.status),
    },
    {
      label: 'Normalize video',
      detail: 'Apply trim and vertical crop',
      active: currentStep === 'normalizing',
      done: Boolean(editingJob.normalizedPath),
    },
    {
      label: 'Extract audio',
      detail: 'Prepare audio for transcription',
      active: currentStep === 'extracting_audio',
      done: Boolean(editingJob.audioPath),
    },
    {
      label: 'Transcribe',
      detail: 'Create timestamped speech segments',
      active: currentStep === 'transcribing',
      done: Boolean(editingJob.transcriptPath),
    },
    ...(editingJob.settings.removeSilence
      ? [
          {
            label: 'Detect silence',
            detail: 'Find pauses to remove',
            active: currentStep === 'detecting_silence',
            done: afterSilence || Boolean(editingJob.captionsPath),
          },
        ]
      : []),
    {
      label: 'Generate captions',
      detail: 'Build subtitle timings',
      active: currentStep === 'captioning',
      done: Boolean(editingJob.captionsPath),
    },
    {
      label: 'Render MP4',
      detail: 'Export the final edit',
      active: currentStep === 'rendering',
      done: Boolean(editingJob.finalPath),
    },
  ]
}

function rgba(hex: string, opacity: number) {
  const value = hex.replace('#', '')
  const red = Number.parseInt(value.slice(0, 2), 16)
  const green = Number.parseInt(value.slice(2, 4), 16)
  const blue = Number.parseInt(value.slice(4, 6), 16)

  return `rgb(${red} ${green} ${blue} / ${opacity / 100})`
}

function fontFamily(font: string) {
  if (font === 'serif') return 'Georgia, serif'
  if (font === 'mono') return 'Menlo, monospace'
  return 'Arial, sans-serif'
}

function lineBreakPreview(text: string) {
  return text.replace(' appears ', '\nappears ')
}

function roundSeconds(seconds: number) {
  return Math.round(seconds * 10) / 10
}
