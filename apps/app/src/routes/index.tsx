import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

import { query } from '@/lib/tuyau'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const { data: user } = useQuery(query.auth.getMe.queryOptions())

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">
          AdonisJS Monorepo Starter Kit
        </h1>
        <p className="text-sm text-gray-300 mb-8">
          A minimal, clean starter template for building modern web applications.
        </p>
        <div className="flex gap-4 justify-center">
          {user ? (
            <Link to="/dashboard">
              <Button size="lg">Go to Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link to="/auth/login">
                <Button variant="outline" size="lg">
                  Sign in
                </Button>
              </Link>
              <Link to="/auth/register">
                <Button size="lg">Get started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
