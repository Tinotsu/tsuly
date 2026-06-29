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
