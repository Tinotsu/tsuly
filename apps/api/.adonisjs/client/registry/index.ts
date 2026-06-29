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
