import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { Database } from '@/lib/types/database'

// API Version for cache busting - v3
export async function POST(request: NextRequest) {
  // Step 1: Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    return NextResponse.json(
      { error: 'Config error: Missing SUPABASE_URL', step: 1 },
      { status: 500 }
    )
  }

  if (!serviceRoleKey) {
    return NextResponse.json(
      { error: 'Config error: Missing SERVICE_ROLE_KEY', step: 1 },
      { status: 500 }
    )
  }

  // Step 2: Parse request body
  let email: string
  let password: string

  try {
    const body = await request.json()
    email = body.email
    password = body.password
  } catch (parseError) {
    return NextResponse.json(
      { error: 'Invalid JSON in request body', step: 2 },
      { status: 400 }
    )
  }

  // Step 3: Validate input
  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required', step: 3 },
      { status: 400 }
    )
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: 'Password must be at least 6 characters', step: 3 },
      { status: 400 }
    )
  }

  // Step 4: Create Supabase admin client
  let supabaseAdmin
  try {
    supabaseAdmin = createClient<Database>(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  } catch (clientError) {
    const msg = clientError instanceof Error ? clientError.message : 'Unknown'
    return NextResponse.json(
      { error: `Failed to create Supabase client: ${msg}`, step: 4 },
      { status: 500 }
    )
  }

  // Step 5: Create user with admin API
  let userData
  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (error) {
      return NextResponse.json(
        { error: `Supabase auth error: ${error.message}`, step: 5 },
        { status: 400 }
      )
    }

    if (!data || !data.user) {
      return NextResponse.json(
        { error: 'No user data returned from Supabase', step: 5 },
        { status: 500 }
      )
    }

    userData = data
  } catch (authError) {
    const msg = authError instanceof Error ? authError.message : 'Unknown'
    return NextResponse.json(
      { error: `Auth exception: ${msg}`, step: 5 },
      { status: 500 }
    )
  }

  // Step 6: Create user profile
  try {
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        user_id: userData.user.id,
        must_change_password: true,
      })

    if (profileError) {
      return NextResponse.json(
        { error: `Profile error: ${profileError.message}`, step: 6 },
        { status: 500 }
      )
    }
  } catch (profileException) {
    const msg = profileException instanceof Error ? profileException.message : 'Unknown'
    return NextResponse.json(
      { error: `Profile exception: ${msg}`, step: 6 },
      { status: 500 }
    )
  }

  // Step 7: Success
  return NextResponse.json({
    success: true,
    version: 'v3',
    user: {
      id: userData.user.id,
      email: userData.user.email,
      message: 'User created successfully. They will be prompted to change password on first login.'
    }
  })
}
