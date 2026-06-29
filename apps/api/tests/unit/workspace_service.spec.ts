import { test } from '@japa/runner'
import { randomUUID } from 'node:crypto'

import WorkspaceService from '#app/content/services/workspace_service'
import User from '#app/identity/models/user'

test.group('WorkspaceService', () => {
  test('seeds the default workspace for a user', async ({ assert }) => {
    const user = await createUser()

    try {
      const workspace = await new WorkspaceService().getWorkspace(user.id)

      assert.equal(workspace.ideas[0].title, 'Why founders should post daily')
      assert.equal(workspace.videos[1].title, "AI won't replace creators")
      assert.equal(workspace.brandBrain[1].key, 'icp')
    } finally {
      await user.delete()
    }
  })

  test('keeps seeded workspace rows scoped to each user', async ({ assert }) => {
    const firstUser = await createUser()
    const secondUser = await createUser()
    const service = new WorkspaceService()

    try {
      const firstWorkspace = await service.getWorkspace(firstUser.id)
      const secondWorkspace = await service.getWorkspace(secondUser.id)

      assert.notEqual(firstWorkspace.ideas[0].id, secondWorkspace.ideas[0].id)
      assert.notEqual(firstWorkspace.brandBrain[1].id, secondWorkspace.brandBrain[1].id)
    } finally {
      await firstUser.delete()
      await secondUser.delete()
    }
  })
})

function createUser() {
  return User.create({
    fullName: 'Tsuly User',
    email: `workspace-${randomUUID()}@example.com`,
    password: 'password123',
  })
}
