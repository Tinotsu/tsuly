import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'video_editing_jobs'

  async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('id').primary().notNullable()
      table.uuid('video_id').notNullable().references('id').inTable('videos').onDelete('CASCADE')
      table
        .uuid('recording_id')
        .notNullable()
        .references('id')
        .inTable('video_recordings')
        .onDelete('CASCADE')
      table.string('status').notNullable()
      table.string('original_path').notNullable()
      table.string('normalized_path').nullable()
      table.string('audio_path').nullable()
      table.string('transcript_path').nullable()
      table.string('captions_path').nullable()
      table.string('final_path').nullable()
      table.text('error_message').nullable()
      table.timestamp('started_at').nullable()
      table.timestamp('finished_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['video_id', 'created_at'])
      table.index(['status'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
