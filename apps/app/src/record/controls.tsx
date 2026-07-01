import { Link } from '@tanstack/react-router'
import { ArrowLeft, Info, PanelTopClose, PanelTopOpen, ScreenShare } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

import type { DetachedPrompterMode } from './types'

export function TeleprompterControls({
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
                min={20}
                max={200}
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
