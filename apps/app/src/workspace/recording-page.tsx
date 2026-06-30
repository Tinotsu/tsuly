import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, Check, Pause, Play, RefreshCcw, RotateCcw, Square, Upload } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { queryClient } from '@/lib/query_client'
import { query } from '@/lib/tuyau'
import { cn } from '@/lib/utils'

import type { Video } from './types'

type RecorderPhase = 'idle' | 'countdown' | 'recording' | 'paused' | 'review' | 'uploading' | 'done'
type RecordedTake = {
  id: string
  blob: Blob
  url: string
  startedAt: string
  stoppedAt: string
  durationMs: number
}

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3333'

export function RecordingPage({ videoId }: { videoId: string }) {
  const { data: workspace } = useSuspenseQuery(
    query.workspace.show.queryOptions({}, { staleTime: 30_000 }),
  )
  const video = workspace.videos.find(item => item.id === videoId)

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

  return <Recorder video={video} />
}

function Recorder({ video }: { video: Video }) {
  const previewRef = useRef<HTMLVideoElement | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const takeUrlRef = useRef('')
  const startedAtRef = useRef('')
  const startMsRef = useRef(0)
  const pausedAtRef = useRef(0)
  const pausedMsRef = useRef(0)

  const promptLines = useMemo(
    () => buildPromptLines(video.script.spokenScript),
    [video.script.spokenScript],
  )
  const [phase, setPhase] = useState<RecorderPhase>('idle')
  const [permissionError, setPermissionError] = useState('')
  const [cameraReady, setCameraReady] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [take, setTake] = useState<RecordedTake | null>(null)
  const [countdownSeconds, setCountdownSeconds] = useState(3)
  const [countdownLeft, setCountdownLeft] = useState(0)
  const [recordedMs, setRecordedMs] = useState(0)
  const [fontSize, setFontSize] = useState(34)
  const [scrollSpeed, setScrollSpeed] = useState(1)
  const [mirrorMode, setMirrorMode] = useState(true)
  const [lineHighlight, setLineHighlight] = useState(true)
  const [manualLine, setManualLine] = useState(0)
  const [manualOverride, setManualOverride] = useState(false)
  const [promptPosition, setPromptPosition] = useState({ x: 50, y: 22 })
  const [trimStartSeconds, setTrimStartSeconds] = useState(0)
  const [trimEndSeconds, setTrimEndSeconds] = useState(0)

  const autoLine = Math.min(
    promptLines.length - 1,
    Math.floor((recordedMs / 1000) * scrollSpeed * 0.45),
  )
  const currentLine = manualOverride ? manualLine : autoLine
  const durationSeconds = take ? Math.max(0.1, take.durationMs / 1000) : 1
  const canUpload =
    take &&
    trimStartSeconds >= 0 &&
    trimEndSeconds > trimStartSeconds &&
    trimEndSeconds <= durationSeconds

  useEffect(() => {
    void requestCamera()

    return () => {
      stopStream()
      if (takeUrlRef.current) URL.revokeObjectURL(takeUrlRef.current)
    }
  }, [])

  useEffect(() => {
    if (phase !== 'countdown') return
    if (countdownLeft <= 0) {
      beginRecording()
      return
    }

    const timer = window.setTimeout(() => setCountdownLeft(value => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [countdownLeft, phase])

  useEffect(() => {
    if (phase !== 'recording') return

    const timer = window.setInterval(() => setRecordedMs(currentRecordingMs()), 250)
    return () => window.clearInterval(timer)
  }, [phase])

  useEffect(() => {
    if (!previewRef.current || !streamRef.current) return
    if (!['idle', 'countdown', 'recording', 'paused'].includes(phase)) return

    previewRef.current.srcObject = streamRef.current
    void previewRef.current.play()
  }, [phase])

  async function requestCamera() {
    setPermissionError('')
    setCameraReady(false)
    stopStream()

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setPermissionError('This browser cannot record camera video.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: true,
      })
      streamRef.current = stream
      if (previewRef.current) {
        previewRef.current.srcObject = stream
        await previewRef.current.play()
      }
      setCameraReady(true)
    } catch {
      setPermissionError('Camera or microphone permission was denied.')
    }
  }

  function stopStream() {
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
    if (previewRef.current) previewRef.current.srcObject = null
  }

  function startCountdown() {
    setUploadError('')
    setManualOverride(false)
    setManualLine(0)
    setRecordedMs(0)
    setCountdownLeft(countdownSeconds)
    setPhase(countdownSeconds > 0 ? 'countdown' : 'idle')
    if (countdownSeconds === 0) beginRecording()
  }

  function beginRecording() {
    const stream = streamRef.current
    if (!stream) {
      setPermissionError('Camera is not ready.')
      return
    }

    const mimeType = recorderMimeType()
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
    chunksRef.current = []
    startedAtRef.current = new Date().toISOString()
    startMsRef.current = Date.now()
    pausedMsRef.current = 0
    pausedAtRef.current = 0

    recorder.ondataavailable = event => {
      if (event.data.size > 0) chunksRef.current.push(event.data)
    }
    recorder.onstop = () => {
      const stoppedAt = new Date().toISOString()
      const durationMs = currentRecordingMs()
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'video/webm' })
      const url = URL.createObjectURL(blob)

      setTake(current => {
        if (current) URL.revokeObjectURL(current.url)
        takeUrlRef.current = url
        return {
          id: crypto.randomUUID(),
          blob,
          url,
          startedAt: startedAtRef.current,
          stoppedAt,
          durationMs,
        }
      })
      setTrimStartSeconds(0)
      setTrimEndSeconds(Math.max(0.1, durationMs / 1000))
      stopStream()
      setCameraReady(false)
      setPhase('review')
    }

    recorderRef.current = recorder
    recorder.start(1000)
    setPhase('recording')
  }

  function pauseRecording() {
    recorderRef.current?.pause()
    pausedAtRef.current = Date.now()
    setRecordedMs(currentRecordingMs())
    setPhase('paused')
  }

  function resumeRecording() {
    if (pausedAtRef.current) {
      pausedMsRef.current += Date.now() - pausedAtRef.current
      pausedAtRef.current = 0
    }
    recorderRef.current?.resume()
    setPhase('recording')
  }

  function stopRecording() {
    if (pausedAtRef.current) {
      pausedMsRef.current += Date.now() - pausedAtRef.current
      pausedAtRef.current = 0
    }
    setRecordedMs(currentRecordingMs())
    recorderRef.current?.stop()
  }

  function toggleRecording() {
    if (phase === 'recording') pauseRecording()
    if (phase === 'paused') resumeRecording()
  }

  function retake() {
    if (take) URL.revokeObjectURL(take.url)
    takeUrlRef.current = ''
    chunksRef.current = []
    setTake(null)
    setUploadError('')
    setPhase('idle')
    setRecordedMs(0)
    setManualOverride(false)
    setManualLine(0)
    void requestCamera()
  }

  async function uploadTake() {
    if (!take || !canUpload) return

    setPhase('uploading')
    setUploadError('')

    const extension = take.blob.type.includes('mp4') ? 'mp4' : 'webm'
    const formData = new FormData()
    formData.append('scriptId', video.id)
    formData.append('takeId', take.id)
    formData.append('startedAt', take.startedAt)
    formData.append('stoppedAt', take.stoppedAt)
    formData.append('durationMs', String(take.durationMs))
    formData.append('trimStartMs', String(Math.round(trimStartSeconds * 1000)))
    formData.append('trimEndMs', String(Math.round(trimEndSeconds * 1000)))
    formData.append(
      'video',
      new File([take.blob], `${take.id}.${extension}`, { type: take.blob.type }),
    )

    const response = await fetch(`${apiBaseUrl}/content/videos/${video.id}/recordings`, {
      method: 'POST',
      credentials: 'include',
      headers: { Accept: 'application/json' },
      body: formData,
    })

    if (!response.ok) {
      setUploadError('Upload failed. Keep this tab open and try again.')
      setPhase('review')
      return
    }

    await queryClient.invalidateQueries({
      queryKey: query.workspace.show.queryOptions({}).queryKey,
    })
    setPhase('done')
  }

  function currentRecordingMs() {
    if (!startMsRef.current) return 0
    const pausedNow = pausedAtRef.current ? Date.now() - pausedAtRef.current : 0
    return Math.max(0, Date.now() - startMsRef.current - pausedMsRef.current - pausedNow)
  }

  return (
    <main className="min-h-[calc(100svh-4rem)] bg-[#f6f7f5] text-[#171812]">
      <div className="mx-auto grid min-h-[calc(100svh-4rem)] w-full max-w-7xl gap-4 px-3 py-3 sm:px-6 lg:grid-cols-[270px_minmax(0,1fr)_300px] lg:px-8">
        <TeleprompterControls
          countdownSeconds={countdownSeconds}
          fontSize={fontSize}
          scrollSpeed={scrollSpeed}
          mirrorMode={mirrorMode}
          lineHighlight={lineHighlight}
          currentLine={currentLine}
          lineCount={promptLines.length}
          disabled={phase === 'uploading'}
          onCountdownChange={setCountdownSeconds}
          onFontSizeChange={setFontSize}
          onScrollSpeedChange={setScrollSpeed}
          onMirrorModeChange={setMirrorMode}
          onLineHighlightChange={setLineHighlight}
          onManualLineChange={value => {
            setManualOverride(true)
            setManualLine(value)
          }}
          onAutoScroll={() => setManualOverride(false)}
          videoId={video.id}
        />

        <section className="flex min-h-[calc(100svh-5.5rem)] flex-col justify-center gap-3 lg:min-h-[calc(100vh-7rem)]">
          <div
            className={cn(
              'relative mx-auto aspect-[9/16] h-[calc(100svh-11rem)] max-h-[760px] min-h-[420px] w-full max-w-[430px] overflow-hidden rounded-lg bg-black shadow-sm lg:h-[calc(100vh-12rem)]',
              (phase === 'recording' || phase === 'paused') && 'cursor-pointer',
            )}
            onClick={toggleRecording}
          >
            {take &&
            phase !== 'idle' &&
            phase !== 'countdown' &&
            phase !== 'recording' &&
            phase !== 'paused' ? (
              <video
                key={take.id}
                className="size-full object-cover"
                src={take.url}
                controls
                playsInline
                preload="auto"
              />
            ) : (
              <video
                ref={previewRef}
                className={cn('size-full object-cover', mirrorMode && 'scale-x-[-1]')}
                muted
                playsInline
                autoPlay
              />
            )}

            {phase === 'countdown' && (
              <div className="absolute inset-0 grid place-items-center bg-black/40 text-7xl font-semibold text-white">
                {countdownLeft}
              </div>
            )}

            {(phase === 'idle' || phase === 'recording' || phase === 'paused') && (
              <TeleprompterOverlay
                lines={promptLines}
                currentLine={currentLine}
                fontSize={fontSize}
                lineHighlight={lineHighlight}
                position={promptPosition}
                onPositionChange={setPromptPosition}
              />
            )}

            {permissionError && (
              <div className="absolute inset-x-4 top-4 rounded-lg bg-white p-4 text-sm shadow">
                <p>{permissionError}</p>
                <Button type="button" className="mt-3" onClick={() => void requestCamera()}>
                  <RefreshCcw />
                  Retry
                </Button>
              </div>
            )}

            {phase === 'done' && (
              <div className="absolute inset-x-4 bottom-4 rounded-lg bg-white p-4 text-sm shadow">
                <p className="font-medium">Take uploaded. Auto-edit queued.</p>
                <p className="mt-1 text-muted-foreground">
                  Captions, silence removal, cuts, and export will run server-side.
                </p>
              </div>
            )}
          </div>

          <RecorderControls
            phase={phase}
            disabled={!cameraReady || Boolean(permissionError)}
            uploadDisabled={!canUpload}
            recordedMs={recordedMs}
            onStart={startCountdown}
            onPause={pauseRecording}
            onResume={resumeRecording}
            onStop={stopRecording}
            onRetake={retake}
            onUpload={() => void uploadTake()}
          />
        </section>

        <ReviewPanel
          video={video}
          take={take}
          phase={phase}
          uploadError={uploadError}
          trimStartSeconds={trimStartSeconds}
          trimEndSeconds={trimEndSeconds}
          durationSeconds={durationSeconds}
          onTrimStartChange={setTrimStartSeconds}
          onTrimEndChange={setTrimEndSeconds}
        />
      </div>
    </main>
  )
}

