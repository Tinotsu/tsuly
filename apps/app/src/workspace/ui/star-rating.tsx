import { Star } from 'lucide-react'

import { cn } from '@/lib/utils'

export function StarRating({
  rating,
  onChange,
  className,
}: {
  rating: number
  onChange?: (rating: number) => void
  className?: string
}) {
  return (
    <span className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: 5 }, (_, index) => {
        const star = (
          <Star
            className={cn(
              'size-4',
              index < rating ? 'fill-amber-400 text-amber-500' : 'text-muted-foreground/30',
            )}
          />
        )

        if (!onChange) {
          return <span key={index}>{star}</span>
        }

        return (
          <button
            key={index}
            type="button"
            onClick={event => {
              event.stopPropagation()
              onChange(index + 1)
            }}
            className="rounded-sm transition hover:scale-110"
            aria-label={`Rate ${index + 1} stars`}
          >
            {star}
          </button>
        )
      })}
    </span>
  )
}
