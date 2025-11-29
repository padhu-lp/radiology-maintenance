# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Radiology-Maintenance is a Next.js 16 application for managing radiology equipment maintenance workflows. It's a full-stack system with real-time authentication, equipment tracking, and maintenance scheduling features.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + PostCSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **UI Components**: Radix UI + shadcn/ui
- **Forms**: React Hook Form + Zod validation
- **State Management**: TanStack React Query v5
- **Charts**: Recharts

## Key Commands

```bash
# Development
npm run dev              # Start dev server on http://localhost:3000

# Building
npm run build            # Build for production
npm start               # Start production server

# Linting
npm run lint            # Run ESLint checks
```

## Project Structure

```
src/
├── app/                          # Next.js app directory (routing)
│   ├── (auth)/                  # Authentication routes (login, register)
│   │   ├── login/page.tsx       # Login with Zod validation
│   │   └── register/page.tsx    # User registration
│   ├── (dashboard)/             # Protected routes (require auth)
│   │   ├── dashboard/page.tsx   # Main dashboard
│   │   ├── equipment/page.tsx   # Equipment management
│   │   ├── inventory/page.tsx
│   │   ├── maintenance/page.tsx
│   │   ├── work-orders/page.tsx
│   │   ├── reports/page.tsx
│   │   └── layout.tsx           # Dashboard layout wrapper
│   ├── api/                     # API routes
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Root home page
│   └── globals.css              # Global styles
├── components/
│   ├── ui/                      # Reusable shadcn/ui components
│   ├── auth/                    # Auth-related components
│   ├── dashboard/               # Dashboard specific components
│   ├── equipment/               # Equipment feature components
│   ├── work-orders/             # Work order feature components
│   ├── shared/                  # Shared components
│   └── icons.tsx                # Icon definitions
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Browser client instance
│   │   └── server.ts            # Server-side client instance
│   ├── types/
│   │   └── database.ts          # Database type definitions (auto-generated)
│   └── utils.ts                 # Utility functions (className merging, etc)
└── middleware.ts                # Auth middleware (protected route guards)
```

## Architecture Patterns

### Authentication Flow

1. **Middleware** (`src/middleware.ts`): Checks user session on every request
   - Redirects unauthenticated users from `/dashboard/*` to `/login`
   - Redirects authenticated users away from `/login` and `/register` to `/dashboard`

2. **Client-Side Auth** (`src/lib/supabase/client.ts`): Browser client for login/logout
   - Used in login/register pages via `createClient()`
   - Handles form submission with email/password

3. **Server-Side Auth** (`src/lib/supabase/server.ts`): Server client for protected pages
   - Used in layout components to fetch current user
   - Manages cookies via Next.js `cookies()` API

### Route Protection

- **Public Routes**: `/`, `/login`, `/register`
- **Protected Routes**: `/dashboard/*` - enforced by middleware and layout verification
- Dashboard layout calls `createServerClient()` and redirects if no user

### Form Handling

- **Zod Schemas**: Define validation in page components (e.g., `loginSchema` in login/page.tsx)
- **React Hook Form**: Integrates with `@hookform/resolvers/zod` for automatic validation
- **Error Display**: Form errors rendered inline below input fields

### UI Component System

- Uses shadcn/ui components (button, card, input, etc) from `src/components/ui/`
- All components wrapped with Tailwind CSS classes for styling
- Radix UI primitives provide accessibility (ARIA labels, keyboard navigation)

### State & Data Fetching

- **React Query**: TanStack React Query for server state management
- **Devtools**: React Query Devtools available in development

## Environment Setup

Create a `.env.local` file with:
```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

Note: `NEXT_PUBLIC_*` prefix means these are exposed to browser - only use public credentials (anonymous key).

## Database Integration

- Types defined in `src/lib/types/database.ts` (auto-generated from Supabase schema)
- Use typed client instances for full TypeScript support
- Server-side operations use `createServerClient()` from `src/lib/supabase/server.ts`
- Client-side mutations use `createClient()` from `src/lib/supabase/client.ts`

## Common Development Tasks

### Adding a New Protected Page
1. Create page file in `src/app/(dashboard)/<feature>/page.tsx`
2. Import and use `createServerClient()` if you need data
3. Layout wrapper handles auth redirect automatically
4. Add navigation link to `src/components/dashboard/sidebar.tsx`

### Creating a New Form
1. Define Zod schema for validation
2. Use React Hook Form with zodResolver
3. Import shadcn/ui form components (Input, Button, etc)
4. Use `createClient()` for Supabase operations in form submission

### Adding UI Components
- Copy from shadcn/ui library into `src/components/ui/`
- These are customized primitives ready to use
- Maintain Tailwind styling consistency

## ESLint Configuration

Uses ESLint 9 with Next.js presets:
- `eslint-config-next/core-web-vitals`: Web Vitals linting
- `eslint-config-next/typescript`: TypeScript support
- Config in `eslint.config.mjs` (flat config format)

Run `npm run lint` to check for issues.

## Important Notes

- Next.js App Router places pages in `app/` directory with `page.tsx` files
- Routes with parentheses `(auth)`, `(dashboard)` are route groups - not in URL
- Middleware runs on every request - keep it lightweight
- Supabase client instances should be created once and reused
- Always use server client in Server Components and browser client in Client Components
- TypeScript strict mode enabled - type all functions and imports
