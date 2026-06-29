import db from '@adonisjs/lucid/services/db'

import BrandBrainSection from '../models/brand_brain_section.ts'
import Idea from '../models/idea.ts'
import Video from '../models/video.ts'

const defaultWorkspace = {
  ideas: [
    {
      key: 'daily-post',
      title: 'Why founders should post daily',
      pillar: 'Education',
      status: 'Ready',
      rating: 3,
      problem: 'Founders know posting matters, but every session starts with a blank page.',
      hook: 'Your next customer may only trust you after the fifth post, not the first pitch.',
      keyPoints: [
        'Daily posts create proof that the company is alive.',
        'Short lessons compound into a searchable point of view.',
        'A small repeatable format beats occasional polished essays.',
      ],
      cta: 'Pick one customer question and record a 60 second answer today.',
    },
    {
      key: 'mistakes',
      title: 'Three content mistakes killing reach',
      pillar: 'Opinion',
      status: 'Scripted',
      rating: 5,
      problem: 'Creators copy formats without knowing why the format worked.',
      hook: 'Most low-performing founder videos fail before the first sentence ends.',
      keyPoints: [
        'The opening names a topic instead of a tension.',
        'The middle lists ideas without a concrete example.',
        'The CTA asks for attention before earning trust.',
      ],
      cta: 'Rewrite one weak hook around a specific mistake.',
    },
    {
      key: 'ai-future',
      title: 'AI will not replace creators with taste',
      pillar: 'Trend',
      status: 'Idea',
      rating: 2,
      problem: 'AI tools make content easier to produce and harder to make memorable.',
      hook: 'AI is raising the floor. Taste is still the ceiling.',
      keyPoints: [
        'Generated drafts need a strong point of view.',
        'Audience trust comes from judgment, not volume.',
        'Creators win by using AI for speed and human taste for selection.',
      ],
      cta: 'Show one AI draft and the edits that made it sound like you.',
    },
    {
      key: 'founder-story',
      title: 'Founder-led storytelling beats polished ads',
      pillar: 'Story',
      status: 'Ready',
      rating: 4,
      problem: 'Early teams hide behind generic product messaging.',
      hook: 'A founder explaining the problem can outperform an ad with perfect lighting.',
      keyPoints: [
        'Founder stories carry context customers cannot get from a landing page.',
        'Specific moments make the product feel necessary.',
        'Rough but clear beats polished and forgettable.',
      ],
      cta: 'Record the moment you realized this problem was worth solving.',
    },
  ],
  videos: [
    {
      ideaKey: 'daily-post',
      title: 'Why founders should post daily',
      idea: 'Turn daily posting into a simple trust-building habit for founder-led teams.',
      transcript:
        'Posting daily is not about chasing the algorithm. It is about giving future customers enough proof to understand how you think before they ever book a call.',
      recordings: ['Take #1 - strongest opening', 'Take #2 - cleaner ending'],
      editing: [
        { label: 'Captions', done: true },
        { label: 'Smart cuts', done: true },
        { label: 'Silence removal', done: true },
      ],
      preview: 'Approved 9:16 cut, 54 seconds',
      publish: 'Queued for LinkedIn, TikTok, and YouTube Shorts',
      stages: [
        { label: 'Script', done: true },
        { label: 'Record', done: true },
        { label: 'Edit', done: true },
        { label: 'Publish', done: true },
      ],
    },
    {
      ideaKey: 'ai-future',
      title: "AI won't replace creators",
      idea: 'Explain why judgment and taste become more valuable as AI makes drafts cheaper.',
      transcript:
        'AI will not replace creators who know what to keep, what to cut, and what their audience actually believes. The draft is cheap. The judgment is not.',
      recordings: ['Take #1 - calmer delivery', 'Take #2 - better CTA'],
      editing: [
        { label: 'Captions', done: true },
        { label: 'Smart cuts', done: true },
        { label: 'Silence removal', done: true },
      ],
      preview: 'Waiting for validation',
      publish: 'Not scheduled',
      stages: [
        { label: 'Script', done: true },
        { label: 'Record', done: false },
        { label: 'Edit', done: false },
        { label: 'Publish', done: false },
      ],
    },
    {
      ideaKey: null,
      title: 'Build in public without oversharing',
      idea: 'Give founders a practical line between useful transparency and noisy updates.',
      transcript:
        'Build in public works when the lesson is useful without private context. Share the decision, the tradeoff, and the result. Keep the diary out of it.',
      recordings: [],
      editing: [
        { label: 'Captions', done: false },
        { label: 'Smart cuts', done: false },
        { label: 'Silence removal', done: false },
      ],
      preview: 'No cut yet',
      publish: 'Not scheduled',
      stages: [
        { label: 'Script', done: false },
        { label: 'Record', done: false },
        { label: 'Edit', done: false },
        { label: 'Publish', done: false },
      ],
    },
  ],
  brandBrain: [
    {
      key: 'me',
      title: 'Me',
      summary: 'Founder-led content with direct, useful teaching.',
      fields: [
        { label: 'Role', value: 'Founder building Tsuly for solo creators and small teams.' },
        {
          label: 'Credibility',
          value: 'Built content systems, shipped SaaS, and posted in public.',
        },
        { label: 'Boundaries', value: 'No hustle theater. No generic growth hacks.' },
      ],
    },
    {
      key: 'icp',
      title: 'ICP',
      summary: 'Founders and creators who need content output without a production team.',
      fields: [
        { label: 'Target audience', value: 'B2B founders, consultants, and expert creators.' },
        { label: 'Pain points', value: 'Inconsistent ideas, slow scripting, awkward recording.' },
        { label: 'Goals', value: 'Publish consistently and turn expertise into trust.' },
        {
          label: 'Objections',
          value: 'They worry automation will make their voice sound generic.',
        },
        {
          label: 'Vocabulary',
          value: 'Founder-led, trust, proof, point of view, repeatable format.',
        },
        { label: 'AI notes', value: 'Prefer practical prompts, strong hooks, and concise edits.' },
      ],
    },
    {
      key: 'product',
      title: 'Product',
      summary: 'A five-minute workflow from idea to posted short-form video.',
      fields: [
        { label: 'Promise', value: 'Film, validate, and publish without managing five tools.' },
        {
          label: 'Workflow',
          value: 'Ideation, scripting, recording, editing, validation, publishing.',
        },
        { label: 'Proof', value: 'Built around the actual steps creators repeat every week.' },
      ],
    },
    {
      key: 'website',
      title: 'Website',
      summary: 'Tsuly.com explains the daily workflow and conversion path.',
      fields: [
        { label: 'Primary offer', value: 'Build your brand in five minutes a day.' },
        { label: 'Main CTA', value: 'Start creating from a guided idea and script.' },
        { label: 'Pages', value: 'Home, pricing, dashboard, auth, and billing portal.' },
      ],
    },
    {
      key: 'voice',
      title: 'Voice',
      summary: 'Clear, practical, opinionated, and calm.',
      fields: [
        { label: 'Tone', value: 'Direct, useful, and specific.' },
        { label: 'Avoid', value: 'Buzzwords, hype, guilt, and vague motivation.' },
        { label: 'Cadence', value: 'Short sentences with one concrete example per point.' },
      ],
    },
    {
      key: 'competitors',
      title: 'Competitors',
      summary: 'Video editors, AI writing tools, schedulers, and creator CRMs.',
      fields: [
        {
          label: 'Alternatives',
          value: 'CapCut, Descript, Buffer, Notion templates, generic AI chat.',
        },
        { label: 'Positioning', value: 'Tsuly owns the complete founder video workflow.' },
        { label: 'Difference', value: 'Brand context and workflow execution stay in one place.' },
      ],
    },
    {
      key: 'context',
      title: 'Extra Context',
      summary: 'Reusable notes for generation and editing decisions.',
      fields: [
        { label: 'Content pillars', value: 'Education, opinion, trend, and story.' },
        { label: 'Strong formats', value: 'Mistake lists, before-after edits, founder stories.' },
        { label: 'Do not say', value: 'Passive income, viral hack, effortless growth.' },
      ],
    },
  ],
} as const

