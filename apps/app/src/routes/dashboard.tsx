import type { Data } from '@acme/api/data'

import { createFileRoute, Link } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { getMeQueryOptions, redirectToLoginIfNotAuthenticated } from '@/hooks/auth'
import { invalidateUser, useBillingPortal } from '@/hooks/billing'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'

export const Route = createFileRoute('/dashboard')({
  component: RouteComponent,
  beforeLoad: async () => await redirectToLoginIfNotAuthenticated(),
})

function RouteComponent() {
  const { data: user } = useSuspenseQuery(getMeQueryOptions())
  const [checkout, setCheckout] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setCheckout(params.get('checkout'))
  }, [])

  useEffect(() => {
    if (checkout === 'success') {
      void invalidateUser()
    }
  }, [checkout])

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl space-y-6">
        {checkout === 'success' && (
          <Alert className="border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400">
            <AlertDescription>Subscription activated. Thanks for upgrading!</AlertDescription>
          </Alert>
        )}
        <UserCard user={user} />
        <BillingCard user={user} />
      </div>
    </div>
  )
}

export function UserCard({ user }: { user: Data.Identity.User }) {
  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle>Welcome back!</CardTitle>
        <CardDescription>Here&apos;s your account information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Full Name</p>
          <p className="text-lg font-medium">{user.fullName}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Email</p>
          <p className="text-lg font-medium">{user.email}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function BillingCard({ user }: { user: Data.Identity.User }) {
  const portal = useBillingPortal()

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle>Billing</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Plan</span>
          {user.isSubscribed ? (
            <Badge className="capitalize">{user.plan ?? 'pro'}</Badge>
          ) : (
            <Badge variant="secondary">Free</Badge>
          )}
        </div>
        {user.subscriptionStatus && (
          <p className="mt-1 text-sm capitalize text-muted-foreground">
            Status: {user.subscriptionStatus.replace('_', ' ')}
          </p>
        )}
      </CardContent>
      <CardFooter className="justify-end border-0 bg-transparent">
        {user.isSubscribed ? (
          <Button
            type="button"
            variant="outline"
            disabled={portal.isPending}
            onClick={() => portal.mutate({})}
          >
            {portal.isPending ? 'Opening…' : 'Manage billing'}
          </Button>
        ) : (
          <Link to="/pricing" className={buttonVariants()}>
            Upgrade to Pro
          </Link>
        )}
      </CardFooter>
    </Card>
  )
}
