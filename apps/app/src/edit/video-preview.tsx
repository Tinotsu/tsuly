import { Player } from '@remotion/player'

import type { EditCaptionCue } from './captions'
import { EditComposition } from './edit-composition'
import type { DraftSettings, EditingJob } from './types'

export function VideoPreview({
  videoUrl,
  captions,
  draft,
  status,
  durationFrames,
  showFinal,
}: {
  videoUrl: string
  captions: EditCaptionCue[]
  draft: DraftSettings
  status: EditingJob['status']
  durationFrames: number
  showFinal: boolean
}) {
  return (
    <div className="rounded-lg border bg-card p-4 lg:flex lg:min-h-0 lg:flex-col">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Preview</p>
          <h2 className="text-lg font-semibold">{previewTitle(status, showFinal)}</h2>
        </div>
        <span className="rounded-md border bg-background px-2 py-1 text-xs font-medium capitalize">
          {status}
        </span>
      </div>

      <div className="mt-4 flex justify-center lg:min-h-0 lg:flex-1">
        <div className="w-full max-w-[320px] overflow-hidden rounded-md bg-black lg:aspect-[9/16] lg:h-full lg:w-auto">
          {videoUrl ? (
            <Player
              component={EditComposition}
              inputProps={{ videoUrl, captions, settings: draft }}
              compositionWidth={1080}
              compositionHeight={1920}
              durationInFrames={durationFrames}
              fps={30}
              controls
              style={{
                width: '100%',
                height: '100%',
                aspectRatio: '9 / 16',
              }}
            />
          ) : (
            <div className="aspect-[9/16] lg:h-full" />
          )}
        </div>
      </div>
    </div>
  )
}

function previewTitle(status: EditingJob['status'], showFinal: boolean) {
  if (showFinal) return 'Final edit'
  if (status === 'prepared') return 'Prepared edit'
  if (status === 'queued' || status === 'processing') return 'Preparing edit'
  return 'Raw take'
}
