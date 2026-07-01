import app from '@adonisjs/core/services/app'
import { spawn } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { HorizontalAlign, Jimp, VerticalAlign, loadFont } from 'jimp'
import { SANS_64_WHITE } from 'jimp/fonts'
import { DateTime } from 'luxon'

import env from '#start/env'

import Video from '../models/video.ts'
import VideoEditingJob from '../models/video_editing_job.ts'
import VideoRecording from '../models/video_recording.ts'

export type TranscriptSegment = {
  start: number
  end: number
  text: string
}

type WhisperTranscript = {
  text?: string
  segments?: TranscriptSegment[]
}

export type SilenceRange = {
  start: number
  end: number
}

export type CaptionCue = {
  start: number
  end: number
  text: string
}

type CaptionImage = CaptionCue & {
  path: string
}

const silenceThresholdSeconds = 0.7

export default class VideoEditingService {
  async process(editingJobId: string) {
    const editingJob = await VideoEditingJob.findOrFail(editingJobId)
    const video = await Video.findOrFail(editingJob.videoId)
    const recording = await VideoRecording.findOrFail(editingJob.recordingId)
    const outputPublicDir = `uploads/edits/${editingJob.id}`
    const outputDir = app.publicPath(outputPublicDir)

    await mkdir(outputDir, { recursive: true })

    editingJob.status = 'processing'
    editingJob.startedAt = DateTime.now()
    editingJob.errorMessage = null
    await editingJob.save()

    try {
      const originalPath = app.publicPath(editingJob.originalPath.replace(/^\/+/, ''))
      const normalizedPath = join(outputDir, 'normalized.mp4')
      const audioPath = join(outputDir, 'audio.wav')
      const transcriptPath = join(outputDir, 'transcript.json')
      const silencePath = join(outputDir, 'silences.json')
      const captionsPath = join(outputDir, 'captions.srt')
      const finalPath = join(outputDir, 'final.mp4')

      await this.normalizeVideo(originalPath, normalizedPath, recording)
      editingJob.normalizedPath = `/${outputPublicDir}/normalized.mp4`
      await editingJob.save()

      await this.extractAudio(normalizedPath, audioPath)
      editingJob.audioPath = `/${outputPublicDir}/audio.wav`
      await editingJob.save()

      const transcript = await this.transcribeAudio(audioPath)
      await writeFile(transcriptPath, JSON.stringify(transcript, null, 2))
      editingJob.transcriptPath = `/${outputPublicDir}/transcript.json`
      await editingJob.save()

      const silences = await this.detectSilences(audioPath)
      await writeFile(silencePath, JSON.stringify(silences, null, 2))

      const captions = captionsFromTranscript(transcript.segments ?? [], silences)
      await writeFile(captionsPath, formatSrt(captions))
      editingJob.captionsPath = `/${outputPublicDir}/captions.srt`
      await editingJob.save()

      const captionImages = await createCaptionImages(captions, outputDir)
      await this.renderFinal(normalizedPath, finalPath, silences, captionImages)

      editingJob.finalPath = `/${outputPublicDir}/final.mp4`
      editingJob.status = 'ready'
      editingJob.finishedAt = DateTime.now()
      await editingJob.save()

      video.preview = 'Ready for validation'
      await video.save()
      await video
        .related('editing')
        .query()
        .whereIn('label', ['Captions', 'Smart cuts', 'Silence removal'])
        .update({ done: true })
    } catch (error) {
      editingJob.status = 'failed'
      editingJob.errorMessage = error instanceof Error ? error.message : String(error)
      editingJob.finishedAt = DateTime.now()
      await editingJob.save()

      video.preview = 'Auto-edit failed'
      await video.save()

      throw error
    }
  }

  private async normalizeVideo(inputPath: string, outputPath: string, recording: VideoRecording) {
    const trimStartSeconds = (recording.trimStartMs ?? 0) / 1000
    const trimEndSeconds = recording.trimEndMs ? recording.trimEndMs / 1000 : null
    const durationSeconds = trimEndSeconds ? trimEndSeconds - trimStartSeconds : null
    const seekArgs = trimStartSeconds > 0 ? ['-ss', String(trimStartSeconds)] : []
    const durationArgs =
      durationSeconds && durationSeconds > 0 ? ['-t', String(durationSeconds)] : []

    await runCommand(ffmpegPath(), [
      '-y',
      ...seekArgs,
      '-i',
      inputPath,
      ...durationArgs,
      '-vf',
      'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1',
      '-r',
      '30',
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-crf',
      '23',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-movflags',
      '+faststart',
      outputPath,
    ])
  }

