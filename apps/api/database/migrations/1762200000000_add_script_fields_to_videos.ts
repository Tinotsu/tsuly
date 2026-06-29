import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('videos', table => {
      table.text('script_hook').notNullable().defaultTo('')
      table.text('script_spoken').notNullable().defaultTo('')
      table.text('script_shot_list').notNullable().defaultTo('')
      table.text('script_on_screen_text').notNullable().defaultTo('')
      table.text('script_assets_needed').notNullable().defaultTo('')
      table.text('script_recording_notes').notNullable().defaultTo('')
    })

    this.defer(async db => {
      await db.rawQuery(`
        UPDATE videos
        SET
          script_hook = title,
          script_spoken = transcript,
          script_shot_list = 'Scene 1
Type: Talking head
Duration: 3s',
          script_on_screen_text = title,
          script_assets_needed = '- Talking head recording',
          script_recording_notes = 'Tone: direct
Pause after the hook'
        WHERE script_spoken = ''
      `)
    })
  }

  async down() {
    this.schema.alterTable('videos', table => {
      table.dropColumn('script_hook')
      table.dropColumn('script_spoken')
      table.dropColumn('script_shot_list')
      table.dropColumn('script_on_screen_text')
      table.dropColumn('script_assets_needed')
      table.dropColumn('script_recording_notes')
    })
  }
}
