import { AbsoluteFill, Html5Video, useCurrentFrame, useVideoConfig } from 'remotion'

import { fontFamily } from './caption-fonts'
import type { EditCaptionCue } from './captions'
import type { DraftSettings } from './types'

export type EditCompositionProps = {
  videoUrl: string
  captions: EditCaptionCue[]
  settings: DraftSettings
}

export function EditComposition({ videoUrl, captions, settings }: EditCompositionProps) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const seconds = frame / fps
  const caption = captions.find(item => seconds >= item.start && seconds < item.end)

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      {videoUrl ? (
        <Html5Video
          src={videoUrl}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : null}
      {caption ? <CaptionOverlay caption={caption} settings={settings} /> : null}
    </AbsoluteFill>
  )
}

function CaptionOverlay({
  caption,
  settings,
}: {
  caption: EditCaptionCue
  settings: DraftSettings
}) {
  const position =
    settings.captionPosition === 'top'
      ? { top: '12%' }
      : settings.captionPosition === 'middle'
        ? { top: '50%', transform: 'translateY(-50%)' }
        : { bottom: '10%' }

  return (
    <div
      style={{
        position: 'absolute',
        left: 56,
        right: 56,
        display: 'flex',
        justifyContent: 'center',
        ...position,
      }}
    >
      <div
        style={{
          maxWidth: '100%',
          padding: '18px 28px',
          textAlign: 'center',
          whiteSpace: 'pre-line',
          fontFamily: fontFamily(settings.captionFont),
          fontSize: settings.captionFontSize,
          fontWeight: 800,
          lineHeight: 1.12,
          color: settings.captionTextColor,
          backgroundColor: settings.captionBackgroundEnabled
            ? rgba(settings.captionBackgroundColor, settings.captionBackgroundOpacity)
            : 'transparent',
        }}
      >
        {caption.text}
      </div>
    </div>
  )
}

function rgba(hex: string, opacity: number) {
  const value = hex.replace('#', '')
  const red = Number.parseInt(value.slice(0, 2), 16)
  const green = Number.parseInt(value.slice(2, 4), 16)
  const blue = Number.parseInt(value.slice(4, 6), 16)

  return `rgb(${red} ${green} ${blue} / ${opacity / 100})`
}