export default class WorkspaceService {
  async getWorkspace(userId: string) {
    const firstIdea = await Idea.query().where('user_id', userId).first()

    if (!firstIdea) {
      await this.createDefaultWorkspace(userId)
    }

    const ideas = await Idea.query()
      .where('user_id', userId)
      .orderBy('sort_order')
      .preload('keyPoints', query => query.orderBy('sort_order'))

    const videos = await Video.query()
      .where('user_id', userId)
      .orderBy('sort_order')
      .preload('stages', query => query.orderBy('sort_order'))
      .preload('recordings', query => query.orderBy('sort_order'))
      .preload('editing', query => query.orderBy('sort_order'))

    const brandBrain = await BrandBrainSection.query()
      .where('user_id', userId)
      .orderBy('sort_order')
      .preload('fields', query => query.orderBy('sort_order'))

    return {
      ideas: ideas.map(idea => ({
        id: idea.id,
        title: idea.title,
        pillar: idea.pillar,
        status: idea.status,
        rating: idea.rating,
        problem: idea.problem,
        hook: idea.hook,
        keyPoints: idea.keyPoints.map(point => point.body),
        cta: idea.cta,
      })),
      videos: videos.map(video => ({
        id: video.id,
        title: video.title,
        idea: video.idea,
        transcript: video.transcript,
        recordings: video.recordings.map(recording => recording.label),
        editing: video.editing.map(task => ({ label: task.label, done: task.done })),
        preview: video.preview,
        publish: video.publish,
        stages: video.stages.map(stage => ({ label: stage.label, done: stage.done })),
      })),
      brandBrain: brandBrain.map(section => ({
        id: section.id,
        key: section.key,
        title: section.title,
        summary: section.summary,
        fields: section.fields.map(field => ({ label: field.label, value: field.value })),
      })),
    }
  }

