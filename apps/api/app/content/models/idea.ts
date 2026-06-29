import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import { compose } from '@adonisjs/core/helpers'

import { WithPrimaryUuid } from '#app/core/mixins/with_uuid_pk'
import { WithTimestamps } from '#app/core/mixins/with_timestamps'

import type { HasMany } from '@adonisjs/lucid/types/relations'
import IdeaKeyPoint from './idea_key_point.ts'

export default class Idea extends compose(BaseModel, WithTimestamps, WithPrimaryUuid) {
  @column() declare userId: string
  @column() declare title: string
  @column() declare pillar: string
  @column() declare status: string
  @column() declare rating: number
  @column() declare problem: string
  @column() declare hook: string
  @column() declare cta: string
  @column() declare sortOrder: number

  @hasMany(() => IdeaKeyPoint)
  declare keyPoints: HasMany<typeof IdeaKeyPoint>
}