function TeleprompterControls({
  countdownSeconds,
  fontSize,
  scrollSpeed,
  mirrorMode,
  lineHighlight,
  currentLine,
  lineCount,
  disabled,
  onCountdownChange,
  onFontSizeChange,
  onScrollSpeedChange,
  onMirrorModeChange,
  onLineHighlightChange,
  onManualLineChange,
  onAutoScroll,
  videoId,
}: {
  countdownSeconds: number
  fontSize: number
  scrollSpeed: number
  mirrorMode: boolean
  lineHighlight: boolean
  currentLine: number
  lineCount: number
  disabled: boolean
  onCountdownChange: (value: number) => void
  onFontSizeChange: (value: number) => void
  onScrollSpeedChange: (value: number) => void
  onMirrorModeChange: (value: boolean) => void
  onLineHighlightChange: (value: boolean) => void
  onManualLineChange: (value: number) => void
  onAutoScroll: () => void
  videoId: string
}) {
  return (
    <aside className="order-3 rounded-lg border bg-card p-4 lg:order-none">
      <Link
        to="/videos/$videoId/script"
        params={{ videoId }}
        className="mb-5 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Script
      </Link>

      <div className="space-y-5">
        <RangeControl
          label="Font size"
          value={fontSize}
          min={24}
          max={54}
          step={1}
          suffix="px"
          onChange={onFontSizeChange}
        />
        <RangeControl
          label="Scroll speed"
          value={scrollSpeed}
          min={0.5}
          max={2}
          step={0.1}
          suffix="x"
          onChange={onScrollSpeedChange}
        />
        <RangeControl
          label="Countdown"
          value={countdownSeconds}
          min={0}
          max={10}
          step={1}
          suffix="s"
          disabled={disabled}
          onChange={onCountdownChange}
        />
        <RangeControl
          label="Manual scroll"
          value={currentLine}
          min={0}
          max={lineCount - 1}
          step={1}
          disabled={disabled}
          onChange={onManualLineChange}
        />
        <Button type="button" variant="outline" className="w-full" onClick={onAutoScroll}>
          <RotateCcw />
          Auto scroll
        </Button>
        <ToggleControl label="Mirror mode" checked={mirrorMode} onChange={onMirrorModeChange} />
        <ToggleControl
          label="Line highlight"
          checked={lineHighlight}
          onChange={onLineHighlightChange}
        />
      </div>
    </aside>
  )
}

