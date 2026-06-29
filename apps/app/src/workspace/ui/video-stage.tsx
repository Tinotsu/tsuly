import { Check, Circle } from 'lucide-react'

import { cn } from '@/lib/utils'

export function VideoStage({ done, label }: { done: boolean; label: string }) {
  const Icon = done ? Check : Circle

  return (
    <span className={cn('flex items-center gap-1', done && 'text-foreground')}>
      <Icon className={cn('size-3.5', done && 'text-emerald-700')} />
      {label}
    </span>
  )
}
