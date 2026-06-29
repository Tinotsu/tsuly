import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import { compose } from '@adonisjs/core/helpers'

import { WithPrimaryUuid } from '#app/core/mixins/with_uuid_pk'
import { WithTimestamps } from '#app/core/mixins/with_timestamps'

import type { HasMany } from '@adonisjs/lucid/types/relations'
import VideoEditingTask from './video_editing_task.ts'
import VideoRecording from './video_recording.ts'
import VideoStage from './video_stage.ts'

export default class Video extends compose(BaseModel, WithTimestamps, WithPrimaryUuid) {
  @column() declare userId: string
  @column() declare ideaId: string | null
  @column() declare title: string
  @column() declare idea: string
  @column() declare transcript: string
  @column() declare scriptHook: string
  @column() declare scriptSpoken: string
  @column() declare scriptShotList: string
  @column() declare scriptOnScreenText: string
  @column() declare scriptAssetsNeeded: string
  @column() declare scriptRecordingNotes: string
  @column() declare preview: string
  @column() declare publish: string
  @column() declare sortOrder: number

  @hasMany(() => VideoStage)
  declare stages: HasMany<typeof VideoStage>

  @hasMany(() => VideoRecording)
  declare recordings: HasMany<typeof VideoRecording>

  @hasMany(() => VideoEditingTask)
  declare editing: HasMany<typeof VideoEditingTask>
}