function TeleprompterOverlay({
  lines,
  currentLine,
  fontSize,
  lineHighlight,
  position,
  onPositionChange,
}: {
  lines: string[]
  currentLine: number
  fontSize: number
  lineHighlight: boolean
  position: { x: number; y: number }
  onPositionChange: (position: { x: number; y: number }) => void
}) {
  const lineHeight = Math.round(fontSize * 1.35)
  const firstVisibleLine = Math.max(0, currentLine - 1)
  const visibleLines = lines.slice(firstVisibleLine, firstVisibleLine + 3)
  const [dragging, setDragging] = useState(false)

  function movePrompt(event: React.PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.parentElement?.getBoundingClientRect()
    if (!bounds) return

    onPositionChange({
      x: Math.min(92, Math.max(8, ((event.clientX - bounds.left) / bounds.width) * 100)),
      y: Math.min(85, Math.max(8, ((event.clientY - bounds.top) / bounds.height) * 100)),
    })
  }

  return (
    <div className="pointer-events-none absolute inset-0 text-center text-white [text-shadow:0_2px_14px_rgb(0_0_0/0.75)]">
      <div
        className={cn(
          'pointer-events-auto absolute w-[88%] -translate-x-1/2 -translate-y-1/2 cursor-grab select-none rounded-lg bg-black/35 px-3 py-2 shadow-lg backdrop-blur-[2px] transition-opacity duration-300 active:cursor-grabbing',
          dragging && 'ring-2 ring-white/60',
        )}
        style={{ left: `${position.x}%`, top: `${position.y}%` }}
        onClick={event => event.stopPropagation()}
        onPointerDown={event => {
          event.stopPropagation()
          event.currentTarget.setPointerCapture(event.pointerId)
          setDragging(true)
          movePrompt(event)
        }}
        onPointerMove={event => {
          event.stopPropagation()
          if (dragging) movePrompt(event)
        }}
        onPointerUp={event => {
          event.stopPropagation()
          setDragging(false)
          event.currentTarget.releasePointerCapture(event.pointerId)
        }}
      >
        {visibleLines.map((line, index) => {
          const lineIndex = firstVisibleLine + index

          return (
            <p
              key={`${line}-${lineIndex}`}
              className={cn(
                'mx-auto max-w-[92%] font-semibold',
                lineHighlight && lineIndex !== currentLine && 'opacity-45',
                lineHighlight && lineIndex === currentLine && 'rounded-md bg-black/40 px-2',
              )}
              style={{ fontSize, lineHeight: `${lineHeight}px` }}
            >
              {line}
            </p>
          )
        })}
      </div>
    </div>
  )
}

