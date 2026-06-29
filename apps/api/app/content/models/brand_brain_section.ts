import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import { compose } from '@adonisjs/core/helpers'

import { WithPrimaryUuid } from '#app/core/mixins/with_uuid_pk'
import { WithTimestamps } from '#app/core/mixins/with_timestamps'

import type { HasMany } from '@adonisjs/lucid/types/relations'
import BrandBrainField from './brand_brain_field.ts'

export default class BrandBrainSection extends compose(BaseModel, WithTimestamps, WithPrimaryUuid) {
  @column() declare userId: string
  @column() declare key: string
  @column() declare title: string
  @column() declare summary: string
  @column() declare sortOrder: number

  @hasMany(() => BrandBrainField)
  declare fields: HasMany<typeof BrandBrainField>
}
