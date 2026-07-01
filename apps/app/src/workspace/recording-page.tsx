import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { FilesetResolver, ImageSegmenter, type ImageSegmenterResult } from '@mediapipe/tasks-vision'
import {
  ArrowLeft,
  Check,
  Info,
  PanelTopClose,
  PanelTopOpen,
  RefreshCcw,
  RotateCcw,
  ScreenShare,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

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
type DocumentPictureInPictureApi = {
  requestWindow: (options?: { width?: number; height?: number }) => Promise<Window>
}
type DetachedPrompterMode = 'prompter' | 'video'
type RecorderSettings = {
  countdownSeconds: number
  fontSize: number
  scrollSpeed: number
  mirrorMode: boolean
  lineHighlight: boolean
  screenMode: boolean
  cameraCutoutMode: boolean
  cameraOverlaySize: number
  cameraOverlayPosition: { x: number; y: number }
  screenZoom: number
  manualLine: number
  manualOverride: boolean
  promptPosition: { x: number; y: number }
}

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
  const previewRef = useRef<HTMLVideoElement | null>(null)
  const screenPreviewRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const personCanvasRef = useRef<HTMLCanvasElement | null>(null)
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
  const [screenMode, setScreenMode] = useState(savedRecorderSettings.screenMode ?? false)
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
    savedRecorderSettings.cameraOverlaySize ?? 26,
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
        screenMode,
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
    screenMode,
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

        const personCanvas = personCanvasRef.current
        if (cameraCutoutMode && segmentationReady && personCanvas) {
          drawCameraLayer(
            drawingContext,
            personCanvas,
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
      drawPersonCutout(result, cameraVideo)
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

  function drawPersonCutout(result: ImageSegmenterResult, cameraVideo: HTMLVideoElement) {
    const masks = result.confidenceMasks
    const mask = masks?.[personMaskIndexRef.current] ?? masks?.[masks.length - 1]
    if (!mask) return

    const width = mask.width
    const height = mask.height
    const personCanvas = personCanvasRef.current ?? document.createElement('canvas')
    const maskCanvas = personMaskCanvasRef.current ?? document.createElement('canvas')
    const personContext = personCanvas.getContext('2d')
    const maskContext = maskCanvas.getContext('2d')
    if (!personContext || !maskContext) return

    personCanvasRef.current = personCanvas
    personMaskCanvasRef.current = maskCanvas
    personCanvas.width = width
    personCanvas.height = height
    maskCanvas.width = width
    maskCanvas.height = height

    const maskData = mask.getAsFloat32Array()
    const imageData = maskContext.createImageData(width, height)
    for (let index = 0; index < maskData.length; index += 1) {
      imageData.data[index * 4 + 3] = Math.round(maskData[index] * 255)
    }

    maskContext.putImageData(imageData, 0, 0)
    personContext.clearRect(0, 0, width, height)
    personContext.drawImage(maskCanvas, 0, 0)
    personContext.globalCompositeOperation = 'source-in'
    personContext.drawImage(cameraVideo, 0, 0, width, height)
    personContext.globalCompositeOperation = 'source-over'
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
    setCameraOverlaySize(Math.min(46, Math.max(14, nextSize)))
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
          onAutoScroll={() => setManualOverride(false)}
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

function TeleprompterControls({
  countdownSeconds,
  fontSize,
  scrollSpeed,
  mirrorMode,
  lineHighlight,
  screenMode,
  screenReady,
  screenError,
  cameraCutoutMode,
  segmentationReady,
  segmentationError,
  cameraOverlaySize,
  screenZoom,
  currentLine,
  lineCount,
  disabled,
  onCountdownChange,
  onFontSizeChange,
  onScrollSpeedChange,
  onMirrorModeChange,
  onLineHighlightChange,
  onScreenModeChange,
  onSelectScreen,
  onCameraCutoutModeChange,
  onCameraOverlaySizeChange,
  onScreenZoomChange,
  onManualLineChange,
  onAutoScroll,
  detachedPrompterMode,
  detachPrompterError,
  videoDetachDisabled,
  onToggleDetachedPrompter,
  videoId,
}: {
  countdownSeconds: number
  fontSize: number
  scrollSpeed: number
  mirrorMode: boolean
  lineHighlight: boolean
  screenMode: boolean
  screenReady: boolean
  screenError: string
  cameraCutoutMode: boolean
  segmentationReady: boolean
  segmentationError: string
  cameraOverlaySize: number
  screenZoom: number
  currentLine: number
  lineCount: number
  disabled: boolean
  onCountdownChange: (value: number) => void
  onFontSizeChange: (value: number) => void
  onScrollSpeedChange: (value: number) => void
  onMirrorModeChange: (value: boolean) => void
  onLineHighlightChange: (value: boolean) => void
  onScreenModeChange: (value: boolean) => void
  onSelectScreen: () => void
  onCameraCutoutModeChange: (value: boolean) => void
  onCameraOverlaySizeChange: (value: number) => void
  onScreenZoomChange: (value: number) => void
  onManualLineChange: (value: number) => void
  onAutoScroll: () => void
  detachedPrompterMode: DetachedPrompterMode | null
  detachPrompterError: string
  videoDetachDisabled: boolean
  onToggleDetachedPrompter: (mode: DetachedPrompterMode) => void
  videoId: string
}) {
  const prompterDetached = detachedPrompterMode === 'prompter'
  const videoDetached = detachedPrompterMode === 'video'

  return (
    <aside className="order-3 flex flex-col overflow-hidden rounded-lg border bg-card p-4 lg:order-none lg:min-h-0 lg:max-h-full">
      <Link
        to="/videos/$videoId/script"
        params={{ videoId }}
        className="mb-5 inline-flex shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Script
      </Link>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto lg:pr-1">
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
        <div className="space-y-3 rounded-lg border bg-muted/30 p-3 has-[.record-screen-info:hover]:[&_.record-screen-info-panel]:block has-[.record-screen-info-panel:hover]:[&_.record-screen-info-panel]:block">
          <div className="flex items-center justify-between gap-3 text-sm font-medium">
            <div className="flex items-center gap-2">
              Record screen
              <span
                className="record-screen-info inline-flex cursor-default rounded-full text-muted-foreground hover:text-foreground"
                aria-label="To make the page phone-sized, right-click the page, choose Inspect, then click the phone/tablet icon in DevTools."
              >
                <Info className="size-4" />
              </span>
            </div>
            <input
              type="checkbox"
              checked={screenMode}
              onChange={event => onScreenModeChange(event.target.checked)}
              className="size-4 accent-foreground"
            />
          </div>
          <div className="record-screen-info-panel hidden rounded-md border bg-popover p-2 text-xs font-normal text-popover-foreground shadow-md">
            Right-click the page, choose Inspect, then click the phone/tablet icon in DevTools.
            <img
              src="/devtools-phone-toggle.png"
              alt="Chrome DevTools phone and tablet toggle"
              className="mt-2 w-full rounded border"
            />
          </div>
          {screenMode && (
            <>
              <Button type="button" variant="outline" className="w-full" onClick={onSelectScreen}>
                <ScreenShare />
                {screenReady ? 'Change screen/window' : 'Choose screen/window'}
              </Button>
              <ToggleControl
                label="Cut me out"
                checked={cameraCutoutMode}
                onChange={onCameraCutoutModeChange}
              />
              <RangeControl
                label="Me size"
                value={cameraOverlaySize}
                min={14}
                max={46}
                step={1}
                suffix="%"
                onChange={onCameraOverlaySizeChange}
              />
              <RangeControl
                label="Screen zoom"
                value={screenZoom}
                min={1}
                max={2}
                step={0.05}
                suffix="x"
                onChange={onScreenZoomChange}
              />
              {screenError && <p className="text-xs text-destructive">{screenError}</p>}
              {cameraCutoutMode && !segmentationReady && !segmentationError && (
                <p className="text-xs text-muted-foreground">Cutout loading</p>
              )}
              {cameraCutoutMode && segmentationError && (
                <p className="text-xs text-destructive">{segmentationError}</p>
              )}
            </>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={videoDetached}
          onClick={() => onToggleDetachedPrompter('prompter')}
        >
          {prompterDetached ? <PanelTopClose /> : <PanelTopOpen />}
          {prompterDetached ? 'Dock prompter' : 'Detach prompter'}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={videoDetachDisabled || prompterDetached}
          onClick={() => onToggleDetachedPrompter('video')}
        >
          {videoDetached ? <PanelTopClose /> : <PanelTopOpen />}
          {videoDetached ? 'Dock video + prompter' : 'Detach video + prompter'}
        </Button>
        {detachPrompterError && <p className="text-xs text-destructive">{detachPrompterError}</p>}
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

function RecordingStage({
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
  previewVideoRef?: React.RefObject<HTMLVideoElement | null>
  canvasRef?: React.RefObject<HTMLCanvasElement | null>
  screenPreviewRef?: React.RefObject<HTMLVideoElement | null>
  cameraOverlayPosition?: { x: number; y: number }
  cameraOverlaySize?: number
  cameraOverlayWidth?: number
  onCameraMove?: (event: React.PointerEvent) => void
  onCameraResize?: (event: React.PointerEvent) => void
  onCameraMoveFromBounds?: (event: React.PointerEvent, bounds: DOMRect) => void
  onCameraResizeFromBounds?: (event: React.PointerEvent, bounds: DOMRect) => void
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
  const showPrompterOverlay =
    showPrompter && (phase === 'idle' || phase === 'recording' || phase === 'paused')
  const portraitFrameStyle = isFullscreen
    ? {
        height: 'min(100vh, calc(100vw * 16 / 9))',
        width: 'min(100vw, calc(100vh * 9 / 16))',
      }
    : { height: '100%', width: '100%' }

  function movePrompt(event: React.PointerEvent<HTMLDivElement>) {
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
          <p className="font-medium">Take uploaded. Auto-edit queued.</p>
          <p className="mt-1 text-muted-foreground">
            Captions, silence removal, cuts, and export will run server-side.
          </p>
        </div>
      )}

      <div
        style={{
          alignItems: 'center',
          background: 'rgb(0 0 0 / 0.5)',
          borderRadius: 14,
          bottom: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          left: '50%',
          padding: 8,
          position: 'absolute',
          transform: 'translateX(-50%)',
          zIndex: 10,
        }}
      >
        <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
          {(phase === 'idle' || phase === 'done') && (
            <DetachedControlButton disabled={disabled} onClick={onStart}>
              Start
            </DetachedControlButton>
          )}
          {phase === 'recording' && (
            <>
              <DetachedControlButton onClick={onPause}>Pause</DetachedControlButton>
              <DetachedControlButton danger onClick={onStop}>
                Stop
              </DetachedControlButton>
            </>
          )}
          {phase === 'paused' && (
            <>
              <DetachedControlButton onClick={onResume}>Resume</DetachedControlButton>
              <DetachedControlButton danger onClick={onStop}>
                Stop
              </DetachedControlButton>
            </>
          )}
          {phase === 'review' && onRetake && onUpload && (
            <>
              <DetachedControlButton onClick={onRetake}>Retake</DetachedControlButton>
              <DetachedControlButton disabled={uploadDisabled} onClick={onUpload}>
                Approve
              </DetachedControlButton>
            </>
          )}
          {phase === 'uploading' && (
            <DetachedControlButton disabled onClick={() => undefined}>
              Uploading
            </DetachedControlButton>
          )}
          {(phase === 'recording' || phase === 'paused') && (
            <span style={{ color: '#fff', fontFamily: 'monospace', fontSize: 14, minWidth: 42 }}>
              {formatElapsed(recordedMs)}
            </span>
          )}
        </div>
        {isFullscreen && recordedStream && (
          <div style={{ display: 'flex', gap: 4 }}>
            <DetachedControlButton
              active={viewMode === 'camera'}
              onClick={() => setViewMode('camera')}
            >
              Camera
            </DetachedControlButton>
            <DetachedControlButton
              active={viewMode === 'recorded'}
              onClick={() => setViewMode('recorded')}
            >
              Recorded
            </DetachedControlButton>
          </div>
        )}
      </div>
    </div>
  )
}

function DetachedPrompterWindow({
  lines,
  currentLine,
  fontSize,
  lineHighlight,
}: {
  lines: string[]
  currentLine: number
  fontSize: number
  lineHighlight: boolean
}) {
  const lineHeight = Math.round(fontSize * 1.35)
  const firstVisibleLine = Math.max(0, currentLine - 1)
  const visibleLines = lines.slice(firstVisibleLine, firstVisibleLine + 3)

  return (
    <div
      style={{
        alignItems: 'center',
        background: '#111',
        boxSizing: 'border-box',
        color: '#fff',
        display: 'flex',
        fontFamily: 'system-ui, sans-serif',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 18,
        textAlign: 'center',
        textShadow: '0 2px 14px rgb(0 0 0 / 0.75)',
      }}
    >
      <div style={{ width: '100%' }}>
        {visibleLines.map((line, index) => {
          const lineIndex = firstVisibleLine + index

          return (
            <p
              key={`${line}-${lineIndex}`}
              style={{
                background:
                  lineHighlight && lineIndex === currentLine ? 'rgb(0 0 0 / 0.4)' : 'transparent',
                borderRadius: 8,
                fontSize,
                fontWeight: 700,
                lineHeight: `${lineHeight}px`,
                margin: '0 auto',
                maxWidth: '92%',
                opacity: lineHighlight && lineIndex !== currentLine ? 0.45 : 1,
                padding: '0 8px',
              }}
            >
              {line}
            </p>
          )
        })}
      </div>
    </div>
  )
}

function DetachedControlButton({
  children,
  active,
  danger,
  disabled,
  onClick,
}: {
  children: string
  active?: boolean
  danger?: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        background: danger ? '#ef4444' : active === false ? 'transparent' : '#fff',
        border: 0,
        borderRadius: 10,
        color: danger || active === false ? '#fff' : '#111',
        cursor: disabled ? 'not-allowed' : 'pointer',
        font: '600 14px system-ui, sans-serif',
        opacity: disabled ? 0.5 : 1,
        padding: '9px 13px',
      }}
    >
      {children}
    </button>
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
    <aside className="order-4 rounded-lg border bg-card p-4 lg:order-none lg:max-h-full lg:min-h-0 lg:overflow-y-auto">
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

function drawCameraLayer(
  context: CanvasRenderingContext2D,
  image: CanvasImageSource,
  x: number,
  y: number,
  width: number,
  height: number,
  mirrorMode: boolean,
) {
  if (mirrorMode) {
    context.save()
    context.translate(x + width, y)
    context.scale(-1, 1)
    context.drawImage(image, 0, 0, width, height)
    context.restore()
    return
  }

  context.drawImage(image, x, y, width, height)
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