function RecorderControls({
  phase,
  disabled,
  uploadDisabled,
  recordedMs,
  onStart,
  onPause,
  onResume,
  onStop,
  onRetake,
  onUpload,
}: {
  phase: RecorderPhase
  disabled: boolean
  uploadDisabled: boolean
  recordedMs: number
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onRetake: () => void
  onUpload: () => void
}) {
  return (
    <div className="mx-auto flex w-full max-w-3xl items-center justify-center gap-2 rounded-lg border bg-card p-3">
      {(phase === 'idle' || phase === 'done') && (
        <Button type="button" size="lg" disabled={disabled} onClick={onStart}>
          <Play />
          Start
        </Button>
      )}
      {phase === 'recording' && (
        <>
          <Button type="button" variant="outline" size="lg" onClick={onPause}>
            <Pause />
            Pause
          </Button>
          <Button type="button" variant="destructive" size="lg" onClick={onStop}>
            <Square />
            Stop
          </Button>
        </>
      )}
      {phase === 'paused' && (
        <>
          <Button type="button" size="lg" onClick={onResume}>
            <Play />
            Resume
          </Button>
          <Button type="button" variant="destructive" size="lg" onClick={onStop}>
            <Square />
            Stop
          </Button>
        </>
      )}
      {phase === 'review' && (
        <>
          <Button type="button" variant="outline" size="lg" onClick={onRetake}>
            <RefreshCcw />
            Retake
          </Button>
          <Button type="button" size="lg" disabled={uploadDisabled} onClick={onUpload}>
            <Upload />
            Approve
          </Button>
        </>
      )}
      {phase === 'uploading' && (
        <Button type="button" size="lg" disabled>
          <Upload />
          Uploading
        </Button>
      )}
      {(phase === 'recording' || phase === 'paused') && (
        <span className="ml-2 min-w-14 font-mono text-sm">{formatElapsed(recordedMs)}</span>
      )}
    </div>
  )
}

