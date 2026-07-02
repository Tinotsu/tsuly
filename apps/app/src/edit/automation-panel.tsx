import { Check, Circle, LoaderCircle, SlidersHorizontal } from 'lucide-react'
import { useMemo } from 'react'

import { cn } from '@/lib/utils'

import type { EditingJob } from './types'

export function AutomationPanel({ editingJob }: { editingJob: EditingJob }) {
  const steps = useMemo(() => automationSteps(editingJob), [editingJob])

  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="size-4 text-sky-700" />
        <h2 className="font-semibold">Automation</h2>
      </div>

      {editingJob.status === 'failed' ? (
        <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {editingJob.errorMessage || 'Render failed'}
        </p>
      ) : null}

      <div className="mt-3 overflow-x-auto pb-1">
        <div className="relative flex min-w-[760px] items-start px-6 pt-1">
          <div className="absolute left-12 right-12 top-4 h-px bg-border" />
          {steps.map(step => (
            <div key={step.label} className="relative flex flex-1 flex-col items-center gap-2 px-1">
              <span
                title={`${step.label}: ${step.detail}`}
                className={cn(
                  'z-10 flex size-6 items-center justify-center rounded-full border bg-card',
                  step.done && 'border-emerald-600 bg-emerald-600 text-white',
                  step.active && !step.done && 'border-sky-700 text-sky-700',
                )}
              >
                {step.done ? (
                  <Check className="size-3.5" />
                ) : step.active ? (
                  <LoaderCircle className="size-3.5 animate-spin" />
                ) : (
                  <Circle className="size-3" />
                )}
              </span>
              <div className="max-w-28 text-center">
                <p className="text-xs font-medium leading-tight">{step.label}</p>
                <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
                  {step.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function automationSteps(editingJob: EditingJob) {
  const currentStep = editingJob.currentStep
  const afterSilence = ['captioning', 'rendering', 'done'].includes(currentStep ?? '')

  return [
    {
      label: 'Queued',
      detail: 'Waiting for the worker',
      active: editingJob.status === 'queued',
      done: !['draft', 'queued'].includes(editingJob.status),
    },
    {
      label: 'Normalize video',
      detail: 'Apply trim and vertical crop',
      active: currentStep === 'normalizing',
      done: Boolean(editingJob.normalizedPath),
    },
    {
      label: 'Extract audio',
      detail: 'Prepare audio for transcription',
      active: currentStep === 'extracting_audio',
      done: Boolean(editingJob.audioPath),
    },
    {
      label: 'Transcribe',
      detail: 'Create timestamped speech segments',
      active: currentStep === 'transcribing',
      done: Boolean(editingJob.transcriptPath),
    },
    {
      label: 'Generate captions',
      detail: 'Build subtitle timings',
      active: currentStep === 'captioning',
      done: Boolean(editingJob.captionsPath),
    },
    {
      label: 'Ready to edit',
      detail: 'Prepared assets are available',
      active: currentStep === 'prepared',
      done: ['prepared', 'ready'].includes(editingJob.status),
    },
    ...(editingJob.settings.removeSilence
      ? [
          {
            label: 'Detect silence',
            detail: 'Find pauses to remove',
            active: currentStep === 'detecting_silence',
            done: afterSilence || Boolean(editingJob.finalPath),
          },
        ]
      : []),
    {
      label: 'Render MP4',
      detail: 'Export the final edit',
      active: currentStep === 'rendering',
      done: Boolean(editingJob.finalPath),
    },
  ]
}
