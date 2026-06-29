import { HttpContext } from '@adonisjs/core/http'

import WorkspaceService from '../services/workspace_service.ts'
import {
  chatVideoScriptValidator,
  createBrandBrainFieldValidator,
  createIdeaValidator,
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
}
