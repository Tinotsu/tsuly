import type { ReactNode } from 'react'

export function DetailBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2 p-4">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <div className="text-sm leading-6">{children}</div>
    </div>
  )
}
