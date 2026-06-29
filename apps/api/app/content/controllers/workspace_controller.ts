import { HttpContext } from '@adonisjs/core/http'

import WorkspaceService from '../services/workspace_service.ts'
import {
  createBrandBrainFieldValidator,
  updateBrandBrainFieldValidator,
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
}
