import { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import { createReadStream } from 'node:fs'

import WorkspaceService from '../services/workspace_service.ts'
import {
  chatVideoScriptValidator,
  createBrandBrainFieldValidator,
  createIdeaValidator,
  createVideoValidator,
  createVideoRecordingValidator,
  updateVideoEditingSettingsValidator,
  updateBrandBrainFieldValidator,
  updateIdeaValidator,
  updateVideoScriptValidator,
} from '../validators/workspace.ts'

const workspaceService = new WorkspaceService()

export default class WorkspaceController {
  async show({ auth, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const workspace = await workspaceService.getWorkspace(user.id)

    return await serialize.withoutWrapping(workspace)
  }

  async googleFonts({ serialize }: HttpContext) {
    const response = await fetch('https://fonts.google.com/metadata/fonts')

    if (!response.ok) {
      throw new Error('Could not load Google Fonts')
    }

    const data = (await response.json()) as {
      familyMetadataList?: Array<{ family?: string }>
    }
    const fonts = (data.familyMetadataList ?? [])
      .map(font => font.family)
      .filter((family): family is string => typeof family === 'string')

    return await serialize.withoutWrapping({ fonts })
  }

  async updateBrandBrainField({ auth, params, request, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(updateBrandBrainFieldValidator)
    const field = await workspaceService.updateBrandBrainField(user.id, params.id, payload)

    return await serialize.withoutWrapping(field)
  }

  async createBrandBrainField({ auth, params, request, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createBrandBrainFieldValidator)
    const field = await workspaceService.createBrandBrainField(user.id, params.sectionId, payload)

    return await serialize.withoutWrapping(field)
  }

  async deleteBrandBrainField({ auth, params, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const result = await workspaceService.deleteBrandBrainField(user.id, params.id)

    return await serialize.withoutWrapping(result)
  }

  async createIdea({ auth, request, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createIdeaValidator)
    const idea = await workspaceService.createIdea(user.id, payload)

    return await serialize.withoutWrapping(idea)
  }

  async updateIdea({ auth, params, request, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(updateIdeaValidator)
    const idea = await workspaceService.updateIdea(user.id, params.id, payload)

    return await serialize.withoutWrapping(idea)
  }

  async deleteIdea({ auth, params, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const result = await workspaceService.deleteIdea(user.id, params.id)

    return await serialize.withoutWrapping(result)
  }

  async generateScriptFromIdea({ auth, params, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const video = await workspaceService.generateScriptFromIdea(user.id, params.id)

    return await serialize.withoutWrapping(video)
  }

  async createVideo({ auth, request, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createVideoValidator)
    const video = await workspaceService.createVideo(user.id, payload)

    return await serialize.withoutWrapping(video)
  }

  async deleteVideo({ auth, params, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const result = await workspaceService.deleteVideo(user.id, params.id)

    return await serialize.withoutWrapping(result)
  }

  async updateVideoScript({ auth, params, request, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(updateVideoScriptValidator)
    const result = await workspaceService.updateVideoScript(user.id, params.id, payload)

    return await serialize.withoutWrapping(result)
  }

  async chatVideoScript({ auth, params, request, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(chatVideoScriptValidator)
    const result = await workspaceService.chatVideoScript(user.id, params.id, payload.message)

    return await serialize.withoutWrapping(result)
  }

  async uploadRecording({ auth, params, request, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createVideoRecordingValidator)
    const video = request.file('video', {
      size: '500mb',
      extnames: ['mp4', 'webm', 'mov', 'm4v'],
    })

    if (!video || !video.isValid) {
      return response.badRequest({
        message: 'Recording upload failed',
        errors: video?.errors ?? [],
      })
    }

    const durationMs = Number(payload.durationMs)
    const trimStartMs = Number(payload.trimStartMs ?? '0')
    const trimEndMs = Number(payload.trimEndMs ?? payload.durationMs)

    if (
      !Number.isFinite(durationMs) ||
      !Number.isFinite(trimStartMs) ||
      !Number.isFinite(trimEndMs) ||
      trimStartMs < 0 ||
      trimEndMs <= trimStartMs
    ) {
      return response.unprocessableEntity({ message: 'Invalid recording timing' })
    }

    const extension = video.extname ?? 'webm'
    const fileName = `${payload.takeId}.${extension}`
    await video.move(app.publicPath('uploads/recordings'), {
      name: fileName,
      overwrite: true,
    })

    const result = await workspaceService.createVideoRecording(user.id, params.id, {
      scriptId: payload.scriptId,
      takeId: payload.takeId,
      storagePath: `/uploads/recordings/${fileName}`,
      mimeType: video.type && video.subtype ? `${video.type}/${video.subtype}` : 'video/webm',
      sizeBytes: video.size,
      durationMs,
      trimStartMs,
      trimEndMs,
      startedAt: payload.startedAt,
      stoppedAt: payload.stoppedAt,
    })

    return await serialize.withoutWrapping(result)
  }

  async updateVideoEditingSettings({ auth, params, request, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(updateVideoEditingSettingsValidator)

    if (
      payload.trimStartMs !== undefined &&
      payload.trimEndMs !== undefined &&
      payload.trimEndMs <= payload.trimStartMs
    ) {
      return response.unprocessableEntity({ message: 'Invalid recording timing' })
    }

    const video = await workspaceService.updateVideoEditingSettings(user.id, params.id, payload)

    return await serialize.withoutWrapping(video)
  }

  async startVideoEditingJob({ auth, params, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const video = await workspaceService.startVideoEditingJob(user.id, params.id)

    return await serialize.withoutWrapping(video)
  }

  async deleteRecording({ auth, params, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const result = await workspaceService.deleteVideoRecording(
      user.id,
      params.videoId,
      params.recordingId,
    )

    return await serialize.withoutWrapping(result)
  }

  async downloadFinalVideo({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const result = await workspaceService.getFinalVideo(user.id, params.id)
    const filePath = app.publicPath(result.finalPath.replace(/^\/+/, ''))

    response.header('Content-Type', 'video/mp4')
    response.header('Content-Disposition', `attachment; filename="${result.fileName}"`)

    return response.stream(createReadStream(filePath))
  }
}
