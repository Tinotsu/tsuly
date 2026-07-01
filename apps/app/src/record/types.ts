export type RecorderPhase =
  | 'idle'
  | 'countdown'
  | 'recording'
  | 'paused'
  | 'review'
  | 'uploading'
  | 'done'
export type RecordedTake = {
  id: string
  blob: Blob
  url: string
  startedAt: string
  stoppedAt: string
  durationMs: number
}
export type DocumentPictureInPictureApi = {
  requestWindow: (options?: { width?: number; height?: number }) => Promise<Window>
}
export type DetachedPrompterMode = 'prompter' | 'video'
export type RecorderSettings = {
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