  private async extractAudio(inputPath: string, outputPath: string) {
    await runCommand(ffmpegPath(), [
      '-y',
      '-i',
      inputPath,
      '-vn',
      '-ac',
      '1',
      '-ar',
      '16000',
      '-c:a',
      'pcm_s16le',
      outputPath,
    ])
  }

  private async transcribeAudio(audioPath: string) {
    const apiKey = env.get('OPENAI_API_KEY')
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured')
    }

    const formData = new FormData()
    formData.append(
      'file',
      new Blob([await readFile(audioPath)], { type: 'audio/wav' }),
      'audio.wav',
    )
    formData.append('model', env.get('WHISPER_MODEL') ?? 'whisper-1')
    formData.append('response_format', 'verbose_json')
    formData.append('timestamp_granularities[]', 'segment')

    const response = await fetch(
      `${(env.get('OPENAI_AUDIO_BASE_URL') ?? 'https://api.openai.com/v1').replace(/\/$/, '')}/audio/transcriptions`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: formData,
      },
    )

    if (!response.ok) {
      throw new Error(`Audio transcription failed: ${await response.text()}`)
    }

    return (await response.json()) as WhisperTranscript
  }

  private async detectSilences(audioPath: string) {
    const result = await runCommand(ffmpegPath(), [
      '-hide_banner',
      '-i',
      audioPath,
      '-af',
      `silencedetect=noise=-35dB:d=${silenceThresholdSeconds}`,
      '-f',
      'null',
      '-',
    ])

    return parseSilenceDetect(result.stderr)
  }

  private async renderFinal(
    inputPath: string,
    outputPath: string,
    silences: SilenceRange[],
    captionImages: CaptionImage[],
  ) {
    const videoFilters = [
      'scale=1080:1920:force_original_aspect_ratio=increase',
      'crop=1080:1920',
      'setsar=1',
    ]

    if (silences.length === 0 && captionImages.length === 0) {
      await runCommand(ffmpegPath(), [
        '-y',
        '-i',
        inputPath,
        '-vf',
        videoFilters.join(','),
        '-r',
        '30',
        '-c:v',
        'libx264',
        '-preset',
        'veryfast',
        '-crf',
        '23',
        '-c:a',
        'aac',
        '-b:a',
        '128k',
        '-movflags',
        '+faststart',
        outputPath,
      ])
      return
    }

    const inputArgs = captionImages.flatMap(caption => ['-loop', '1', '-i', caption.path])
    const filterParts: string[] = []
    let audioMap = '0:a'

    if (silences.length > 0) {
      const keepExpression = keepExpressionForSilences(silences)
      filterParts.push(
        `[0:v]select='${keepExpression}',setpts=N/FRAME_RATE/TB,${videoFilters.join(',')}[v0]`,
        `[0:a]aselect='${keepExpression}',asetpts=N/SR/TB[a]`,
      )
      audioMap = '[a]'
    } else {
      filterParts.push(`[0:v]${videoFilters.join(',')}[v0]`)
    }

    let videoMap = 'v0'
    for (const [index, caption] of captionImages.entries()) {
      const nextVideoMap = index === captionImages.length - 1 ? 'v' : `v${index + 1}`
      filterParts.push(
        `[${videoMap}][${index + 1}:v]overlay=0:H-h-170:enable='between(t\\,${caption.start.toFixed(3)}\\,${caption.end.toFixed(3)})'[${nextVideoMap}]`,
      )
      videoMap = nextVideoMap
    }

    await runCommand(ffmpegPath(), [
      '-y',
      '-i',
      inputPath,
      ...inputArgs,
      '-filter_complex',
      filterParts.join(';'),
      '-map',
      `[${videoMap}]`,
      '-map',
      audioMap,
      '-r',
      '30',
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-crf',
      '23',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-movflags',
      '+faststart',
      '-shortest',
      outputPath,
    ])
  }
}

