import { cn } from '@/lib/utils'

import { fontFamily } from './caption-fonts'
import type { DraftSettings, EditingJob } from './types'

export function VideoPreview({
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

function rgba(hex: string, opacity: number) {
  const value = hex.replace('#', '')
  const red = Number.parseInt(value.slice(0, 2), 16)
  const green = Number.parseInt(value.slice(2, 4), 16)
  const blue = Number.parseInt(value.slice(4, 6), 16)

  return `rgb(${red} ${green} ${blue} / ${opacity / 100})`
}

function lineBreakPreview(text: string) {
  return text.replace(' appears ', '\nappears ')
}
