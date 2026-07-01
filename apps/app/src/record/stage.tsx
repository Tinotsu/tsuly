import { Check, Pause, Play, RefreshCcw, RotateCcw, Square } from 'lucide-react'
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type { RecordedTake, RecorderPhase } from './types'

export function RecordingStage({
  variant,
  phase,
  disabled,
  recordedMs,
  countdownLeft,
  lines,
  currentLine,
  fontSize,
  lineHighlight,
  mirrorMode,
  showPrompter,
  promptPosition,
  onPromptMove,
  screenMode = false,
  screenReady = false,
  previewVideoRef,
  canvasRef,
  screenPreviewRef,
  cameraOverlayPosition = { x: 50, y: 78 },
  cameraOverlaySize = 26,
  cameraOverlayWidth = 26,
  onCameraMove,
  onCameraResize,
  onCameraMoveFromBounds,
  onCameraResizeFromBounds,
  onToggleRecording,
  take = null,
  permissionError = '',
  onRetryCamera,
  cameraStream = null,
  recordedStream = null,
  onStart,
  onPause,
  onResume,
  onStop,
  onRetake,
  onUpload,
  uploadDisabled = false,
}: {
  variant: 'embedded' | 'fullscreen'
  phase: RecorderPhase
  disabled: boolean
  recordedMs: number
  countdownLeft: number
  lines: string[]
  currentLine: number
  fontSize: number
  lineHighlight: boolean
  mirrorMode: boolean
  showPrompter: boolean
  promptPosition: { x: number; y: number }
  onPromptMove: (position: { x: number; y: number }) => void
  screenMode?: boolean
  screenReady?: boolean
  previewVideoRef?: RefObject<HTMLVideoElement | null>
  canvasRef?: RefObject<HTMLCanvasElement | null>
  screenPreviewRef?: RefObject<HTMLVideoElement | null>
  cameraOverlayPosition?: { x: number; y: number }
  cameraOverlaySize?: number
  cameraOverlayWidth?: number
  onCameraMove?: (event: PointerEvent) => void
  onCameraResize?: (event: PointerEvent) => void
  onCameraMoveFromBounds?: (event: PointerEvent, bounds: DOMRect) => void
  onCameraResizeFromBounds?: (event: PointerEvent, bounds: DOMRect) => void
  onToggleRecording?: () => void
  take?: RecordedTake | null
  permissionError?: string
  onRetryCamera?: () => void
  cameraStream?: MediaStream | null
  recordedStream?: MediaStream | null
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onRetake?: () => void
  onUpload?: () => void
  uploadDisabled?: boolean
}) {
  const isFullscreen = variant === 'fullscreen'
  const stageRef = useRef<HTMLDivElement | null>(null)
  const streamVideoRef = useRef<HTMLVideoElement | null>(null)
  const editSurfaceRef = useRef<HTMLDivElement | null>(null)
  const [viewMode, setViewMode] = useState<'camera' | 'recorded'>('camera')
  const promptFontSize = Math.max(22, Math.round(fontSize * 0.82))
  const lineHeight = Math.round(fontSize * 1.2)
  const firstVisibleLine = Math.max(0, currentLine - 1)
  const visibleLines = lines.slice(firstVisibleLine, firstVisibleLine + 3)
  const showingTakePlayback = Boolean(
    take &&
    phase !== 'idle' &&
    phase !== 'countdown' &&
    phase !== 'recording' &&
    phase !== 'paused',
  )
  const stream = viewMode === 'recorded' && recordedStream ? recordedStream : cameraStream
  const showingRecorded = isFullscreen && viewMode === 'recorded' && Boolean(recordedStream)
  const canEditRecorded = showingRecorded
  const showViewModeToggle = isFullscreen && Boolean(recordedStream)
  const showPrompterOverlay =
    showPrompter && (phase === 'idle' || phase === 'recording' || phase === 'paused')
  const portraitFrameStyle = isFullscreen
    ? {
        height: 'min(100vh, calc(100vw * 16 / 9))',
        width: 'min(100vw, calc(100vh * 9 / 16))',
      }
    : { height: '100%', width: '100%' }

  function movePrompt(event: PointerEvent<HTMLDivElement>) {
    const stage = stageRef.current?.getBoundingClientRect()
    if (!stage) return

    onPromptMove({
      x: Math.min(92, Math.max(8, ((event.clientX - stage.left) / stage.width) * 100)),
      y: Math.min(85, Math.max(8, ((event.clientY - stage.top) / stage.height) * 100)),
    })
  }

  useEffect(() => {
    if (!isFullscreen) return

    const video = streamVideoRef.current
    if (!video) return

    video.srcObject = stream
    void video.play()

    return () => {
      video.srcObject = null
    }
  }, [isFullscreen, stream])

  useEffect(() => {
    if (viewMode === 'recorded' && !recordedStream) setViewMode('camera')
  }, [recordedStream, viewMode])

  return (
    <div
      ref={stageRef}
      onClick={
        !isFullscreen && onToggleRecording && (phase === 'recording' || phase === 'paused')
          ? onToggleRecording
          : undefined
      }
      style={
        isFullscreen
          ? {
              background: '#111',
              boxSizing: 'border-box',
              color: '#fff',
              fontFamily: 'system-ui, sans-serif',
              height: '100vh',
              overflow: 'hidden',
              position: 'relative',
              textAlign: 'center',
              textShadow: '0 2px 14px rgb(0 0 0 / 0.75)',
              width: '100vw',
            }
          : {
              aspectRatio: '9 / 16',
              background: '#111',
              boxSizing: 'border-box',
              color: '#fff',
              fontFamily: 'system-ui, sans-serif',
              height: '100%',
              maxHeight: '100%',
              maxWidth: 'min(430px, 100%)',
              overflow: 'hidden',
              position: 'relative',
              textAlign: 'center',
              textShadow: '0 2px 14px rgb(0 0 0 / 0.75)',
              width: 'auto',
            }
      }
      className={cn(
        !isFullscreen && (phase === 'recording' || phase === 'paused') && 'cursor-pointer',
      )}
    >
      {showingTakePlayback && take ? (
        <video
          key={take.id}
          className="size-full object-cover"
          src={take.url}
          controls
          playsInline
          preload="auto"
        />
      ) : isFullscreen ? (
        <video
          ref={streamVideoRef}
          muted
          playsInline
          autoPlay
          style={
            showingRecorded
              ? {
                  height: portraitFrameStyle.height,
                  left: '50%',
                  objectFit: 'contain',
                  position: 'absolute',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: portraitFrameStyle.width,
                }
              : {
                  height: '100%',
                  objectFit: 'cover',
                  transform: mirrorMode ? 'scaleX(-1)' : undefined,
                  width: '100%',
                }
          }
        />
      ) : screenMode && screenReady && canvasRef ? (
        <>
          <canvas
            ref={canvasRef}
            className="size-full cursor-grab active:cursor-grabbing"
            onPointerDown={event => {
              event.stopPropagation()
              event.currentTarget.setPointerCapture(event.pointerId)
              onCameraMove?.(event)
            }}
            onPointerMove={event => {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) onCameraMove?.(event)
            }}
            onPointerUp={event => event.currentTarget.releasePointerCapture(event.pointerId)}
          />
          <div
            className="absolute size-5 cursor-nwse-resize rounded-full border-2 border-white bg-black/45 shadow"
            style={{
              left: `${cameraOverlayPosition.x + cameraOverlayWidth / 2}%`,
              top: `${cameraOverlayPosition.y + cameraOverlaySize / 2}%`,
              transform: 'translate(-50%, -50%)',
            }}
            onClick={event => event.stopPropagation()}
            onPointerDown={event => {
              event.stopPropagation()
              event.currentTarget.setPointerCapture(event.pointerId)
              onCameraResize?.(event)
            }}
            onPointerMove={event => {
              event.stopPropagation()
              if (event.currentTarget.hasPointerCapture(event.pointerId)) onCameraResize?.(event)
            }}
            onPointerUp={event => {
              event.stopPropagation()
              event.currentTarget.releasePointerCapture(event.pointerId)
            }}
          />
        </>
      ) : (
        <video
          ref={previewVideoRef}
          className="size-full object-cover"
          style={{ transform: mirrorMode ? 'scaleX(-1)' : undefined }}
          muted
          playsInline
          autoPlay
        />
      )}

      {!isFullscreen && screenMode && screenReady && previewVideoRef && (
        <video ref={previewVideoRef} className="hidden" muted playsInline autoPlay />
      )}
      {!isFullscreen && screenPreviewRef && (
        <video ref={screenPreviewRef} className="hidden" muted playsInline autoPlay />
      )}

      {canEditRecorded && onCameraMoveFromBounds && (
        <div
          ref={editSurfaceRef}
          style={{
            cursor: 'grab',
            height: portraitFrameStyle.height,
            left: '50%',
            position: 'absolute',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: portraitFrameStyle.width,
            zIndex: 2,
          }}
          onPointerDown={event => {
            const bounds = event.currentTarget.getBoundingClientRect()
            event.currentTarget.setPointerCapture(event.pointerId)
            onCameraMoveFromBounds(event, bounds)
          }}
          onPointerMove={event => {
            if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
            onCameraMoveFromBounds(event, event.currentTarget.getBoundingClientRect())
          }}
          onPointerUp={event => event.currentTarget.releasePointerCapture(event.pointerId)}
        >
          <div
            style={{
              background: 'rgb(0 0 0 / 0.45)',
              border: '2px solid #fff',
              borderRadius: 999,
              cursor: 'nwse-resize',
              height: 20,
              left: `${cameraOverlayPosition.x + cameraOverlayWidth / 2}%`,
              position: 'absolute',
              top: `${cameraOverlayPosition.y + cameraOverlaySize / 2}%`,
              transform: 'translate(-50%, -50%)',
              width: 20,
              zIndex: 4,
            }}
            onPointerDown={event => {
              event.stopPropagation()
              event.currentTarget.setPointerCapture(event.pointerId)
              const bounds = editSurfaceRef.current?.getBoundingClientRect()
              if (bounds && onCameraResizeFromBounds) onCameraResizeFromBounds(event, bounds)
            }}
            onPointerMove={event => {
              event.stopPropagation()
              if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
              const bounds = editSurfaceRef.current?.getBoundingClientRect()
              if (bounds && onCameraResizeFromBounds) onCameraResizeFromBounds(event, bounds)
            }}
            onPointerUp={event => {
              event.stopPropagation()
              event.currentTarget.releasePointerCapture(event.pointerId)
            }}
          />
        </div>
      )}

      {showPrompterOverlay && (
        <div
          style={{
            cursor: 'grab',
            left: `${promptPosition.x}%`,
            padding: '18px 14px',
            position: 'absolute',
            top: `${promptPosition.y}%`,
            transform: 'translate(-50%, -50%)',
            width: isFullscreen ? 'min(92vw, 760px)' : 'min(92%, 760px)',
            zIndex: 6,
          }}
          onClick={event => event.stopPropagation()}
          onPointerDown={event => {
            event.stopPropagation()
            event.currentTarget.setPointerCapture(event.pointerId)
            movePrompt(event)
          }}
          onPointerMove={event => {
            if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
            event.stopPropagation()
            movePrompt(event)
          }}
          onPointerUp={event => {
            event.stopPropagation()
            event.currentTarget.releasePointerCapture(event.pointerId)
          }}
        >
          {visibleLines.map((line, index) => {
            const lineIndex = firstVisibleLine + index

            return (
              <p
                key={`${line}-${lineIndex}`}
                style={{
                  background:
                    lineHighlight && lineIndex === currentLine
                      ? 'rgb(0 0 0 / 0.45)'
                      : 'transparent',
                  borderRadius: 8,
                  fontSize: promptFontSize,
                  fontWeight: 700,
                  lineHeight: `${lineHeight}px`,
                  margin: '0 auto',
                  maxWidth: '94%',
                  opacity: lineHighlight && lineIndex !== currentLine ? 0.5 : 1,
                  padding: '0 8px',
                }}
              >
                {line}
              </p>
            )
          })}
        </div>
      )}

      {phase === 'countdown' && (
        <div
          style={{
            alignItems: 'center',
            background: 'rgb(0 0 0 / 0.35)',
            bottom: 0,
            display: 'flex',
            fontSize: 96,
            fontWeight: 800,
            justifyContent: 'center',
            left: 0,
            position: 'absolute',
            right: 0,
            top: 0,
            zIndex: 9,
          }}
        >
          {countdownLeft}
        </div>
      )}

      {!isFullscreen && permissionError && (
        <div className="absolute inset-x-4 top-4 z-20 rounded-lg bg-white p-4 text-left text-sm text-[#111] shadow">
          <p>{permissionError}</p>
          {onRetryCamera && (
            <Button type="button" className="mt-3" onClick={onRetryCamera}>
              <RefreshCcw />
              Retry
            </Button>
          )}
        </div>
      )}

      {!isFullscreen && phase === 'done' && (
        <div className="absolute inset-x-4 bottom-20 z-20 rounded-lg bg-white p-4 text-left text-sm text-[#111] shadow">
          <p className="font-medium">Take uploaded. Edit settings ready.</p>
          <p className="mt-1 text-muted-foreground">
            Choose caption and trim settings before starting the server-side edit.
          </p>
        </div>
      )}

      {showViewModeToggle && (
        <div
          style={{
            alignItems: 'center',
            background: 'rgb(10 10 10 / 0.72)',
            border: '1px solid rgb(255 255 255 / 0.16)',
            borderRadius: 10,
            bottom: 16,
            boxShadow: '0 12px 34px rgb(0 0 0 / 0.24)',
            display: 'flex',
            gap: 4,
            left: '50%',
            padding: 4,
            position: 'absolute',
            transform: 'translateX(-50%)',
            zIndex: 10,
          }}
        >
          <StageControlButton
            active={viewMode === 'camera'}
            compact
            onClick={() => setViewMode('camera')}
          >
            Camera
          </StageControlButton>
          <StageControlButton
            active={viewMode === 'recorded'}
            compact
            onClick={() => setViewMode('recorded')}
          >
            Recorded
          </StageControlButton>
        </div>
      )}

      <div
        style={{
          alignItems: 'center',
          backdropFilter: 'blur(14px)',
          background: 'rgb(10 10 10 / 0.72)',
          border: '1px solid rgb(255 255 255 / 0.16)',
          borderRadius: 10,
          bottom: showingTakePlayback ? undefined : showViewModeToggle ? 68 : 16,
          boxShadow: '0 16px 40px rgb(0 0 0 / 0.3)',
          display: 'flex',
          gap: 8,
          left: '50%',
          padding: 8,
          position: 'absolute',
          top: showingTakePlayback ? 16 : undefined,
          transform: 'translateX(-50%)',
          zIndex: 10,
        }}
      >
        {(phase === 'idle' || phase === 'done') && (
          <StageControlButton disabled={disabled} tone="primary" onClick={onStart}>
            <Play size={16} />
            Start
          </StageControlButton>
        )}
        {phase === 'recording' && (
          <>
            <StageControlButton onClick={onPause}>
              <Pause size={16} />
              Pause
            </StageControlButton>
            <StageControlButton tone="danger" onClick={onStop}>
              <Square size={16} />
              Stop
            </StageControlButton>
          </>
        )}
        {phase === 'paused' && (
          <>
            <StageControlButton tone="primary" onClick={onResume}>
              <Play size={16} />
              Resume
            </StageControlButton>
            <StageControlButton tone="danger" onClick={onStop}>
              <Square size={16} />
              Stop
            </StageControlButton>
          </>
        )}
        {phase === 'review' && onRetake && onUpload && (
          <>
            <StageControlButton onClick={onRetake}>
              <RotateCcw size={16} />
              Retake
            </StageControlButton>
            <StageControlButton disabled={uploadDisabled} tone="primary" onClick={onUpload}>
              <Check size={16} />
              Approve
            </StageControlButton>
          </>
        )}
        {phase === 'uploading' && (
          <StageControlButton disabled tone="primary" onClick={() => undefined}>
            Uploading
          </StageControlButton>
        )}
        {(phase === 'recording' || phase === 'paused') && (
          <span
            style={{
              alignItems: 'center',
              color: '#fff',
              display: 'flex',
              font: '700 14px ui-monospace, SFMono-Regular, Menlo, monospace',
              gap: 7,
              minWidth: 54,
              padding: '0 5px',
            }}
          >
            <span
              style={{
                background: phase === 'recording' ? '#ef4444' : 'rgb(255 255 255 / 0.45)',
                borderRadius: 999,
                display: 'block',
                height: 8,
                width: 8,
              }}
            />
            {formatElapsed(recordedMs)}
          </span>
        )}
      </div>
    </div>
  )
}

function StageControlButton({
  children,
  active,
  compact,
  disabled,
  tone = 'secondary',
  onClick,
}: {
  children: ReactNode
  active?: boolean
  compact?: boolean
  disabled?: boolean
  tone?: 'primary' | 'secondary' | 'danger'
  onClick: () => void
}) {
  const selected = active ?? tone === 'primary'

  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      style={{
        alignItems: 'center',
        background: tone === 'danger' ? '#ef4444' : selected ? '#fff' : 'rgb(255 255 255 / 0.08)',
        border: '1px solid rgb(255 255 255 / 0.12)',
        borderRadius: 8,
        color: tone === 'danger' || !selected ? '#fff' : '#111',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        font: '700 14px system-ui, sans-serif',
        gap: 7,
        justifyContent: 'center',
        minHeight: compact ? 32 : 40,
        minWidth: compact ? 82 : 0,
        opacity: disabled ? 0.5 : 1,
        padding: compact ? '7px 11px' : '10px 14px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  )
}

function formatElapsed(ms: number) {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
