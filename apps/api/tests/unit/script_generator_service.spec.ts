import { test } from '@japa/runner'

import ScriptGeneratorService from '#app/content/services/script_generator_service'

test.group('ScriptGeneratorService', () => {
  test('generates a script from chat completion JSON', async ({ assert }) => {
    const fetchClient: typeof fetch = async (url, init) => {
      assert.equal(url, 'https://api.test/chat/completions')

      const body = JSON.parse(String(init?.body))
      assert.equal(body.model, 'script-test')
      assert.equal(body.response_format.type, 'json_object')
      assert.include(body.messages[1].content, 'Title: Faster editing')

      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  hook: 'Stop wasting hours editing shorts.',
                  spokenScript: 'Stop wasting hours editing shorts.\n\nAI edits everything.',
                  shotList: 'Scene 1\nType: Talking head',
                  onScreenText: '3 hours -> 10 minutes',
                  assetsNeeded: '- Editing timeline',
                  recordingNotes: 'Tone: energetic',
                }),
              },
            },
          ],
        }),
      )
    }

    const service = new ScriptGeneratorService(
      { apiKey: 'test-key', baseUrl: 'https://api.test', model: 'script-test' },
      fetchClient,
    )

    const script = await service.generate({
      title: 'Faster editing',
      idea: 'Show creators that AI can edit their shorts faster.',
    })

    assert.deepEqual(script, {
      hook: 'Stop wasting hours editing shorts.',
      spokenScript: 'Stop wasting hours editing shorts.\n\nAI edits everything.',
      shotList: 'Scene 1\nType: Talking head',
      onScreenText: '3 hours -> 10 minutes',
      assetsNeeded: '- Editing timeline',
      recordingNotes: 'Tone: energetic',
    })
  })

  test('fails loudly when the model omits a script field', async ({ assert }) => {
    const fetchClient: typeof fetch = async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  hook: 'Stop wasting hours editing shorts.',
                }),
              },
            },
          ],
        }),
      )

    const service = new ScriptGeneratorService(
      { apiKey: 'test-key', baseUrl: 'https://api.test', model: 'script-test' },
      fetchClient,
    )

    try {
      await service.generate({
        title: 'Faster editing',
        idea: 'Show creators that AI can edit their shorts faster.',
      })
      assert.fail('Expected script generation to fail')
    } catch (error) {
      assert.match((error as Error).message, /invalid script/)
    }
  })
})