function ReviewPanel({
  video,
  take,
  phase,
  uploadError,
  trimStartSeconds,
  trimEndSeconds,
  durationSeconds,
  onTrimStartChange,
  onTrimEndChange,
}: {
  video: Video
  take: RecordedTake | null
  phase: RecorderPhase
  uploadError: string
  trimStartSeconds: number
  trimEndSeconds: number
  durationSeconds: number
  onTrimStartChange: (value: number) => void
  onTrimEndChange: (value: number) => void
}) {
  return (
    <aside className="order-4 rounded-lg border bg-card p-4 lg:order-none lg:self-start">
      <p className="text-sm font-medium text-muted-foreground">Recording</p>
      <h1 className="mt-1 text-xl font-semibold tracking-tight">{video.title}</h1>

      <div className="mt-5 space-y-3 text-sm">
        <p className="font-medium">Flow</p>
        {['Script', 'Countdown', 'Record with prompter', 'Review', 'Approve', 'Upload'].map(
          (step, index) => (
            <div key={step} className="flex items-center gap-2">
              <span
                className={cn(
                  'flex size-5 items-center justify-center rounded border text-xs',
                  stepDone(index, phase) && 'border-emerald-600 bg-emerald-600 text-white',
                )}
              >
                {stepDone(index, phase) && <Check className="size-3" />}
              </span>
              {step}
            </div>
          ),
        )}
      </div>

      {take && (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Take ID: <span className="font-mono text-foreground">{take.id.slice(0, 8)}</span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="trim-start">Trim start</Label>
              <Input
                id="trim-start"
                type="number"
                min={0}
                max={durationSeconds}
                step={0.1}
                value={trimStartSeconds}
                onChange={event => onTrimStartChange(Number(event.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trim-end">Trim end</Label>
              <Input
                id="trim-end"
                type="number"
                min={0}
                max={durationSeconds}
                step={0.1}
                value={trimEndSeconds}
                onChange={event => onTrimEndChange(Number(event.target.value))}
              />
            </div>
          </div>
        </div>
      )}

      {uploadError && <p className="mt-4 text-sm text-destructive">{uploadError}</p>}
    </aside>
  )
}

function RangeControl({
  label,
  value,
  min,
  max,
  step,
  suffix,
  disabled,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  suffix?: string
  disabled?: boolean
  onChange: (value: number) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label>{label}</Label>
        <span className="font-mono text-xs text-muted-foreground">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={event => onChange(Number(event.target.value))}
        className="w-full accent-foreground"
      />
    </div>
  )
}

function ToggleControl({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm font-medium">
      {label}
      <input
        type="checkbox"
        checked={checked}
        onChange={event => onChange(event.target.checked)}
        className="size-4 accent-foreground"
      />
    </label>
  )
}

function buildPromptLines(spokenScript: string) {
  const words = spokenScript.split(/\s+/).filter(Boolean)
  const lines: string[] = []

  for (let index = 0; index < words.length; index += 5) {
    lines.push(words.slice(index, index + 5).join(' '))
  }

  return lines.length ? lines : ['']
}

function recorderMimeType() {
  return (
    ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'].find(
      type => MediaRecorder.isTypeSupported(type),
    ) ?? ''
  )
}

function formatElapsed(ms: number) {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function stepDone(index: number, phase: RecorderPhase) {
  if (index === 0) return true
  if (index === 1) return phase !== 'idle'
  if (index === 2) return ['review', 'uploading', 'done'].includes(phase)
  if (index === 3) return ['review', 'uploading', 'done'].includes(phase)
  if (index === 4) return ['uploading', 'done'].includes(phase)
  return phase === 'done'
}
