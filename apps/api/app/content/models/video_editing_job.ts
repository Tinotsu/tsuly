import { BaseModel, column } from '@adonisjs/lucid/orm'
import { compose } from '@adonisjs/core/helpers'
import type { DateTime } from 'luxon'

import { WithPrimaryUuid } from '#app/core/mixins/with_uuid_pk'
import { WithTimestamps } from '#app/core/mixins/with_timestamps'

export type VideoEditingJobStatus = 'queued' | 'processing' | 'ready' | 'failed'

export default class VideoEditingJob extends compose(BaseModel, WithTimestamps, WithPrimaryUuid) {
  @column() declare videoId: string
  @column() declare recordingId: string
  @column() declare status: VideoEditingJobStatus
  @column() declare originalPath: string
  @column() declare normalizedPath: string | null
  @column() declare audioPath: string | null
  @column() declare transcriptPath: string | null
  @column() declare captionsPath: string | null
  @column() declare finalPath: string | null
  @column() declare errorMessage: string | null
  @column.dateTime() declare startedAt: DateTime | null
  @column.dateTime() declare finishedAt: DateTime | null
}
