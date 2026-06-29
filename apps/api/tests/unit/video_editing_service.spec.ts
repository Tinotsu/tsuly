import { test } from '@japa/runner'

import {
  captionsFromTranscript,
  formatSrt,
  parseSilenceDetect,
} from '#app/content/services/video_editing_service'

test.group('video editing service', () => {
  test('parses ffmpeg silence ranges', ({ assert }) => {
    const output = [
      '[silencedetect @ 0x1] silence_start: 1.2',
      '[silencedetect @ 0x1] silence_end: 2.05 | silence_duration: 0.85',
      '[silencedetect @ 0x1] silence_start: 4',
      '[silencedetect @ 0x1] silence_end: 4.9 | silence_duration: 0.9',
    ].join('\n')

    assert.deepEqual(parseSilenceDetect(output), [
      { start: 1.2, end: 2.05 },
      { start: 4, end: 4.9 },
    ])
  })

  test('compresses caption timestamps after removed silences', ({ assert }) => {
    const captions = captionsFromTranscript(
      [
        {
          start: 0,
          end: 6,
          text: 'one two three four five six seven eight nine ten',
        },
      ],
      [{ start: 2, end: 3 }],
    )

    assert.deepEqual(captions, [
      { start: 0, end: 2, text: 'one two three four five six seven eight' },
      { start: 2, end: 5, text: 'nine ten' },
    ])
  })

  test('formats srt captions', ({ assert }) => {
    assert.equal(
      formatSrt([{ start: 0, end: 2.5, text: 'Hello there' }]),
      '1\n00:00:00,000 --> 00:00:02,500\nHello there\n',
    )
  })
})
