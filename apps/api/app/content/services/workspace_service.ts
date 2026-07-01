import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

import BrandBrainField from '../models/brand_brain_field.ts'
import BrandBrainSection from '../models/brand_brain_section.ts'
import Idea from '../models/idea.ts'
import Video from '../models/video.ts'
import VideoEditingJob from '../models/video_editing_job.ts'
import VideoRecording from '../models/video_recording.ts'
import ScriptGeneratorService, { type VideoScript } from './script_generator_service.ts'

const scriptGenerator = new ScriptGeneratorService()

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
      scriptHook:
        'Your next customer may only trust you after the fifth post, not the first pitch.',
      scriptSpoken:
        'Posting daily is not about chasing the algorithm.\n\nIt is about giving future customers enough proof to understand how you think before they ever book a call.',
      scriptShotList:
        'Scene 1\nType: Talking head\nDuration: 3s\n\nScene 2\nType: B-roll\nShow: Founder recording a quick answer\n\nScene 3\nType: Talking head',
      scriptOnScreenText: 'Daily posts build trust\nProof beats polish',
      scriptAssetsNeeded: '- Phone camera setup\n- Example customer question\n- Posting dashboard',
      scriptRecordingNotes:
        'Tone: calm and direct\nPause after the hook\nKeep the example specific',
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
      scriptHook: 'AI is raising the floor. Taste is still the ceiling.',
      scriptSpoken:
        'AI will not replace creators who know what to keep, what to cut, and what their audience actually believes.\n\nThe draft is cheap. The judgment is not.',
      scriptShotList:
        'Scene 1\nType: Talking head\nDuration: 3s\n\nScene 2\nType: Screen recording\nShow: AI draft with edits\n\nScene 3\nType: Talking head',
      scriptOnScreenText: 'The draft is cheap\nJudgment is not',
      scriptAssetsNeeded: '- AI draft screen recording\n- Edited script example',
      scriptRecordingNotes:
        'Tone: opinionated\nPoint at the edit example\nSlow down on the last sentence',
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
      scriptHook: 'Build in public is not a diary.',
      scriptSpoken:
        'Build in public works when the lesson is useful without private context.\n\nShare the decision, the tradeoff, and the result.\n\nKeep the diary out of it.',
      scriptShotList:
        'Scene 1\nType: Talking head\nDuration: 3s\n\nScene 2\nType: B-roll\nShow: Product update draft\n\nScene 3\nType: Talking head',
      scriptOnScreenText: 'Share the lesson\nSkip the diary',
      scriptAssetsNeeded: '- Product update draft\n- Example tradeoff note',
      scriptRecordingNotes: 'Tone: practical\nPause before the last line\nKeep delivery concise',
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

    const ideas = await Idea.query().where('user_id', userId).orderBy('sort_order')

    const videos = await Video.query()
      .where('user_id', userId)
      .orderBy('sort_order')
      .preload('stages', query => query.orderBy('sort_order'))
      .preload('recordings', query => query.orderBy('sort_order'))
      .preload('editing', query => query.orderBy('sort_order'))
      .preload('editingJobs', query => query.orderBy('created_at', 'desc'))

    const brandBrain = await BrandBrainSection.query()
      .where('user_id', userId)
      .orderBy('sort_order')
      .preload('fields', query => query.orderBy('sort_order'))

    return {
      ideas: ideas.map(idea => this.serializeIdea(idea)),
      videos: videos.map(video => this.serializeVideo(video)),
      brandBrain: brandBrain.map(section => ({
        id: section.id,
        key: section.key,
        title: section.title,
        summary: section.summary,
        fields: section.fields.map(field => ({
          id: field.id,
          label: field.label,
          value: field.value,
        })),
      })),
    }
  }

  async createIdea(
    userId: string,
    payload: {
      title?: string
      note?: string
      pillar?: string
      rating?: number
      status?: string
    } = {},
  ) {
    const lastIdea = await Idea.query()
      .where('user_id', userId)
      .orderBy('sort_order', 'desc')
      .first()

    const idea = await Idea.create({
      userId,
      title: payload.title ?? 'New idea',
      pillar: payload.pillar ?? '',
      status: payload.status ?? 'Idea',
      rating: payload.rating ?? 0,
      problem: payload.note ?? '',
      hook: '',
      cta: '',
      sortOrder: (lastIdea?.sortOrder ?? -1) + 1,
    })

    return this.serializeIdea(idea)
  }

  async updateIdea(
    userId: string,
    ideaId: string,
    payload: {
      title?: string
      note?: string
      pillar?: string
      rating?: number
      status?: string
    },
  ) {
    const idea = await Idea.query().where('user_id', userId).where('id', ideaId).firstOrFail()

    if (payload.title !== undefined) idea.title = payload.title
    if (payload.note !== undefined) idea.problem = payload.note
    if (payload.pillar !== undefined) idea.pillar = payload.pillar
    if (payload.rating !== undefined) idea.rating = payload.rating
    if (payload.status !== undefined) idea.status = payload.status

    await idea.save()

    return this.serializeIdea(idea)
  }

  async generateScriptFromIdea(userId: string, ideaId: string) {
    const idea = await Idea.query()
      .where('user_id', userId)
      .where('id', ideaId)
      .preload('keyPoints', query => query.orderBy('sort_order'))
      .firstOrFail()

    const brandBrain = await BrandBrainSection.query()
      .where('user_id', userId)
      .orderBy('sort_order')
      .preload('fields', query => query.orderBy('sort_order'))

    const script = await scriptGenerator.generate({
      title: idea.title,
      idea: idea.problem || idea.title,
      problem: idea.problem,
      hook: idea.hook,
      keyPoints: idea.keyPoints.map(keyPoint => keyPoint.body),
      cta: idea.cta,
      brandContext: brandBrain
        .map(section =>
          [
            `${section.title}: ${section.summary}`,
            section.fields.map(field => `${field.label}: ${field.value}`).join('\n'),
          ].join('\n'),
        )
        .join('\n\n'),
    })

    let video = await Video.query().where('user_id', userId).where('idea_id', idea.id).first()

    if (!video) {
      const lastVideo = await Video.query()
        .where('user_id', userId)
        .orderBy('sort_order', 'desc')
        .first()

      video = await Video.create({
        userId,
        ideaId: idea.id,
        title: idea.title,
        idea: idea.problem || idea.title,
        transcript: script.spokenScript,
        preview: 'No cut yet',
        publish: 'Not scheduled',
        sortOrder: (lastVideo?.sortOrder ?? -1) + 1,
      })

      await video.related('stages').createMany([
        { label: 'Script', done: true, sortOrder: 0 },
        { label: 'Record', done: false, sortOrder: 1 },
        { label: 'Edit', done: false, sortOrder: 2 },
        { label: 'Publish', done: false, sortOrder: 3 },
      ])
      await video.related('editing').createMany([
        { label: 'Captions', done: false, sortOrder: 0 },
        { label: 'Smart cuts', done: false, sortOrder: 1 },
        { label: 'Silence removal', done: false, sortOrder: 2 },
      ])
    }

    video.title = idea.title
    video.idea = idea.problem || idea.title
    video.transcript = script.spokenScript
    this.applyScript(video, script)
    await video.save()
    await video.related('stages').query().where('label', 'Script').update({ done: true })

    return this.serializeVideo(await this.getVideo(userId, video.id))
  }

  async updateVideoScript(
    userId: string,
    videoId: string,
    payload: Partial<Pick<VideoScript, 'hook' | 'spokenScript' | 'onScreenText'>>,
  ) {
    const video = await this.getVideo(userId, videoId)
    const revision = await scriptGenerator.revise({
      script: { ...this.scriptFromVideo(video), ...payload },
      editedFields: payload,
    })

    this.applyScript(video, revision)
    video.transcript = revision.spokenScript
    await video.save()

    return { video: this.serializeVideo(video), summary: revision.summary }
  }

  async chatVideoScript(userId: string, videoId: string, message: string) {
    const video = await this.getVideo(userId, videoId)
    const revision = await scriptGenerator.revise({
      script: this.scriptFromVideo(video),
      message,
    })

    this.applyScript(video, revision)
    video.transcript = revision.spokenScript
    await video.save()

    return { video: this.serializeVideo(video), summary: revision.summary }
  }

  async createVideoRecording(
    userId: string,
    videoId: string,
    payload: {
      scriptId: string
      takeId: string
      storagePath: string
      mimeType: string
      sizeBytes: number
      durationMs: number
      trimStartMs: number
      trimEndMs: number
      startedAt: string
      stoppedAt: string
    },
  ) {
    const video = await this.getVideo(userId, videoId)
    const lastRecording = await VideoRecording.query()
      .where('video_id', video.id)
      .orderBy('sort_order', 'desc')
      .first()
    const sortOrder = (lastRecording?.sortOrder ?? -1) + 1

    const recording = await video.related('recordings').create({
      scriptId: payload.scriptId,
      takeId: payload.takeId,
      label: `Take #${sortOrder + 1} - uploaded raw`,
      storagePath: payload.storagePath,
      mimeType: payload.mimeType,
      sizeBytes: payload.sizeBytes,
      durationMs: payload.durationMs,
      trimStartMs: payload.trimStartMs,
      trimEndMs: payload.trimEndMs,
      startedAt: DateTime.fromISO(payload.startedAt),
      stoppedAt: DateTime.fromISO(payload.stoppedAt),
      sortOrder,
    })
    const editingJob = await VideoEditingJob.create({
      videoId: video.id,
      recordingId: recording.id,
      status: 'queued',
      originalPath: payload.storagePath,
    })

    video.preview = 'Auto-edit queued'
    await video.save()
    await video.related('stages').query().where('label', 'Record').update({ done: true })

    const updatedVideo = await this.getVideo(userId, video.id)

    return {
      recording: {
        id: recording.id,
        takeId: recording.takeId,
        label: recording.label,
      },
      editingJob: {
        id: editingJob.id,
        status: editingJob.status,
      },
      video: this.serializeVideo(updatedVideo),
    }
  }

  async deleteVideoRecording(userId: string, videoId: string, recordingId: string) {
    const video = await this.getVideo(userId, videoId)
    const recording = await VideoRecording.query()
      .where('video_id', video.id)
      .where('id', recordingId)
      .firstOrFail()

    await recording.delete()

    const remainingRecording = await VideoRecording.query().where('video_id', video.id).first()
    await video
      .related('stages')
      .query()
      .where('label', 'Record')
      .update({ done: Boolean(remainingRecording) })

    if (!remainingRecording) {
      video.preview = 'No cut yet'
      await video.save()
    }

    return { video: this.serializeVideo(await this.getVideo(userId, video.id)) }
  }

  async getFinalVideo(userId: string, videoId: string) {
    const video = await this.getVideo(userId, videoId)
    const editingJob = await VideoEditingJob.query()
      .where('video_id', video.id)
      .where('status', 'ready')
      .whereNotNull('final_path')
      .orderBy('created_at', 'desc')
      .firstOrFail()

    return {
      finalPath: editingJob.finalPath!,
      fileName: `${
        video.title
          .replace(/[^a-z0-9]+/gi, '-')
          .replace(/^-|-$/g, '')
          .toLowerCase() || 'video'
      }.mp4`,
    }
  }

  async updateBrandBrainField(
    userId: string,
    fieldId: string,
    payload: { label?: string | null; value: string },
  ) {
    const section = await BrandBrainSection.query()
      .where('user_id', userId)
      .whereHas('fields', query => query.where('id', fieldId))
      .preload('fields', query => query.where('id', fieldId))
      .firstOrFail()

    const field = section.fields[0]
    if (section.key === 'context' && payload.label !== undefined && payload.label !== null) {
      field.label = payload.label
    }
    field.value = payload.value
    await field.save()

    return { id: field.id, label: field.label, value: field.value }
  }

  async createBrandBrainField(
    userId: string,
    sectionId: string,
    payload: { label: string; value: string },
  ) {
    const section = await BrandBrainSection.query()
      .where('user_id', userId)
      .where('id', sectionId)
      .firstOrFail()

    if (section.key !== 'context') {
      throw new Error('Brand Brain cards can only be added to Extra Context')
    }

    const lastField = await BrandBrainField.query()
      .where('brand_brain_section_id', section.id)
      .orderBy('sort_order', 'desc')
      .first()

    const field = await section.related('fields').create({
      label: payload.label,
      value: payload.value,
      sortOrder: (lastField?.sortOrder ?? -1) + 1,
    })

    return { id: field.id, label: field.label, value: field.value }
  }

  async deleteBrandBrainField(userId: string, fieldId: string) {
    const section = await BrandBrainSection.query()
      .where('user_id', userId)
      .whereHas('fields', query => query.where('id', fieldId))
      .preload('fields', query => query.where('id', fieldId))
      .firstOrFail()

    if (section.key !== 'context') {
      throw new Error('Brand Brain cards can only be deleted from Extra Context')
    }

    const field = section.fields[0]
    await field.delete()

    return { id: field.id }
  }

  private serializeIdea(idea: Idea) {
    return {
      id: idea.id,
      title: idea.title,
      pillar: idea.pillar,
      status: idea.status,
      rating: idea.rating,
      note: idea.problem,
    }
  }

  private serializeVideo(video: Video) {
    const editingJob = video.editingJobs?.[0]

    return {
      id: video.id,
      title: video.title,
      idea: video.idea,
      transcript: video.transcript,
      script: {
        hook: video.scriptHook,
        spokenScript: video.scriptSpoken,
        shotList: video.scriptShotList,
        onScreenText: video.scriptOnScreenText,
        assetsNeeded: video.scriptAssetsNeeded,
        recordingNotes: video.scriptRecordingNotes,
      },
      recordings: video.recordings.map(recording => ({
        id: recording.id,
        label: recording.label,
        storagePath: recording.storagePath,
        takeId: recording.takeId,
        durationMs: recording.durationMs,
        createdAt: recording.createdAt.toISO(),
      })),
      editingJob: editingJob
        ? {
            id: editingJob.id,
            status: editingJob.status,
            finalPath: editingJob.finalPath,
            errorMessage: editingJob.errorMessage,
          }
        : null,
      editing: video.editing.map(task => ({ label: task.label, done: task.done })),
      preview: video.preview,
      publish: video.publish,
      stages: video.stages.map(stage => ({ label: stage.label, done: stage.done })),
    }
  }

  private scriptFromVideo(video: Video) {
    return {
      hook: video.scriptHook,
      spokenScript: video.scriptSpoken,
      shotList: video.scriptShotList,
      onScreenText: video.scriptOnScreenText,
      assetsNeeded: video.scriptAssetsNeeded,
      recordingNotes: video.scriptRecordingNotes,
    }
  }

  private applyScript(video: Video, script: VideoScript) {
    video.scriptHook = script.hook
    video.scriptSpoken = script.spokenScript
    video.scriptShotList = script.shotList
    video.scriptOnScreenText = script.onScreenText
    video.scriptAssetsNeeded = script.assetsNeeded
    video.scriptRecordingNotes = script.recordingNotes
  }

  private async getVideo(userId: string, videoId: string) {
    return await Video.query()
      .where('user_id', userId)
      .where('id', videoId)
      .preload('stages', query => query.orderBy('sort_order'))
      .preload('recordings', query => query.orderBy('sort_order'))
      .preload('editing', query => query.orderBy('sort_order'))
      .preload('editingJobs', query => query.orderBy('created_at', 'desc'))
      .firstOrFail()
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
            scriptHook: video.scriptHook,
            scriptSpoken: video.scriptSpoken,
            scriptShotList: video.scriptShotList,
            scriptOnScreenText: video.scriptOnScreenText,
            scriptAssetsNeeded: video.scriptAssetsNeeded,
            scriptRecordingNotes: video.scriptRecordingNotes,
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
