import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'video_editing_jobs'

  async up() {
    this.schema.alterTable(this.tableName, table => {
      table.string('current_step').nullable()
      table.string('caption_font').notNullable().defaultTo('Inter')
      table.integer('caption_font_size').notNullable().defaultTo(64)
      table.string('caption_text_color').notNullable().defaultTo('#ffffff')
      table.boolean('caption_background_enabled').notNullable().defaultTo(true)
      table.string('caption_background_color').notNullable().defaultTo('#000000')
      table.integer('caption_background_opacity').notNullable().defaultTo(68)
      table.string('caption_position').notNullable().defaultTo('bottom')
      table.integer('words_per_caption').notNullable().defaultTo(8)
      table.boolean('remove_silence').notNullable().defaultTo(true)
      table.float('silence_threshold_seconds').notNullable().defaultTo(0.7)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('current_step')
      table.dropColumn('caption_font')
      table.dropColumn('caption_font_size')
      table.dropColumn('caption_text_color')
      table.dropColumn('caption_background_enabled')
      table.dropColumn('caption_background_color')
      table.dropColumn('caption_background_opacity')
      table.dropColumn('caption_position')
      table.dropColumn('words_per_caption')
      table.dropColumn('remove_silence')
      table.dropColumn('silence_threshold_seconds')
    })
  }
}
