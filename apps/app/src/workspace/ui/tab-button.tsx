import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground transition hover:text-foreground [&_svg]:size-4',
        active && 'bg-foreground text-background shadow-sm hover:text-background',
      )}
    >
      {children}
    </button>
  )
}