export function parseSilenceDetect(output: string) {
  const silences: SilenceRange[] = []
  let silenceStart: number | null = null

  for (const line of output.split('\n')) {
    const start = line.match(/silence_start:\s*([0-9.]+)/)
    if (start) {
      silenceStart = Number(start[1])
      continue
    }

    const end = line.match(/silence_end:\s*([0-9.]+)\s*\|\s*silence_duration:\s*([0-9.]+)/)
    if (!end) continue

    const endSeconds = Number(end[1])
    const durationSeconds = Number(end[2])
    silences.push({
      start: silenceStart ?? endSeconds - durationSeconds,
      end: endSeconds,
    })
    silenceStart = null
  }

  return silences.filter(silence => silence.end > silence.start)
}

export function captionsFromTranscript(segments: TranscriptSegment[], silences: SilenceRange[]) {
  const captions: CaptionCue[] = []

  for (const segment of segments) {
    const words = segment.text.trim().split(/\s+/).filter(Boolean)
    const chunkCount = Math.max(1, Math.ceil(words.length / 8))

    for (let index = 0; index < chunkCount; index += 1) {
      const chunkStart = segment.start + ((segment.end - segment.start) * index) / chunkCount
      const chunkEnd = segment.start + ((segment.end - segment.start) * (index + 1)) / chunkCount
      const text = words.slice(index * 8, (index + 1) * 8).join(' ')
      const start = chunkStart - removedSecondsAt(chunkStart, silences)
      const end = chunkEnd - removedSecondsAt(chunkEnd, silences)

      if (text && end - start > 0.05) {
        captions.push({ start, end, text })
      }
    }
  }

  return captions
}

export function formatSrt(captions: CaptionCue[]) {
  return captions
    .map(
      (caption, index) =>
        `${index + 1}\n${formatSrtTimestamp(caption.start)} --> ${formatSrtTimestamp(caption.end)}\n${caption.text}\n`,
    )
    .join('\n')
}

async function createCaptionImages(captions: CaptionCue[], outputDir: string) {
  const font = await loadFont(SANS_64_WHITE)
  const images: CaptionImage[] = []

  for (const [index, caption] of captions.entries()) {
    const path = join(outputDir, `caption-${index + 1}.png`) as `${string}.png`
    const image = new Jimp({ width: 1080, height: 260, color: 0x00000000 })
    const box = new Jimp({ width: 940, height: 180, color: 0x000000aa })

    image.composite(box, 70, 40)
    image.print({
      font,
      x: 110,
      y: 58,
      text: {
        text: caption.text,
        alignmentX: HorizontalAlign.CENTER,
        alignmentY: VerticalAlign.MIDDLE,
      },
      maxWidth: 860,
      maxHeight: 140,
    })

    await image.write(path)
    images.push({ ...caption, path })
  }

  return images
}

function removedSecondsAt(time: number, silences: SilenceRange[]) {
  let removedSeconds = 0

  for (const silence of silences) {
    if (time <= silence.start) continue
    removedSeconds += Math.min(time, silence.end) - silence.start
  }

  return removedSeconds
}

function formatSrtTimestamp(seconds: number) {
  const totalMilliseconds = Math.round(Math.max(0, seconds) * 1000)
  const hours = Math.floor(totalMilliseconds / 3_600_000)
  const minutes = Math.floor((totalMilliseconds % 3_600_000) / 60_000)
  const wholeSeconds = Math.floor((totalMilliseconds % 60_000) / 1000)
  const milliseconds = totalMilliseconds % 1000

  return (
    [
      String(hours).padStart(2, '0'),
      String(minutes).padStart(2, '0'),
      String(wholeSeconds).padStart(2, '0'),
    ].join(':') + `,${String(milliseconds).padStart(3, '0')}`
  )
}

function keepExpressionForSilences(silences: SilenceRange[]) {
  return `not(${silences
    .map(silence => `between(t\\,${silence.start.toFixed(3)}\\,${silence.end.toFixed(3)})`)
    .join('+')})`
}

function ffmpegPath() {
  return env.get('FFMPEG_PATH') ?? 'ffmpeg'
}

async function runCommand(command: string, args: string[]) {
  return await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(command, args)
    let stdout = ''
    let stderr = ''

    child.stdout.on('data', chunk => {
      stdout += String(chunk)
    })
    child.stderr.on('data', chunk => {
      stderr += String(chunk)
    })
    child.on('error', reject)
    child.on('close', code => {
      if (code === 0) {
        resolve({ stdout, stderr })
        return
      }

      reject(new Error(`${command} exited with code ${code}\n${stderr}`))
    })
  })
}
