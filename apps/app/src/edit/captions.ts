export type EditCaptionCue = {
  start: number
  end: number
  text: string
}

export function parseSrt(value: string) {
  return value
    .trim()
    .split(/\n\s*\n/)
    .map(block => {
      const lines = block.split('\n').map(line => line.trim())
      const timing = lines.find(line => line.includes('-->'))
      if (!timing) return null

      const [start, end] = timing.split('-->').map(time => srtTimestampSeconds(time.trim()))
      const text = lines
        .slice(lines.indexOf(timing) + 1)
        .join(' ')
        .trim()

      if (!text || start === null || end === null || end <= start) return null

      return { start, end, text }
    })
    .filter((caption): caption is EditCaptionCue => caption !== null)
}

function srtTimestampSeconds(value: string) {
  const match = value.match(/^(\d+):(\d+):(\d+),(\d+)$/)
  if (!match) return null

  return (
    Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) + Number(match[4]) / 1000
  )
}
