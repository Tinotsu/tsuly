import type { Video } from '@/workspace/types'

import type { positionOptions } from './constants'

export type EditingJob = NonNullable<Video['editingJob']>
export type Recording = Video['recordings'][number]
export type CaptionFont = string
export type CaptionPosition = (typeof positionOptions)[number]['value']
export type DraftSettings = Omit<EditingJob['settings'], 'captionFont' | 'captionPosition'> & {
  captionFont: CaptionFont
  captionPosition: CaptionPosition
  trimStartMs: number
  trimEndMs: number
}
