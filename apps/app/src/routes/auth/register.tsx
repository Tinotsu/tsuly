import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'

import { query } from '@/lib/tuyau'
import { queryClient } from '@/lib/query_client'
import { redirectToDashboardIfAuthenticated } from '@/hooks/auth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const Route = createFileRoute('/auth/register')({
  component: RouteComponent,
  beforeLoad: () => redirectToDashboardIfAuthenticated(),
})

function RouteComponent() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const register = useMutation(
    query.auth.register.mutationOptions({
      onSuccess: async () => {
        await queryClient.resetQueries()
        await navigate({ to: '/dashboard' })
      },
      onError: (error: any) => {
        if (error.response?.data?.errors) setErrors(error.response.data.errors)
      },
    }),
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    register.mutate({
      body: {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        // @ts-ignore not explicitly defined in validator but accepted
        passwordConfirmation: formData.confirmPassword,
      },
    })
  }

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>Enter your information below to create your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={handleChange('fullName')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={formData.email}
                onChange={handleChange('email')}
                required
              />
              <p className="text-sm text-muted-foreground">
                We&apos;ll use this to contact you. We will not share your email with anyone else.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={handleChange('password')}
                required
              />
              <p className="text-sm text-muted-foreground">Must be at least 8 characters long.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange('confirmPassword')}
                required
              />
              <p className="text-sm text-muted-foreground">Please confirm your password.</p>
            </div>

            <div className="space-y-2 pt-2">
              <Button type="submit" className="w-full" disabled={register.isPending}>
                {register.isPending ? 'Creating Account...' : 'Create Account'}
              </Button>
              <Button type="button" variant="outline" className="w-full">
                Sign up with Google
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-0 bg-transparent">
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/auth/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
