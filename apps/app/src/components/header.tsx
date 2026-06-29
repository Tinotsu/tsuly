import { Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { MenuIcon } from 'lucide-react'

import { query } from '@/lib/tuyau'
import { queryClient } from '@/lib/query_client'
import { getMeQueryOptions } from '@/hooks/auth'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export default function Header() {
  const navigate = useNavigate()
  const { data: user } = useQuery(getMeQueryOptions())

  const logout = useMutation(
    query.auth.logout.mutationOptions({
      onSuccess: async () => {
        queryClient.clear()
        await navigate({ to: '/' })
      },
    }),
  )

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4 sm:px-6 lg:px-8">
      <Link to="/" className={cn(buttonVariants({ variant: 'ghost' }), 'text-xl font-semibold')}>
        StarterKit
      </Link>

      <nav className="hidden items-center gap-1 md:flex">
        <Link to="/pricing" className={buttonVariants({ variant: 'ghost' })}>
          Pricing
        </Link>
        {user ? (
          <>
            <Link to="/dashboard" className={buttonVariants({ variant: 'ghost' })}>
              Dashboard
            </Link>
            <Button type="button" variant="ghost" onClick={() => logout.mutate({})}>
              Sign out
            </Button>
          </>
        ) : (
          <>
            <Link to="/auth/login" className={buttonVariants({ variant: 'ghost' })}>
              Sign in
            </Link>
            <Link to="/auth/register" className={buttonVariants()}>
              Get started
            </Link>
          </>
        )}
      </nav>

      <div className="md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" aria-label="Menu">
                <MenuIcon />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-52">
            {user ? (
              <>
                <DropdownMenuItem render={<Link to="/pricing" />}>Pricing</DropdownMenuItem>
                <DropdownMenuItem render={<Link to="/dashboard" />}>Dashboard</DropdownMenuItem>
                <DropdownMenuItem onClick={() => logout.mutate({})}>Sign out</DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem render={<Link to="/pricing" />}>Pricing</DropdownMenuItem>
                <DropdownMenuItem render={<Link to="/auth/login" />}>Sign in</DropdownMenuItem>
                <DropdownMenuItem render={<Link to="/auth/register" />}>
                  Get started
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
