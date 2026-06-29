import { BaseModel, column } from '@adonisjs/lucid/orm'
import { compose } from '@adonisjs/core/helpers'
import type { DateTime } from 'luxon'

import { WithPrimaryUuid } from '#app/core/mixins/with_uuid_pk'
import { WithTimestamps } from '#app/core/mixins/with_timestamps'

export default class VideoRecording extends compose(BaseModel, WithTimestamps, WithPrimaryUuid) {
  @column() declare videoId: string
  @column() declare scriptId: string | null
  @column() declare takeId: string | null
  @column() declare label: string
  @column() declare storagePath: string | null
  @column() declare mimeType: string | null
  @column() declare sizeBytes: number | null
  @column() declare durationMs: number | null
  @column() declare trimStartMs: number | null
  @column() declare trimEndMs: number | null
  @column.dateTime() declare startedAt: DateTime | null
  @column.dateTime() declare stoppedAt: DateTime | null
  @column() declare sortOrder: number
}
