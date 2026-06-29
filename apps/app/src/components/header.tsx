import { Link } from '@tanstack/react-router'
import { BrainCircuit, Clapperboard, Lightbulb } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/#ideas', label: 'Ideas', icon: Lightbulb },
  { href: '/#videos', label: 'Videos', icon: Clapperboard },
  { href: '/#brand-brain', label: 'Brand Brain', icon: BrainCircuit },
]

export default function Header() {
  return (
    <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b bg-background px-4 py-3 sm:px-6 lg:px-8">
      <Link to="/" className={cn(buttonVariants({ variant: 'ghost' }), 'text-xl font-semibold')}>
        Tsuly
      </Link>

      <nav className="flex flex-wrap items-center gap-1">
        {navItems.map(item => {
          const Icon = item.icon

          return (
            <a
              key={item.href}
              href={item.href}
              className={cn(buttonVariants({ variant: 'ghost' }), 'gap-2')}
            >
              <Icon className="size-4" />
              {item.label}
            </a>
          )
        })}
      </nav>
    </header>
  )
}
