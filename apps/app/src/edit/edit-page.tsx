import { useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  Check,
  ChevronDown,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { queryClient } from '@/lib/query_client'
import { query } from '@/lib/tuyau'
import { cn } from '@/lib/utils'
import type { Video } from '@/workspace/types'

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3333'
const captionFontOptions = [
  'Inter',
  'Montserrat',
  'Poppins',
  'Oswald',
  'Bebas Neue',
  'Anton',
  'Bangers',
  'Luckiest Guy',
  'Playfair Display',
  'Roboto Mono',
] as const
const positionOptions = [
  { value: 'top', label: 'Top' },
  { value: 'middle', label: 'Middle' },
  { value: 'bottom', label: 'Bottom' },
] as const

type EditingJob = NonNullable<Video['editingJob']>
type Recording = Video['recordings'][number]
type CaptionFont = string
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

        <div className="grid min-h-0 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <VideoPreview
            rawVideoUrl={rawVideoUrl}
            finalVideoUrl={finalVideoUrl}
            draft={activeDraft}
            status={activeEditingJob.status}
          />

          <aside className="space-y-4 lg:min-h-0 lg:overflow-y-auto">
            <SettingsPanel
              draft={activeDraft}
              fontOptions={fontOptions}
              searchOptions={searchableFontOptions}
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

        <AutomationPanel editingJob={activeEditingJob} />
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
    <div className="rounded-lg border bg-card p-4 lg:flex lg:min-h-0 lg:flex-col">
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

      <div className="mt-4 flex justify-center lg:min-h-0 lg:flex-1">
        <div className="relative w-full max-w-[320px] overflow-hidden rounded-md bg-black lg:aspect-[9/16] lg:h-full lg:w-auto">
          {source ? (
            <video
              src={source}
              className="aspect-[9/16] w-full object-cover lg:h-full"
              controls
              playsInline
              preload="metadata"
            />
          ) : (
            <div className="aspect-[9/16] lg:h-full" />
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

function useGoogleCaptionFonts(fonts: string[], linkId = 'caption-google-fonts') {
  const fontQuery = fonts.map(font => `family=${googleFontFamilyParam(font)}`).join('&')

  useEffect(() => {
    let link = document.getElementById(linkId) as HTMLLinkElement | null

    if (!link) {
      link = document.createElement('link')
      link.id = linkId
      link.rel = 'stylesheet'
      document.head.append(link)
    }

    link.href = `https://fonts.googleapis.com/css2?${fontQuery}&display=swap`
  }, [fontQuery, linkId])
}

function AutomationPanel({ editingJob }: { editingJob: EditingJob }) {
  const steps = useMemo(() => automationSteps(editingJob), [editingJob])

  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="size-4 text-sky-700" />
        <h2 className="font-semibold">Automation</h2>
      </div>

      {editingJob.status === 'failed' ? (
        <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {editingJob.errorMessage || 'Render failed'}
        </p>
      ) : null}

      <div className="mt-3 overflow-x-auto">
        <div className="relative flex min-w-[440px] items-center px-8 py-1">
          <div className="absolute left-8 right-8 top-1/2 h-px -translate-y-1/2 bg-border" />
          {steps.map(step => (
            <div key={step.label} className="relative flex flex-1 justify-center">
              <span
                title={`${step.label}: ${step.detail}`}
                className={cn(
                  'z-10 flex size-6 items-center justify-center rounded-full border bg-card',
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
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SettingsPanel({
  draft,
  fontOptions,
  searchOptions,
  disabled,
  durationSeconds,
  trimStartSeconds,
  trimEndSeconds,
  onChange,
}: {
  draft: DraftSettings
  fontOptions: string[]
  searchOptions: string[]
  disabled: boolean
  durationSeconds: number
  trimStartSeconds: number
  trimEndSeconds: number
  onChange: Dispatch<SetStateAction<DraftSettings | null>>
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <h2 className="text-lg font-semibold">Edit settings</h2>

      <div className="mt-3 space-y-3">
        <div className="space-y-2">
          <Label>Font</Label>
          <FontField
            value={draft.captionFont}
            options={fontOptions}
            searchOptions={searchOptions}
            disabled={disabled}
            onChange={value => updateDraft(onChange, 'captionFont', value)}
          />
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

function FontField({
  value,
  options,
  searchOptions,
  disabled,
  onChange,
}: {
  value: string
  options: string[]
  searchOptions: string[]
  disabled: boolean
  onChange: (value: string) => void
}) {
  const [search, setSearch] = useState('')
  const shownOptions = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return options

    return searchOptions
      .filter(font => font.toLowerCase().includes(term))
      .sort((a, b) => {
        const aStarts = a.toLowerCase().startsWith(term)
        const bStarts = b.toLowerCase().startsWith(term)
        if (aStarts !== bStarts) return aStarts ? -1 : 1
        return a.localeCompare(b)
      })
      .slice(0, 20)
  }, [options, search, searchOptions])

  useGoogleCaptionFonts(shownOptions, 'caption-google-font-menu')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        disabled={disabled}
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'h-auto w-full justify-between px-3 py-2 text-left',
        )}
      >
        <span className="min-w-0">
          <FontSample font={value} />
        </span>
        <ChevronDown className="size-4 opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-72">
        <div className="sticky top-0 z-10 bg-popover p-1">
          <Input
            value={search}
            placeholder="Search fonts"
            onClick={event => event.stopPropagation()}
            onKeyDown={event => event.stopPropagation()}
            onChange={event => setSearch(event.target.value)}
          />
        </div>
        {shownOptions.length ? (
          shownOptions.map(font => (
            <DropdownMenuItem
              key={font}
              onClick={() => onChange(font)}
              className={cn('px-2 py-2', font === value && 'bg-accent')}
            >
              <span
                className="truncate text-xl font-bold leading-tight"
                style={{ fontFamily: fontFamily(font) }}
              >
                {font}
              </span>
            </DropdownMenuItem>
          ))
        ) : (
          <div className="px-2 py-2 text-sm text-muted-foreground">No font found</div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function FontSample({ font }: { font: string }) {
  return (
    <>
      <span className="block text-xs font-medium text-muted-foreground">{font}</span>
      <span
        className="block truncate text-xl font-bold leading-tight"
        style={{ fontFamily: fontFamily(font) }}
      >
        Your captions
      </span>
    </>
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
  if (value === 'serif' || value === 'playfair') return 'Playfair Display'
  if (value === 'mono' || value === 'roboto-mono') return 'Roboto Mono'
  if (!value || value === 'sans' || value === 'inter') return 'Inter'
  return value
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
  return `${JSON.stringify(captionFont(font))}, Arial, sans-serif`
}

function googleFontFamilyParam(font: string) {
  return encodeURIComponent(font).replaceAll('%20', '+')
}

function lineBreakPreview(text: string) {
  return text.replace(' appears ', '\nappears ')
}

function roundSeconds(seconds: number) {
  return Math.round(seconds * 10) / 10
}
