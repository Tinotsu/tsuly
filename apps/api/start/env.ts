import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  APP_URL: Env.schema.string({ format: 'url', tld: false }),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.string(),

  /**
   * ----------------------------------------------------------
   * Variables for configuring database
   * ----------------------------------------------------------
   */
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Queue
  |----------------------------------------------------------
  */
  REDIS_URL: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring session package
  |----------------------------------------------------------
  */
  SESSION_DRIVER: Env.schema.enum(['cookie', 'memory'] as const),

  /*
  |----------------------------------------------------------
  | Misc variables
  |----------------------------------------------------------
  */
  SECRET_TOKEN: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Stripe billing
  |----------------------------------------------------------
  */
  FRONTEND_URL: Env.schema.string({ format: 'url', tld: false }),
  STRIPE_SECRET_KEY: Env.schema.string.optional(),
  STRIPE_WEBHOOK_SECRET: Env.schema.string.optional(),
  STRIPE_PRICE_PRO: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Script generation
  |----------------------------------------------------------
  */
  OPENAI_API_KEY: Env.schema.string.optional(),
  OPENAI_BASE_URL: Env.schema.string.optional(),
  OPENAI_AUDIO_BASE_URL: Env.schema.string.optional(),
  OPENAI_MODEL: Env.schema.string.optional(),
  DEEPSEEK_API_KEY: Env.schema.string.optional(),
  WHISPER_MODEL: Env.schema.string.optional(),
  FFMPEG_PATH: Env.schema.string.optional(),
})
