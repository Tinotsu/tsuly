import env from '#start/env'

export type VideoScript = {
  hook: string
  spokenScript: string
  shotList: string
  onScreenText: string
  assetsNeeded: string
  recordingNotes: string
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
          'You write short-form creator scripts. Return only JSON with string keys: hook, spokenScript, shotList, onScreenText, assetsNeeded, recordingNotes.',
      },
      {
        role: 'user',
        content: [
          'Generate a short-form video script from this idea.',
          'Hook must be the first 2-3 seconds.',
          'spokenScript is exactly what the creator reads.',
          'shotList is optional visuals/B-roll, but include useful scenes when relevant.',
          'onScreenText is the text appearing in the video.',
          'assetsNeeded is what the creator must capture.',
          'recordingNotes are delivery notes, not part of the script.',
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
            'You revise short-form creator scripts. Return only JSON with string keys: hook, spokenScript, shotList, onScreenText, assetsNeeded, recordingNotes, summary.',
        },
        {
          role: 'user',
          content: [
            'Revise this script. Keep unchanged sections unless they need to change for consistency.',
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
    const { apiKey, baseUrl, model } = this.openAiConfig()
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
      hook: parsed.hook,
      spokenScript: parsed.spokenScript,
      shotList: parsed.shotList,
      onScreenText: parsed.onScreenText,
      assetsNeeded: parsed.assetsNeeded,
      recordingNotes: parsed.recordingNotes,
    }

    for (const value of Object.values(script)) {
      if (typeof value !== 'string') {
        throw new Error('Script generation returned an invalid script')
      }
    }

    if (includeSummary) {
      if (typeof parsed.summary !== 'string') {
        throw new Error('Script revision returned no summary')
      }
      return { ...script, summary: parsed.summary }
    }

    return script
  }

  private openAiConfig() {
    const apiKey = this.config.apiKey ?? env.get('OPENAI_API_KEY') ?? env.get('DEEPSEEK_API_KEY')
    const usingDeepSeek =
      !this.config.apiKey && !env.get('OPENAI_API_KEY') && env.get('DEEPSEEK_API_KEY')

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured')
    }

    return {
      apiKey,
      baseUrl:
        this.config.baseUrl ??
        env.get('OPENAI_BASE_URL') ??
        (usingDeepSeek ? 'https://api.deepseek.com/v1' : 'https://api.openai.com/v1'),
      model:
        this.config.model ??
        env.get('OPENAI_MODEL') ??
        (usingDeepSeek ? 'deepseek-chat' : 'gpt-4o-mini'),
    }
  }
}
