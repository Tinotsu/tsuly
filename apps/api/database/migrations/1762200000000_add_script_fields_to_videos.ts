import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('videos', table => {
      table.text('script_hook').notNullable().defaultTo('')
      table.text('script_spoken').notNullable().defaultTo('')
      table.text('script_on_screen_text').notNullable().defaultTo('')
    })

    this.defer(async db => {
      await db.rawQuery(`
        UPDATE videos
        SET
          script_hook = title,
          script_spoken = transcript,
          script_on_screen_text = title
        WHERE script_spoken = ''
      `)
    })
  }

  async down() {
    this.schema.alterTable('videos', table => {
      table.dropColumn('script_hook')
      table.dropColumn('script_spoken')
      table.dropColumn('script_on_screen_text')
    })
  }
}
