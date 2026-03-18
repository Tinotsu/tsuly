/// <reference path="../../../api/config/auth.ts" />

import { createTuyauReactQueryClient } from '@tuyau/react-query'
import { createTuyau } from '@tuyau/core/client'
import { registry } from '@acme/api/registry'

export const tuyau = createTuyau({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3333',
  registry,
  headers: { Accept: 'application/json' },
  credentials: 'include',
  redirect: 'manual',
})

export const query = createTuyauReactQueryClient({ client: tuyau })
