/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'auth.register': {
    methods: ["POST"],
    pattern: '/register',
    tokens: [{"old":"/register","type":0,"val":"register","end":""}],
    types: placeholder as Registry['auth.register']['types'],
  },
  'auth.login': {
    methods: ["POST"],
    pattern: '/login',
    tokens: [{"old":"/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['auth.login']['types'],
  },
  'auth.logout': {
    methods: ["POST"],
    pattern: '/logout',
    tokens: [{"old":"/logout","type":0,"val":"logout","end":""}],
    types: placeholder as Registry['auth.logout']['types'],
  },
  'auth.get_me': {
    methods: ["GET","HEAD"],
    pattern: '/me',
    tokens: [{"old":"/me","type":0,"val":"me","end":""}],
    types: placeholder as Registry['auth.get_me']['types'],
  },
  'billing.checkout': {
    methods: ["POST"],
    pattern: '/billing/checkout',
    tokens: [{"old":"/billing/checkout","type":0,"val":"billing","end":""},{"old":"/billing/checkout","type":0,"val":"checkout","end":""}],
    types: placeholder as Registry['billing.checkout']['types'],
  },
  'billing.portal': {
    methods: ["POST"],
    pattern: '/billing/portal',
    tokens: [{"old":"/billing/portal","type":0,"val":"billing","end":""},{"old":"/billing/portal","type":0,"val":"portal","end":""}],
    types: placeholder as Registry['billing.portal']['types'],
  },
  'workspace.show': {
    methods: ["GET","HEAD"],
    pattern: '/content/workspace',
    tokens: [{"old":"/content/workspace","type":0,"val":"content","end":""},{"old":"/content/workspace","type":0,"val":"workspace","end":""}],
    types: placeholder as Registry['workspace.show']['types'],
  },
  'workspace.create_idea': {
    methods: ["POST"],
    pattern: '/content/ideas',
    tokens: [{"old":"/content/ideas","type":0,"val":"content","end":""},{"old":"/content/ideas","type":0,"val":"ideas","end":""}],
    types: placeholder as Registry['workspace.create_idea']['types'],
  },
  'workspace.update_idea': {
    methods: ["PATCH"],
    pattern: '/content/ideas/:id',
    tokens: [{"old":"/content/ideas/:id","type":0,"val":"content","end":""},{"old":"/content/ideas/:id","type":0,"val":"ideas","end":""},{"old":"/content/ideas/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['workspace.update_idea']['types'],
  },
  'workspace.generate_script_from_idea': {
    methods: ["POST"],
    pattern: '/content/ideas/:id/script',
    tokens: [{"old":"/content/ideas/:id/script","type":0,"val":"content","end":""},{"old":"/content/ideas/:id/script","type":0,"val":"ideas","end":""},{"old":"/content/ideas/:id/script","type":1,"val":"id","end":""},{"old":"/content/ideas/:id/script","type":0,"val":"script","end":""}],
    types: placeholder as Registry['workspace.generate_script_from_idea']['types'],
  },
  'workspace.update_video_script': {
    methods: ["PATCH"],
    pattern: '/content/videos/:id/script',
    tokens: [{"old":"/content/videos/:id/script","type":0,"val":"content","end":""},{"old":"/content/videos/:id/script","type":0,"val":"videos","end":""},{"old":"/content/videos/:id/script","type":1,"val":"id","end":""},{"old":"/content/videos/:id/script","type":0,"val":"script","end":""}],
    types: placeholder as Registry['workspace.update_video_script']['types'],
  },
  'workspace.chat_video_script': {
    methods: ["POST"],
    pattern: '/content/videos/:id/script/chat',
    tokens: [{"old":"/content/videos/:id/script/chat","type":0,"val":"content","end":""},{"old":"/content/videos/:id/script/chat","type":0,"val":"videos","end":""},{"old":"/content/videos/:id/script/chat","type":1,"val":"id","end":""},{"old":"/content/videos/:id/script/chat","type":0,"val":"script","end":""},{"old":"/content/videos/:id/script/chat","type":0,"val":"chat","end":""}],
    types: placeholder as Registry['workspace.chat_video_script']['types'],
  },
  'workspace.upload_recording': {
    methods: ["POST"],
    pattern: '/content/videos/:id/recordings',
    tokens: [{"old":"/content/videos/:id/recordings","type":0,"val":"content","end":""},{"old":"/content/videos/:id/recordings","type":0,"val":"videos","end":""},{"old":"/content/videos/:id/recordings","type":1,"val":"id","end":""},{"old":"/content/videos/:id/recordings","type":0,"val":"recordings","end":""}],
    types: placeholder as Registry['workspace.upload_recording']['types'],
  },
  'workspace.update_brand_brain_field': {
    methods: ["PATCH"],
    pattern: '/content/brand-brain-fields/:id',
    tokens: [{"old":"/content/brand-brain-fields/:id","type":0,"val":"content","end":""},{"old":"/content/brand-brain-fields/:id","type":0,"val":"brand-brain-fields","end":""},{"old":"/content/brand-brain-fields/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['workspace.update_brand_brain_field']['types'],
  },
  'workspace.create_brand_brain_field': {
    methods: ["POST"],
    pattern: '/content/brand-brain-sections/:sectionId/fields',
    tokens: [{"old":"/content/brand-brain-sections/:sectionId/fields","type":0,"val":"content","end":""},{"old":"/content/brand-brain-sections/:sectionId/fields","type":0,"val":"brand-brain-sections","end":""},{"old":"/content/brand-brain-sections/:sectionId/fields","type":1,"val":"sectionId","end":""},{"old":"/content/brand-brain-sections/:sectionId/fields","type":0,"val":"fields","end":""}],
    types: placeholder as Registry['workspace.create_brand_brain_field']['types'],
  },
  'billing.webhook': {
    methods: ["POST"],
    pattern: '/billing/webhook',
    tokens: [{"old":"/billing/webhook","type":0,"val":"billing","end":""},{"old":"/billing/webhook","type":0,"val":"webhook","end":""}],
    types: placeholder as Registry['billing.webhook']['types'],
  },
  'auth.is_authenticated': {
    methods: ["GET","HEAD"],
    pattern: '/is-authenticated',
    tokens: [{"old":"/is-authenticated","type":0,"val":"is-authenticated","end":""}],
    types: placeholder as Registry['auth.is_authenticated']['types'],
  },
  'health_checks': {
    methods: ["GET","HEAD"],
    pattern: '/health',
    tokens: [{"old":"/health","type":0,"val":"health","end":""}],
    types: placeholder as Registry['health_checks']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
