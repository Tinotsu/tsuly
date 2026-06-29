import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

import { getMeQueryOptions } from '@/hooks/auth'
import { useCheckout } from '@/hooks/billing'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/pricing')({
  component: RouteComponent,
})

function RouteComponent() {
  const { data: user } = useQuery(getMeQueryOptions())
  const checkout = useCheckout()

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-12">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="mb-3 text-4xl font-bold">Simple pricing</h1>
        <p className="mb-10 text-muted-foreground">Start free, upgrade when you need more.</p>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="text-center shadow-lg">
            <CardHeader className="items-center">
              <CardTitle>Free</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-2">
              <p className="text-3xl font-bold">$0</p>
              <p className="text-muted-foreground">For getting started</p>
              <ul className="my-4 w-full space-y-2 text-left text-sm">
                <li>✓ Account & dashboard</li>
                <li>✓ Basic features</li>
              </ul>
            </CardContent>
            <CardFooter className="justify-center border-0 bg-transparent">
              {user ? (
                user.isSubscribed ? (
                  <Badge variant="secondary">Current plan</Badge>
                ) : (
                  <Badge variant="outline">Your current plan</Badge>
                )
              ) : (
                <Link
                  to="/auth/register"
                  className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}
                >
                  Get started
                </Link>
              )}
            </CardFooter>
          </Card>

          <Card className="border-primary text-center shadow-lg">
            <CardHeader className="items-center">
              <Badge>Popular</Badge>
              <CardTitle>Pro</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-2">
              <p className="text-3xl font-bold">$19</p>
              <p className="text-muted-foreground">per month</p>
              <ul className="my-4 w-full space-y-2 text-left text-sm">
                <li>✓ Everything in Free</li>
                <li>✓ Priority support</li>
                <li>✓ All premium features</li>
              </ul>
            </CardContent>
            <CardFooter className="justify-center border-0 bg-transparent">
              {user?.isSubscribed ? (
                <Link to="/dashboard" className={cn(buttonVariants(), 'w-full')}>
                  Manage on dashboard
                </Link>
              ) : user ? (
                <Button
                  type="button"
                  className="w-full"
                  disabled={checkout.isPending}
                  onClick={() => checkout.mutate({ body: { plan: 'pro' } })}
                >
                  {checkout.isPending ? 'Redirecting…' : 'Subscribe to Pro'}
                </Button>
              ) : (
                <Link to="/auth/register" className={cn(buttonVariants(), 'w-full')}>
                  Sign up to subscribe
                </Link>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
