import vine from '@vinejs/vine'

const BRAND_BRAIN_CARD_WORD_LIMIT = 500

function countWords(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}

const maxWords = vine.createRule<{ limit: number }>(
  (value, { limit }, field) => {
    if (countWords(String(value ?? '')) > limit) {
      field.report(`Must not exceed ${limit} words`, 'maxWords', field, { limit })
    }
  },
  { name: 'maxWords' },
)

const cardText = () =>
  vine
    .string()
    .use(maxWords({ limit: BRAND_BRAIN_CARD_WORD_LIMIT }))
    .nullable()
    .transform(value => value ?? '')

export const updateBrandBrainFieldValidator = vine.compile(
  vine.object({
    label: vine.string().nullable().optional(),
    value: cardText(),
  }),
)

export const createBrandBrainFieldValidator = vine.compile(
  vine.object({
    label: vine.string(),
    value: cardText(),
  }),
)

export const createIdeaValidator = vine.compile(
  vine.object({
    title: vine.string().optional(),
    note: cardText().optional(),
    pillar: vine.string().optional(),
    rating: vine.number().min(0).max(5).optional(),
    status: vine.string().optional(),
  }),
)

export const updateIdeaValidator = vine.compile(
  vine.object({
    title: vine.string().optional(),
    note: cardText().optional(),
    pillar: vine.string().optional(),
    rating: vine.number().min(0).max(5).optional(),
    status: vine.string().optional(),
  }),
)

export const updateVideoScriptValidator = vine.compile(
  vine.object({
    hook: cardText().optional(),
    spokenScript: cardText().optional(),
    onScreenText: cardText().optional(),
  }),
)

export const chatVideoScriptValidator = vine.compile(
  vine.object({
    message: cardText(),
  }),
)
