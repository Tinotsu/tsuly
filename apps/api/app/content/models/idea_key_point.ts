import { BaseModel, column } from '@adonisjs/lucid/orm'
import { compose } from '@adonisjs/core/helpers'

import { WithPrimaryUuid } from '#app/core/mixins/with_uuid_pk'
import { WithTimestamps } from '#app/core/mixins/with_timestamps'

export default class IdeaKeyPoint extends compose(BaseModel, WithTimestamps, WithPrimaryUuid) {
  @column() declare ideaId: string
  @column() declare body: string
  @column() declare sortOrder: number
}
