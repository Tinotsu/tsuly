import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('ideas', table => {
      table.uuid('id').primary().notNullable()
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.string('title').notNullable()
      table.string('pillar').notNullable()
      table.string('status').notNullable()
      table.integer('rating').notNullable()
      table.text('problem').notNullable()
      table.text('hook').notNullable()
      table.text('cta').notNullable()
      table.integer('sort_order').notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['user_id', 'sort_order'])
    })

    this.schema.createTable('idea_key_points', table => {
      table.uuid('id').primary().notNullable()
      table.uuid('idea_id').notNullable().references('id').inTable('ideas').onDelete('CASCADE')
      table.text('body').notNullable()
      table.integer('sort_order').notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['idea_id', 'sort_order'])
    })

    this.schema.createTable('videos', table => {
      table.uuid('id').primary().notNullable()
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.uuid('idea_id').nullable().references('id').inTable('ideas').onDelete('SET NULL')
      table.string('title').notNullable()
      table.text('idea').notNullable()
      table.text('transcript').notNullable()
      table.string('preview').notNullable()
      table.string('publish').notNullable()
      table.integer('sort_order').notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['user_id', 'sort_order'])
    })

    this.schema.createTable('video_stages', table => {
      table.uuid('id').primary().notNullable()
      table.uuid('video_id').notNullable().references('id').inTable('videos').onDelete('CASCADE')
      table.string('label').notNullable()
      table.boolean('done').notNullable().defaultTo(false)
      table.integer('sort_order').notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['video_id', 'sort_order'])
    })

    this.schema.createTable('video_recordings', table => {
      table.uuid('id').primary().notNullable()
      table.uuid('video_id').notNullable().references('id').inTable('videos').onDelete('CASCADE')
      table.string('label').notNullable()
      table.integer('sort_order').notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['video_id', 'sort_order'])
    })

    this.schema.createTable('video_editing_tasks', table => {
      table.uuid('id').primary().notNullable()
      table.uuid('video_id').notNullable().references('id').inTable('videos').onDelete('CASCADE')
      table.string('label').notNullable()
      table.boolean('done').notNullable().defaultTo(false)
      table.integer('sort_order').notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['video_id', 'sort_order'])
    })

    this.schema.createTable('brand_brain_sections', table => {
      table.uuid('id').primary().notNullable()
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.string('key').notNullable()
      table.string('title').notNullable()
      table.text('summary').notNullable()
      table.integer('sort_order').notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['user_id', 'key'])
      table.index(['user_id', 'sort_order'])
    })

    this.schema.createTable('brand_brain_fields', table => {
      table.uuid('id').primary().notNullable()
      table
        .uuid('brand_brain_section_id')
        .notNullable()
        .references('id')
        .inTable('brand_brain_sections')
        .onDelete('CASCADE')
      table.string('label').notNullable()
      table.text('value').notNullable()
      table.integer('sort_order').notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['brand_brain_section_id', 'sort_order'])
    })
  }

  async down() {
    this.schema.dropTable('brand_brain_fields')
    this.schema.dropTable('brand_brain_sections')
    this.schema.dropTable('video_editing_tasks')
    this.schema.dropTable('video_recordings')
    this.schema.dropTable('video_stages')
    this.schema.dropTable('videos')
    this.schema.dropTable('idea_key_points')
    this.schema.dropTable('ideas')
  }
}
