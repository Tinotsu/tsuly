import { BRAND_BRAIN_CARD_WORD_LIMIT } from './constants'

function countWords(text: string) {
  const trimmed = text.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}

function limitToWords(text: string, max: number) {
  if (countWords(text) <= max) return text

  const leading = text.match(/^\s*/)?.[0] ?? ''
  return `${leading}${text.trim().split(/\s+/).slice(0, max).join(' ')}`
}

export function limitCardValue(textarea: HTMLTextAreaElement, value: string) {
  let next = limitToWords(value, BRAND_BRAIN_CARD_WORD_LIMIT)
  textarea.value = next

  while (next.length > 0 && textarea.scrollHeight > textarea.clientHeight) {
    next = next.slice(0, -1)
    textarea.value = next
  }

  return next
}
