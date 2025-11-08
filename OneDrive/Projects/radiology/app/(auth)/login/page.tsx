'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema)
    })

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true)

        try {
            const supabase = createClient()

            const { error } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            })

            if (error) {
                toast.error(error.message || 'Failed to sign in')
                setIsLoading(false)
                return
            }

            toast.success('Signed in successfully')
            router.push('/dashboard')
            router.refresh()
        } catch (error) {
            toast.error('An unexpected error occurred')
            console.error(error)
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-12 px-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-8 shadow-lg">
                {/* Logo */}
                <div className="flex justify-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-xl">📋</span>
                    </div>
                </div>

                {/* Header */}
                <h1 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-2">
                    Welcome Back
                </h1>
                <p className="text-center text-slate-600 dark:text-slate-400 mb-8">
                    Sign in to your Radiology Manager account
                </p>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Email Address
                        </label>
                        <Input
                            {...register('email')}
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            disabled={isLoading}
                        />
                        {errors.email && (
                            <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Password
                        </label>
                        <Input
                            {...register('password')}
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            disabled={isLoading}
                        />
                        {errors.password && (
                            <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
                        )}
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </Button>
                </form>

                {/* Divider */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400">
                            Don&apos;t have an account?
                        </span>
                    </div>
                </div>

                {/* Sign Up Link */}
                <Link href="/register">
                    <Button variant="outline" className="w-full">
                        Create Account
                    </Button>
                </Link>

                {/* Footer */}
                <p className="text-center text-xs text-slate-600 dark:text-slate-400 mt-6">
                    By signing in, you agree to our Terms of Service and Privacy Policy
                </p>
            </div>
        </div>
    )
}