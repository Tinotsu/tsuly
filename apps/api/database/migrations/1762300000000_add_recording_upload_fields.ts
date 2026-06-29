import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('video_recordings', table => {
      table.uuid('script_id').nullable()
      table.uuid('take_id').nullable()
      table.string('storage_path').nullable()
      table.string('mime_type').nullable()
      table.integer('size_bytes').nullable()
      table.integer('duration_ms').nullable()
      table.integer('trim_start_ms').nullable()
      table.integer('trim_end_ms').nullable()
      table.timestamp('started_at').nullable()
      table.timestamp('stopped_at').nullable()
    })
  }

  async down() {
    this.schema.alterTable('video_recordings', table => {
      table.dropColumn('script_id')
      table.dropColumn('take_id')
      table.dropColumn('storage_path')
      table.dropColumn('mime_type')
      table.dropColumn('size_bytes')
      table.dropColumn('duration_ms')
      table.dropColumn('trim_start_ms')
      table.dropColumn('trim_end_ms')
      table.dropColumn('started_at')
      table.dropColumn('stopped_at')
    })
  }
}