  private async createDefaultWorkspace(userId: string) {
    await db.transaction(async trx => {
      const ideas = new Map<string, Idea>()

      for (const [index, idea] of defaultWorkspace.ideas.entries()) {
        const createdIdea = await Idea.create(
          {
            userId,
            title: idea.title,
            pillar: idea.pillar,
            status: idea.status,
            rating: idea.rating,
            problem: idea.problem,
            hook: idea.hook,
            cta: idea.cta,
            sortOrder: index,
          },
          { client: trx },
        )

        await createdIdea.related('keyPoints').createMany(
          idea.keyPoints.map((body, keyPointIndex) => ({
            body,
            sortOrder: keyPointIndex,
          })),
          { client: trx },
        )
        ideas.set(idea.key, createdIdea)
      }

      for (const [index, video] of defaultWorkspace.videos.entries()) {
        const createdVideo = await Video.create(
          {
            userId,
            ideaId: video.ideaKey ? (ideas.get(video.ideaKey)?.id ?? null) : null,
            title: video.title,
            idea: video.idea,
            transcript: video.transcript,
            preview: video.preview,
            publish: video.publish,
            sortOrder: index,
          },
          { client: trx },
        )

        await createdVideo.related('stages').createMany(
          video.stages.map((stage, stageIndex) => ({
            label: stage.label,
            done: stage.done,
            sortOrder: stageIndex,
          })),
          { client: trx },
        )
        await createdVideo.related('recordings').createMany(
          video.recordings.map((label, recordingIndex) => ({
            label,
            sortOrder: recordingIndex,
          })),
          { client: trx },
        )
        await createdVideo.related('editing').createMany(
          video.editing.map((task, taskIndex) => ({
            label: task.label,
            done: task.done,
            sortOrder: taskIndex,
          })),
          { client: trx },
        )
      }

      for (const [index, section] of defaultWorkspace.brandBrain.entries()) {
        const createdSection = await BrandBrainSection.create(
          {
            userId,
            key: section.key,
            title: section.title,
            summary: section.summary,
            sortOrder: index,
          },
          { client: trx },
        )

        await createdSection.related('fields').createMany(
          section.fields.map((field, fieldIndex) => ({
            label: field.label,
            value: field.value,
            sortOrder: fieldIndex,
          })),
          { client: trx },
        )
      }
    })
  }
}
