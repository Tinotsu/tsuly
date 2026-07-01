import { FilesetResolver, ImageSegmenter, type ImageSegmenterResult } from '@mediapipe/tasks-vision'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { buttonVariants } from '@/components/ui/button'
import { queryClient } from '@/lib/query_client'
import { query } from '@/lib/tuyau'
import { cn } from '@/lib/utils'

import type { Video } from '@/workspace/types'

import { drawCameraCutoutLayer, drawCameraLayer } from './canvas'
import { TeleprompterControls } from './controls'
import { DetachedPrompterWindow } from './detached-prompter-window'
import { ReviewPanel } from './review-panel'
import { RecordingStage } from './stage'
import type {
  DetachedPrompterMode,
  DocumentPictureInPictureApi,
  RecordedTake,
  RecorderPhase,
  RecorderSettings,
} from './types'

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3333'
const recorderSettingsStorageKey = 'tsuly:recorder-settings'
const mediaPipeWasmUrl = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'
const selfieSegmenterModelUrl =
  'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite'

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
  const navigate = useNavigate()
  const previewRef = useRef<HTMLVideoElement | null>(null)
  const screenPreviewRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const cameraLayerCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const personMaskCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const segmenterRef = useRef<ImageSegmenter | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const takeUrlRef = useRef('')
  const startedAtRef = useRef('')
  const startMsRef = useRef(0)
  const pausedAtRef = useRef(0)
  const pausedMsRef = useRef(0)
  const lastSegmentationMsRef = useRef(0)
  const personMaskIndexRef = useRef(1)

  const promptLines = useMemo(
    () => buildPromptLines(video.script.spokenScript),
    [video.script.spokenScript],
  )
  const savedRecorderSettings = useMemo<Partial<RecorderSettings>>(() => {
    try {
      return JSON.parse(window.localStorage.getItem(recorderSettingsStorageKey) ?? '{}')
    } catch {
      return {}
    }
  }, [])
  const [phase, setPhase] = useState<RecorderPhase>('idle')
  const [permissionError, setPermissionError] = useState('')
  const [cameraReady, setCameraReady] = useState(false)
  const [screenMode, setScreenMode] = useState(false)
  const [screenReady, setScreenReady] = useState(false)
  const [screenError, setScreenError] = useState('')
  const [recordedPreviewStream, setRecordedPreviewStream] = useState<MediaStream | null>(null)
  const [cameraCutoutMode, setCameraCutoutMode] = useState(
    savedRecorderSettings.cameraCutoutMode ?? true,
  )
  const [segmentationReady, setSegmentationReady] = useState(false)
  const [segmentationError, setSegmentationError] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [take, setTake] = useState<RecordedTake | null>(null)
  const [countdownSeconds, setCountdownSeconds] = useState(
    savedRecorderSettings.countdownSeconds ?? 3,
  )
  const [countdownLeft, setCountdownLeft] = useState(0)
  const [recordedMs, setRecordedMs] = useState(0)
  const [fontSize, setFontSize] = useState(savedRecorderSettings.fontSize ?? 34)
  const [scrollSpeed, setScrollSpeed] = useState(savedRecorderSettings.scrollSpeed ?? 1)
  const [mirrorMode, setMirrorMode] = useState(savedRecorderSettings.mirrorMode ?? true)
  const [lineHighlight, setLineHighlight] = useState(savedRecorderSettings.lineHighlight ?? true)
  const [cameraOverlaySize, setCameraOverlaySize] = useState(
    Math.min(200, Math.max(20, savedRecorderSettings.cameraOverlaySize ?? 26)),
  )
  const [cameraOverlayPosition, setCameraOverlayPosition] = useState(
    savedRecorderSettings.cameraOverlayPosition ?? { x: 50, y: 78 },
  )
  const [screenZoom, setScreenZoom] = useState(savedRecorderSettings.screenZoom ?? 1)
  const [manualLine, setManualLine] = useState(
    Math.min(promptLines.length - 1, savedRecorderSettings.manualLine ?? 0),
  )
  const [manualOverride, setManualOverride] = useState(
    savedRecorderSettings.manualOverride ?? false,
  )
  const [promptPosition, setPromptPosition] = useState(
    savedRecorderSettings.promptPosition ?? { x: 50, y: 12 },
  )
  const [detachedPrompterWindow, setDetachedPrompterWindow] = useState<Window | null>(null)
  const [detachedPrompterMode, setDetachedPrompterMode] = useState<DetachedPrompterMode | null>(
    null,
  )
  const [detachPrompterError, setDetachPrompterError] = useState('')
  const [trimStartSeconds, setTrimStartSeconds] = useState(0)
  const [trimEndSeconds, setTrimEndSeconds] = useState(0)

  const autoLine = Math.min(
    promptLines.length - 1,
    Math.floor((recordedMs / 1000) * scrollSpeed * 0.45),
  )
  const currentLine = manualOverride ? manualLine : autoLine
  const durationSeconds = take ? Math.max(0.1, take.durationMs / 1000) : 1
  const cameraOverlayRatio =
    previewRef.current?.videoWidth && previewRef.current.videoHeight
      ? previewRef.current.videoWidth / previewRef.current.videoHeight
      : 9 / 16
  const cameraOverlayWidth = cameraOverlaySize * cameraOverlayRatio * (16 / 9)
  const canUpload =
    take &&
    trimStartSeconds >= 0 &&
    trimEndSeconds > trimStartSeconds &&
    trimEndSeconds <= durationSeconds
  const recordingDisabled =
    !cameraReady ||
    Boolean(permissionError) ||
    (screenMode && (!screenReady || Boolean(screenError)))

  useEffect(() => {
    void requestCamera()

    return () => {
      stopStream()
      stopScreenStream()
      segmenterRef.current?.close()
      if (takeUrlRef.current) URL.revokeObjectURL(takeUrlRef.current)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(
      recorderSettingsStorageKey,
      JSON.stringify({
        countdownSeconds,
        fontSize,
        scrollSpeed,
        mirrorMode,
        lineHighlight,
        cameraCutoutMode,
        cameraOverlaySize,
        cameraOverlayPosition,
        screenZoom,
        manualLine,
        manualOverride,
        promptPosition,
      }),
    )
  }, [
    countdownSeconds,
    fontSize,
    scrollSpeed,
    mirrorMode,
    lineHighlight,
    cameraCutoutMode,
    cameraOverlaySize,
    cameraOverlayPosition,
    screenZoom,
    manualLine,
    manualOverride,
    promptPosition,
  ])

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
  }, [phase, screenMode, screenReady])

  useEffect(() => {
    if (!screenMode || !screenReady || !canvasRef.current) {
      setRecordedPreviewStream(null)
      return
    }

    const stream = canvasRef.current.captureStream(30)
    setRecordedPreviewStream(stream)

    return () => {
      stream.getTracks().forEach(track => track.stop())
      setRecordedPreviewStream(null)
    }
  }, [screenMode, screenReady])

  useEffect(() => {
    if (!screenReady) return
    if (cameraCutoutMode) void ensureSegmenter()

    const canvas = canvasRef.current
    const screenVideo = screenPreviewRef.current
    const cameraVideo = previewRef.current
    if (!canvas || !screenVideo || !cameraVideo) return
    const context = canvas.getContext('2d')
    if (!context) return
    const drawingCanvas = canvas
    const drawingScreenVideo = screenVideo
    const drawingCameraVideo = cameraVideo
    const drawingContext = context

    drawingCanvas.width = 1080
    drawingCanvas.height = 1920

    let animationFrame = 0

    function drawFrame() {
      const screenWidth = drawingScreenVideo.videoWidth || drawingCanvas.width
      const screenHeight = drawingScreenVideo.videoHeight || drawingCanvas.height
      const screenScale =
        Math.max(drawingCanvas.width / screenWidth, drawingCanvas.height / screenHeight) *
        screenZoom
      const screenDrawWidth = screenWidth * screenScale
      const screenDrawHeight = screenHeight * screenScale
      const screenX = (drawingCanvas.width - screenDrawWidth) / 2
      const screenY = (drawingCanvas.height - screenDrawHeight) / 2

      drawingContext.fillStyle = '#000'
      drawingContext.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height)
      drawingContext.drawImage(
        drawingScreenVideo,
        screenX,
        screenY,
        screenDrawWidth,
        screenDrawHeight,
      )

      if (drawingCameraVideo.videoWidth && drawingCameraVideo.videoHeight) {
        if (
          cameraCutoutMode &&
          segmenterRef.current &&
          drawingCameraVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
        ) {
          updatePersonCutout(drawingCameraVideo)
        }
        const cameraHeight = Math.round((drawingCanvas.height * cameraOverlaySize) / 100)
        const cameraWidth = Math.round(
          cameraHeight * (drawingCameraVideo.videoWidth / drawingCameraVideo.videoHeight),
        )
        const cameraX = Math.round(
          (drawingCanvas.width * cameraOverlayPosition.x) / 100 - cameraWidth / 2,
        )
        const cameraY = Math.round(
          (drawingCanvas.height * cameraOverlayPosition.y) / 100 - cameraHeight / 2,
        )

        const personMaskCanvas = personMaskCanvasRef.current
        if (cameraCutoutMode && segmentationReady && personMaskCanvas) {
          const cameraLayerCanvas = cameraLayerCanvasRef.current ?? document.createElement('canvas')
          cameraLayerCanvasRef.current = cameraLayerCanvas
          drawCameraCutoutLayer(
            drawingContext,
            drawingCameraVideo,
            personMaskCanvas,
            cameraLayerCanvas,
            cameraX,
            cameraY,
            cameraWidth,
            cameraHeight,
            mirrorMode,
          )
        } else {
          drawingContext.save()
          drawingContext.beginPath()
          drawingContext.roundRect(cameraX, cameraY, cameraWidth, cameraHeight, 36)
          drawingContext.clip()
          drawCameraLayer(
            drawingContext,
            drawingCameraVideo,
            cameraX,
            cameraY,
            cameraWidth,
            cameraHeight,
            mirrorMode,
          )
          drawingContext.restore()
        }
      }

      animationFrame = window.requestAnimationFrame(drawFrame)
    }

    drawFrame()

    return () => window.cancelAnimationFrame(animationFrame)
  }, [
    cameraCutoutMode,
    cameraOverlayPosition,
    cameraOverlaySize,
    mirrorMode,
    screenReady,
    screenZoom,
    segmentationReady,
  ])

  useEffect(() => {
    if (!detachedPrompterWindow) return

    const handleClose = () => {
      setDetachedPrompterWindow(null)
      setDetachedPrompterMode(null)
    }
    detachedPrompterWindow.addEventListener('pagehide', handleClose)
    return () => detachedPrompterWindow.removeEventListener('pagehide', handleClose)
  }, [detachedPrompterWindow])

  useEffect(() => {
    if (!detachedPrompterWindow) return
    if (['idle', 'countdown', 'recording', 'paused'].includes(phase)) return

    detachedPrompterWindow.close()
    setDetachedPrompterWindow(null)
    setDetachedPrompterMode(null)
  }, [detachedPrompterWindow, phase])

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

  async function requestScreen() {
    setScreenError('')

    if (!navigator.mediaDevices?.getDisplayMedia) {
      setScreenError('This browser cannot record your screen.')
      return
    }

    try {
      stopScreenStream()
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
      screenStreamRef.current = stream
      if (screenPreviewRef.current) {
        screenPreviewRef.current.srcObject = stream
        await screenPreviewRef.current.play()
      }
      stream.getVideoTracks()[0]?.addEventListener('ended', () => {
        screenStreamRef.current = null
        setScreenReady(false)
        setScreenError('Screen sharing stopped.')
      })
      setScreenReady(true)
    } catch {
      setScreenReady(false)
      setScreenError('Screen selection was cancelled.')
    }
  }

  function stopScreenStream() {
    screenStreamRef.current?.getTracks().forEach(track => track.stop())
    screenStreamRef.current = null
    setScreenReady(false)
    if (screenPreviewRef.current) screenPreviewRef.current.srcObject = null
  }

  async function ensureSegmenter() {
    if (segmenterRef.current) {
      setSegmentationReady(true)
      return
    }

    try {
      setSegmentationError('')
      const vision = await FilesetResolver.forVisionTasks(mediaPipeWasmUrl)
      const segmenter = await ImageSegmenter.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: selfieSegmenterModelUrl,
          delegate: 'CPU',
        },
        outputConfidenceMasks: true,
        outputCategoryMask: false,
        runningMode: 'VIDEO',
      })
      const personIndex = segmenter
        .getLabels()
        .findIndex(label => label.toLowerCase().includes('person'))

      personMaskIndexRef.current = personIndex === -1 ? 1 : personIndex
      segmenterRef.current = segmenter
      setSegmentationReady(true)
    } catch {
      setSegmentationReady(false)
      setSegmentationError('Cutout could not load. Recording still works without it.')
    }
  }

  function updatePersonCutout(cameraVideo: HTMLVideoElement) {
    const segmenter = segmenterRef.current
    const now = performance.now()
    if (!segmenter || now - lastSegmentationMsRef.current < 100) return

    try {
      const result = segmenter.segmentForVideo(cameraVideo, now)
      drawPersonMask(result)
      result.confidenceMasks?.forEach(mask => mask.close())
      result.categoryMask?.close()
      lastSegmentationMsRef.current = now
    } catch {
      segmenter.close()
      segmenterRef.current = null
      setSegmentationReady(false)
      setSegmentationError('Cutout stopped. Recording still works without it.')
    }
  }

  function drawPersonMask(result: ImageSegmenterResult) {
    const masks = result.confidenceMasks
    const mask = masks?.[personMaskIndexRef.current] ?? masks?.[masks.length - 1]
    if (!mask) return

    const width = mask.width
    const height = mask.height
    const maskCanvas = personMaskCanvasRef.current ?? document.createElement('canvas')
    const maskContext = maskCanvas.getContext('2d')
    if (!maskContext) return

    personMaskCanvasRef.current = maskCanvas
    maskCanvas.width = width
    maskCanvas.height = height

    const maskData = mask.getAsFloat32Array()
    const imageData = maskContext.createImageData(width, height)
    for (let index = 0; index < maskData.length; index += 1) {
      imageData.data[index * 4 + 3] = Math.round(maskData[index] * 255)
    }

    maskContext.putImageData(imageData, 0, 0)
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
    const cameraStream = streamRef.current
    if (!cameraStream) {
      setPermissionError('Camera is not ready.')
      return
    }
    let recordingStream = cameraStream
    if (screenMode) {
      if (!screenStreamRef.current || !canvasRef.current) {
        setScreenError('Choose a screen or window first.')
        return
      }
      recordingStream = canvasRef.current.captureStream(30)
      cameraStream.getAudioTracks().forEach(track => recordingStream.addTrack(track))
      screenStreamRef.current.getAudioTracks().forEach(track => recordingStream.addTrack(track))
    }

    const mimeType = recorderMimeType()
    const recorder = new MediaRecorder(recordingStream, mimeType ? { mimeType } : undefined)
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

  async function toggleDetachedPrompter(mode: DetachedPrompterMode) {
    if (detachedPrompterWindow && detachedPrompterMode === mode) {
      closeDetachedPrompter()
      return
    }

    const pictureInPicture = (
      window as Window & { documentPictureInPicture?: DocumentPictureInPictureApi }
    ).documentPictureInPicture

    if (!pictureInPicture) {
      setDetachPrompterError('Detach prompter requires Chrome or Edge desktop.')
      return
    }

    try {
      detachedPrompterWindow?.close()
      const prompterWindow = await pictureInPicture.requestWindow(
        mode === 'video' ? { width: 420, height: 720 } : { width: 760, height: 260 },
      )
      prompterWindow.document.title = 'Tsuly prompter'
      prompterWindow.document.body.innerHTML = ''
      prompterWindow.document.body.style.margin = '0'
      setDetachPrompterError('')
      setDetachedPrompterMode(mode)
      setDetachedPrompterWindow(prompterWindow)
    } catch {
      setDetachPrompterError('Could not detach prompter. Click the button again.')
    }
  }

  function closeDetachedPrompter() {
    detachedPrompterWindow?.close()
    setDetachedPrompterWindow(null)
    setDetachedPrompterMode(null)
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
    await navigate({ to: '/videos/$videoId/edit', params: { videoId: video.id } })
  }

  function currentRecordingMs() {
    if (!startMsRef.current) return 0
    const pausedNow = pausedAtRef.current ? Date.now() - pausedAtRef.current : 0
    return Math.max(0, Date.now() - startMsRef.current - pausedMsRef.current - pausedNow)
  }

  function moveCameraOverlayFromBounds(event: React.PointerEvent, bounds: DOMRect) {
    setCameraOverlayPosition({
      x: Math.min(95, Math.max(5, ((event.clientX - bounds.left) / bounds.width) * 100)),
      y: Math.min(95, Math.max(5, ((event.clientY - bounds.top) / bounds.height) * 100)),
    })
  }

  function resizeCameraOverlayFromBounds(event: React.PointerEvent, bounds: DOMRect) {
    const centerY = bounds.top + (bounds.height * cameraOverlayPosition.y) / 100
    const nextSize = (((event.clientY - centerY) * 2) / bounds.height) * 100
    setCameraOverlaySize(Math.min(200, Math.max(20, nextSize)))
  }

  function moveCameraOverlay(event: React.PointerEvent) {
    const canvas = canvasRef.current
    if (!canvas) return

    moveCameraOverlayFromBounds(event, canvas.getBoundingClientRect())
  }

  function resizeCameraOverlay(event: React.PointerEvent) {
    const canvas = canvasRef.current
    if (!canvas) return

    resizeCameraOverlayFromBounds(event, canvas.getBoundingClientRect())
  }

  return (
    <main className="h-[calc(100svh-4rem)] overflow-hidden bg-[#f6f7f5] text-[#171812]">
      <div className="mx-auto grid h-full min-h-0 w-full max-w-7xl gap-4 overflow-y-auto px-3 py-3 sm:px-6 lg:grid-cols-[270px_minmax(0,1fr)_300px] lg:overflow-hidden lg:px-8">
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
          screenMode={screenMode}
          screenReady={screenReady}
          screenError={screenError}
          cameraCutoutMode={cameraCutoutMode}
          segmentationReady={segmentationReady}
          segmentationError={segmentationError}
          cameraOverlaySize={cameraOverlaySize}
          screenZoom={screenZoom}
          onScreenModeChange={value => {
            setScreenMode(value)
            if (value) {
              if (detachedPrompterMode !== 'video') void toggleDetachedPrompter('video')
              void requestScreen()
            } else {
              stopScreenStream()
            }
          }}
          onSelectScreen={() => {
            if (detachedPrompterMode !== 'video') void toggleDetachedPrompter('video')
            void requestScreen()
          }}
          onCameraCutoutModeChange={value => {
            setCameraCutoutMode(value)
            if (value) void ensureSegmenter()
          }}
          onCameraOverlaySizeChange={setCameraOverlaySize}
          onScreenZoomChange={setScreenZoom}
          onManualLineChange={value => {
            setManualOverride(true)
            setManualLine(value)
          }}
          detachedPrompterMode={detachedPrompterMode}
          detachPrompterError={detachPrompterError}
          videoDetachDisabled={recordingDisabled}
          onToggleDetachedPrompter={mode => void toggleDetachedPrompter(mode)}
          videoId={video.id}
        />

        <section className="flex min-h-0 items-center justify-center overflow-hidden lg:h-full">
          <RecordingStage
            variant="embedded"
            phase={phase}
            disabled={recordingDisabled}
            recordedMs={recordedMs}
            countdownLeft={countdownLeft}
            lines={promptLines}
            currentLine={currentLine}
            fontSize={fontSize}
            lineHighlight={lineHighlight}
            mirrorMode={mirrorMode}
            showPrompter={!detachedPrompterWindow}
            promptPosition={promptPosition}
            onPromptMove={setPromptPosition}
            screenMode={screenMode}
            screenReady={screenReady}
            previewVideoRef={previewRef}
            canvasRef={canvasRef}
            screenPreviewRef={screenPreviewRef}
            cameraOverlayPosition={cameraOverlayPosition}
            cameraOverlaySize={cameraOverlaySize}
            cameraOverlayWidth={cameraOverlayWidth}
            onCameraMove={moveCameraOverlay}
            onCameraResize={resizeCameraOverlay}
            onToggleRecording={toggleRecording}
            take={take}
            permissionError={permissionError}
            onRetryCamera={() => void requestCamera()}
            onStart={startCountdown}
            onPause={pauseRecording}
            onResume={resumeRecording}
            onStop={stopRecording}
            onRetake={retake}
            onUpload={() => void uploadTake()}
            uploadDisabled={!canUpload}
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
      {detachedPrompterWindow &&
        detachedPrompterMode === 'prompter' &&
        createPortal(
          <DetachedPrompterWindow
            lines={promptLines}
            currentLine={currentLine}
            fontSize={fontSize}
            lineHighlight={lineHighlight}
          />,
          detachedPrompterWindow.document.body,
        )}
      {detachedPrompterWindow &&
        detachedPrompterMode === 'video' &&
        createPortal(
          <RecordingStage
            variant="fullscreen"
            phase={phase}
            disabled={!cameraReady || Boolean(permissionError)}
            recordedMs={recordedMs}
            countdownLeft={countdownLeft}
            lines={promptLines}
            currentLine={currentLine}
            fontSize={fontSize}
            lineHighlight={lineHighlight}
            mirrorMode={mirrorMode}
            showPrompter
            promptPosition={promptPosition}
            onPromptMove={setPromptPosition}
            cameraStream={streamRef.current}
            recordedStream={recordedPreviewStream}
            cameraOverlayPosition={cameraOverlayPosition}
            cameraOverlaySize={cameraOverlaySize}
            cameraOverlayWidth={cameraOverlayWidth}
            onCameraMoveFromBounds={moveCameraOverlayFromBounds}
            onCameraResizeFromBounds={resizeCameraOverlayFromBounds}
            onStart={startCountdown}
            onPause={pauseRecording}
            onResume={resumeRecording}
            onStop={stopRecording}
          />,
          detachedPrompterWindow.document.body,
        )}
    </main>
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
