import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'

export function FilterPill({ children }: { children: ReactNode }) {
  return (
    <Button type="button" variant="outline">
      {children}
      <ChevronDown />
    </Button>
  )
}
