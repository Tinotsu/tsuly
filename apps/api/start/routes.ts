import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { controllers } from '#generated/controllers'
import { defineRouteGroup } from '#app/core/utils/index'

const { identity, core, billing, content } = controllers

defineRouteGroup(() => {
  router.post('register', [identity.Auth, 'register'])
  router.post('login', [identity.Auth, 'login'])
}).use(middleware.guest())

defineRouteGroup(() => {
  router.post('logout', [identity.Auth, 'logout'])
  router.get('me', [identity.Auth, 'getMe'])
}).use(middleware.auth())

defineRouteGroup('billing', () => {
  router.post('checkout', [billing.Billing, 'checkout'])
  router.post('portal', [billing.Billing, 'portal'])
}).use(middleware.auth())

defineRouteGroup('content', () => {
  router.get('workspace', [content.Workspace, 'show'])
  router.post('ideas', [content.Workspace, 'createIdea'])
  router.patch('ideas/:id', [content.Workspace, 'updateIdea'])
  router.post('ideas/:id/script', [content.Workspace, 'generateScriptFromIdea'])
  router.patch('videos/:id/script', [content.Workspace, 'updateVideoScript'])
  router.post('videos/:id/script/chat', [content.Workspace, 'chatVideoScript'])
  router.post('videos/:id/recordings', [content.Workspace, 'uploadRecording'])
  router.patch('brand-brain-fields/:id', [content.Workspace, 'updateBrandBrainField'])
  router.post('brand-brain-sections/:sectionId/fields', [
    content.Workspace,
    'createBrandBrainField',
  ])
}).use(middleware.auth())

router.post('billing/webhook', [billing.Billing, 'webhook'])

router.get('/is-authenticated', [identity.Auth, 'isAuthenticated'])
router.get('health', [core.HealthChecks, 'handle']).use(middleware.requireSecretToken())
