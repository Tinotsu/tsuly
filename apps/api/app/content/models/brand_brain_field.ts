import { BaseModel, column } from '@adonisjs/lucid/orm'
import { compose } from '@adonisjs/core/helpers'

import { WithPrimaryUuid } from '#app/core/mixins/with_uuid_pk'
import { WithTimestamps } from '#app/core/mixins/with_timestamps'

export default class BrandBrainField extends compose(BaseModel, WithTimestamps, WithPrimaryUuid) {
  @column() declare brandBrainSectionId: string
  @column() declare label: string
  @column() declare value: string
  @column() declare sortOrder: number
}
