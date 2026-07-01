import env from '#start/env'

export type VideoScript = {
  hook: string
  spokenScript: string
  onScreenText: string
}

type ScriptGeneratorConfig = {
  apiKey?: string
  baseUrl?: string
  model?: string
}

type ScriptPromptInput = {
  title: string
  idea: string
  problem?: string
  hook?: string
  keyPoints?: string[]
  cta?: string
  brandContext?: string
}

type ScriptRevisionInput = {
  script: VideoScript
  message?: string
  editedFields?: Partial<Pick<VideoScript, 'hook' | 'spokenScript' | 'onScreenText'>>
}

export default class ScriptGeneratorService {
  constructor(
    private config: ScriptGeneratorConfig = {},
    private fetchClient: typeof fetch = fetch,
  ) {}

  async generate(input: ScriptPromptInput) {
    return await this.completeScript([
      {
        role: 'system',
        content:
          'You write short-form creator scripts. Return only JSON with string keys: hook, spokenScript, onScreenText.',
      },
      {
        role: 'user',
        content: [
          'Generate a short-form video script from this idea.',
          'Every JSON value must be a string. For lists, use one newline-separated string, not an array.',
          'Hook must be the first 2-3 seconds.',
          'spokenScript is exactly what the creator reads.',
          'onScreenText is the text appearing in the video.',
          '',
          `Title: ${input.title}`,
          `Idea: ${input.idea}`,
          input.problem ? `Problem: ${input.problem}` : '',
          input.hook ? `Existing hook: ${input.hook}` : '',
          input.keyPoints?.length ? `Key points:\n- ${input.keyPoints.join('\n- ')}` : '',
          input.cta ? `CTA: ${input.cta}` : '',
          input.brandContext ? `Brand context:\n${input.brandContext}` : '',
        ]
          .filter(Boolean)
          .join('\n'),
      },
    ])
  }

  async revise(input: ScriptRevisionInput) {
    const revision = await this.completeScript(
      [
        {
          role: 'system',
          content:
            'You revise short-form creator scripts. Return only JSON with string keys: hook, spokenScript, onScreenText, summary.',
        },
        {
          role: 'user',
          content: [
            'Revise this script. Keep unchanged sections unless they need to change for consistency.',
            'Every JSON value must be a string. For lists, use one newline-separated string, not an array.',
            input.message ? `Creator request: ${input.message}` : '',
            input.editedFields
              ? `Creator edited these fields:\n${JSON.stringify(input.editedFields, null, 2)}`
              : '',
            `Current script:\n${JSON.stringify(input.script, null, 2)}`,
          ]
            .filter(Boolean)
            .join('\n\n'),
        },
      ],
      true,
    )

    return revision as VideoScript & { summary: string }
  }

  private async completeScript(
    messages: Array<{ role: 'system' | 'user'; content: string }>,
    includeSummary = false,
  ) {
    const { apiKey, baseUrl, model } = this.scriptConfig()
    const response = await this.fetchClient(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      throw new Error(`Script generation failed: ${await response.text()}`)
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: unknown } }>
    }
    const content = data.choices?.[0]?.message?.content
    if (typeof content !== 'string') {
      throw new Error('Script generation returned no content')
    }

    return this.parseScript(content, includeSummary)
  }

  private parseScript(content: string, includeSummary: boolean) {
    const parsed = JSON.parse(
      content
        .replace(/^```json\s*/i, '')
        .replace(/```$/u, '')
        .trim(),
    )
    const script = {
      hook: this.scriptSectionToText(parsed.hook),
      spokenScript: this.scriptSectionToText(parsed.spokenScript),
      onScreenText: this.scriptSectionToText(parsed.onScreenText),
    }

    for (const value of Object.values(script)) {
      if (!value) {
        throw new Error('Script generation returned an invalid script')
      }
    }

    if (includeSummary) {
      const summary = this.scriptSectionToText(parsed.summary) || 'Updated the script.'
      return { ...script, summary }
    }

    return script
  }

  private scriptSectionToText(value: unknown) {
    if (typeof value === 'string') return value
    if (Array.isArray(value)) {
      return value.map(item => (typeof item === 'string' ? item : JSON.stringify(item))).join('\n')
    }
    return ''
  }

  private scriptConfig() {
    const apiKey = this.config.apiKey ?? env.get('DEEPSEEK_API_KEY')

    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY is not configured')
    }

    return {
      apiKey,
      baseUrl: this.config.baseUrl ?? env.get('DEEPSEEK_BASE_URL') ?? 'https://api.deepseek.com/v1',
      model: this.config.model ?? env.get('DEEPSEEK_MODEL') ?? 'deepseek-chat',
    }
  }
}
