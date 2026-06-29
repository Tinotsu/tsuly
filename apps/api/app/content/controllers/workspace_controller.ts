import { HttpContext } from '@adonisjs/core/http'

import WorkspaceService from '../services/workspace_service.ts'

const workspaceService = new WorkspaceService()

export default class WorkspaceController {
  async show({ auth, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const workspace = await workspaceService.getWorkspace(user.id)

    return await serialize.withoutWrapping(workspace)
  }
}
