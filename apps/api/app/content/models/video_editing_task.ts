import { BaseModel, column } from '@adonisjs/lucid/orm'
import { compose } from '@adonisjs/core/helpers'

import { WithPrimaryUuid } from '#app/core/mixins/with_uuid_pk'
import { WithTimestamps } from '#app/core/mixins/with_timestamps'

export default class VideoEditingTask extends compose(BaseModel, WithTimestamps, WithPrimaryUuid) {
  @column() declare videoId: string
  @column() declare label: string
  @column() declare done: boolean
  @column() declare sortOrder: number
}
