import { BaseModel, column } from '@adonisjs/lucid/orm'
import { compose } from '@adonisjs/core/helpers'
import type { DateTime } from 'luxon'

import { WithPrimaryUuid } from '#app/core/mixins/with_uuid_pk'
import { WithTimestamps } from '#app/core/mixins/with_timestamps'

export type VideoEditingJobStatus = 'draft' | 'queued' | 'processing' | 'ready' | 'failed'

export default class VideoEditingJob extends compose(BaseModel, WithTimestamps, WithPrimaryUuid) {
  @column() declare videoId: string
  @column() declare recordingId: string
  @column() declare status: VideoEditingJobStatus
  @column() declare currentStep: string | null
  @column() declare originalPath: string
  @column() declare normalizedPath: string | null
  @column() declare audioPath: string | null
  @column() declare transcriptPath: string | null
  @column() declare captionsPath: string | null
  @column() declare finalPath: string | null
  @column() declare captionFont: string
  @column() declare captionFontSize: number
  @column() declare captionTextColor: string
  @column() declare captionBackgroundEnabled: boolean
  @column() declare captionBackgroundColor: string
  @column() declare captionBackgroundOpacity: number
  @column() declare captionPosition: string
  @column() declare wordsPerCaption: number
  @column() declare removeSilence: boolean
  @column() declare silenceThresholdSeconds: number
  @column() declare errorMessage: string | null
  @column.dateTime() declare startedAt: DateTime | null
  @column.dateTime() declare finishedAt: DateTime | null
}
