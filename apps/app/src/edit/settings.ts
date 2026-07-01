import { captionFont } from './caption-fonts'
import type { CaptionPosition, DraftSettings, EditingJob, Recording } from './types'

export function draftFrom(editingJob: EditingJob, recording: Recording): DraftSettings {
  return {
    ...editingJob.settings,
    captionFont: captionFont(editingJob.settings.captionFont),
    captionPosition: captionPosition(editingJob.settings.captionPosition),
    trimStartMs: recording.trimStartMs ?? 0,
    trimEndMs: recording.trimEndMs ?? recording.durationMs ?? 0,
  }
}

export function settingsPayload(draft: DraftSettings) {
  return {
    trimStartMs: draft.trimStartMs,
    trimEndMs: draft.trimEndMs,
    captionFont: draft.captionFont,
    captionFontSize: draft.captionFontSize,
    captionTextColor: draft.captionTextColor,
    captionBackgroundEnabled: draft.captionBackgroundEnabled,
    captionBackgroundColor: draft.captionBackgroundColor,
    captionBackgroundOpacity: draft.captionBackgroundOpacity,
    captionPosition: draft.captionPosition,
    wordsPerCaption: draft.wordsPerCaption,
    removeSilence: draft.removeSilence,
    silenceThresholdSeconds: draft.silenceThresholdSeconds,
  }
}

function captionPosition(value: string): CaptionPosition {
  if (value === 'top' || value === 'middle') return value
  return 'bottom'
}
