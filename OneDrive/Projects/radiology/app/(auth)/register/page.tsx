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

const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema)
    })

    const onSubmit = async (data: RegisterFormData) => {
        setIsLoading(true)

        try {
            const supabase = createClient()

            // Sign up
            const { error: signUpError } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
            })

            if (signUpError) {
                toast.error(signUpError.message || 'Failed to create account')
                setIsLoading(false)
                return
            }

            toast.success('Account created successfully! Please check your email for verification.')
            router.push('/login')
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
                    Create Account
                </h1>
                <p className="text-center text-slate-600 dark:text-slate-400 mb-8">
                    Join Radiology Manager today
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

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Confirm Password
                        </label>
                        <Input
                            {...register('confirmPassword')}
                            id="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            disabled={isLoading}
                        />
                        {errors.confirmPassword && (
                            <p className="text-sm text-red-500 mt-1">{errors.confirmPassword.message}</p>
                        )}
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Creating account...' : 'Create Account'}
                    </Button>
                </form>

                {/* Divider */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400">
                            Already have an account?
                        </span>
                    </div>
                </div>

                {/* Sign In Link */}
                <Link href="/login">
                    <Button variant="outline" className="w-full">
                        Sign In
                    </Button>
                </Link>

                {/* Footer */}
                <p className="text-center text-xs text-slate-600 dark:text-slate-400 mt-6">
                    By creating an account, you agree to our Terms of Service and Privacy Policy
                </p>
            </div>
        </div>
    )
}
