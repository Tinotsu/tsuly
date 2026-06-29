import { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'

import WorkspaceService from '../services/workspace_service.ts'
import {
  chatVideoScriptValidator,
  createBrandBrainFieldValidator,
  createIdeaValidator,
  createVideoRecordingValidator,
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

  async generateScriptFromIdea({ auth, params, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const video = await workspaceService.generateScriptFromIdea(user.id, params.id)

    return await serialize.withoutWrapping(video)
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

  async deleteRecording({ auth, params, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const result = await workspaceService.deleteVideoRecording(
      user.id,
      params.videoId,
      params.recordingId,
    )

    return await serialize.withoutWrapping(result)
  }
}
