import { match } from 'ts-pattern'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

import { isAuthenticatedQueryOptions } from '@/hooks/auth'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const { data } = useQuery(isAuthenticatedQueryOptions())

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          AdonisJS Monorepo Starter Kit
        </h1>
        <p className="py-6 text-muted-foreground">
          A minimal, clean starter template for building modern web applications.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {match(data?.isAuthenticated)
            .with(true, () => (
              <Link to="/dashboard" className={cn(buttonVariants({ size: 'lg' }))}>
                Go to Dashboard
              </Link>
            ))
            .otherwise(() => (
              <>
                <Link
                  to="/auth/login"
                  className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
                >
                  Sign in
                </Link>
                <Link to="/auth/register" className={cn(buttonVariants({ size: 'lg' }))}>
                  Get started
                </Link>
              </>
            ))}
        </div>
      </div>
    </div>
  )
}
