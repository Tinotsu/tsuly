import { test } from '@japa/runner'

import ScriptGeneratorService from '#app/content/services/script_generator_service'

const generatedScript = {
  hook: 'Hook',
  spokenScript: 'Spoken script',
  shotList: 'Shot list',
  onScreenText: 'On-screen text',
  recordingNotes: 'Recording notes',
}

test.group('script generator service', () => {
  test('sends script requests to the configured model endpoint', async ({ assert }) => {
    const requests: Array<{ url: string; body: any; authorization: string | null }> = []
    const fetchClient: typeof fetch = async (url, init) => {
      requests.push({
        url: String(url),
        body: JSON.parse(String(init?.body)),
        authorization: new Headers(init?.headers).get('Authorization'),
      })

      return new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify(generatedScript) } }],
        }),
        { status: 200 },
      )
    }

    const service = new ScriptGeneratorService(
      {
        apiKey: 'deepseek-key',
        baseUrl: 'https://api.deepseek.com/v1',
        model: 'deepseek-chat',
      },
      fetchClient,
    )

    const script = await service.generate({ title: 'Title', idea: 'Idea' })

    assert.deepEqual(script, generatedScript)
    assert.equal(requests[0].url, 'https://api.deepseek.com/v1/chat/completions')
    assert.equal(requests[0].authorization, 'Bearer deepseek-key')
    assert.equal(requests[0].body.model, 'deepseek-chat')
  })

  test('fails loudly when no script API key is configured', async ({ assert }) => {
    const service = new ScriptGeneratorService()

    await assert.rejects(
      () => service.generate({ title: 'Title', idea: 'Idea' }),
      'DEEPSEEK_API_KEY is not configured',
    )
  })
})
