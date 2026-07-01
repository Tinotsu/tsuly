import { Check } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

import type { Video } from '@/workspace/types'

import type { RecordedTake, RecorderPhase } from './types'

export function ReviewPanel({
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

function stepDone(index: number, phase: RecorderPhase) {
  if (index === 0) return true
  if (index === 1) return phase !== 'idle'
  if (index === 2) return ['review', 'uploading', 'done'].includes(phase)
  if (index === 3) return ['review', 'uploading', 'done'].includes(phase)
  if (index === 4) return ['uploading', 'done'].includes(phase)
  return phase === 'done'
}
