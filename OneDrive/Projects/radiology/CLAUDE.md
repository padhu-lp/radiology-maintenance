# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 16.0.1 application for managing radiology equipment, maintenance work orders, and quality control testing. Built with TypeScript, Supabase, React Query, and shadcn/ui.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Architecture

### Tech Stack
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript (strict mode)
- **Authentication**: Supabase Auth with SSR cookie-based sessions
- **Database**: Supabase PostgreSQL
- **Data Fetching**: TanStack React Query v5
- **Forms**: React Hook Form + Zod validation
- **UI**: shadcn/ui (New York style) + Tailwind CSS v4
- **Icons**: Lucide React
- **Charts**: Recharts
- **Notifications**: Sonner

### Directory Structure

```
app/                   # Next.js App Router
├── api/auth/callback/ # OAuth callback handler
├── layout.tsx         # Root layout
├── page.tsx           # Home page
└── globals.css        # Global styles + CSS variables

components/            # React components
├── auth/             # Login, register components
├── dashboard/        # Dashboard views
├── equipment/        # Equipment management
├── work-orders/      # Work order management
├── shared/           # Shared components (nav, headers)
└── ui/               # shadcn/ui base components

lib/
├── supabase/
│   ├── client.ts     # Client-side Supabase client
│   └── server.ts     # Server-side Supabase client
├── types/
│   └── database.ts   # Supabase database types
└── utils.ts          # Utility functions (cn helper)

hooks/                # Custom React hooks

middleware.ts         # Auth middleware + route protection
```

### Authentication Flow

Authentication is handled via middleware (`middleware.ts`) using Supabase SSR pattern:
- Creates server client with cookie handlers (get/set/remove)
- Retrieves user session via `supabase.auth.getUser()`
- Protected routes: `/dashboard/*` → redirects to `/login` if unauthenticated
- Auth pages: `/login`, `/register` → redirects to `/dashboard` if authenticated
- Matcher excludes static assets, images, and Next.js internals

### Database Schema

The application uses 4 main schema modules in Supabase:

**Equipment Module** (`equipment.*`):
- `inventory` - Equipment tracking (serial numbers, models, installation dates, warranty, status)
- `manufacturers` - Manufacturer directory
- `locations` - Physical locations/departments

**Maintenance Module** (`maintenance.*`):
- `work_orders` - Service requests, repairs, assignments, costs, downtime
- `schedules` - Preventive maintenance scheduling
- `parts_inventory` - Spare parts tracking

**Quality Control Module** (`quality.*`):
- `qc_tests` - Quality assurance testing, protocols, results, pass/fail tracking

All database types are defined in `lib/types/database.ts` with TypeScript interfaces for Row/Insert/Update variants.

### Data Fetching Pattern

Use TanStack React Query for all async data operations:

```typescript
// Custom hook pattern
export function useEquipment() {
  return useQuery({
    queryKey: ['equipment'],
    queryFn: async () => {
      const supabase = createClient() // from lib/supabase/client.ts
      const { data, error } = await supabase
        .from('equipment.inventory')
        .select('*')
      if (error) throw error
      return data
    }
  })
}
```

For server components, use Supabase server client directly:
```typescript
import { createClient } from '@/lib/supabase/server'

const supabase = createClient()
const { data } = await supabase.from('equipment.inventory').select('*')
```

### Component Patterns

**UI Components**: Use shadcn/ui components from `@/components/ui`
- Import with: `import { Button } from '@/components/ui/button'`
- Use `cn()` utility for conditional classes: `cn('base-class', condition && 'conditional-class')`

**Forms**: Use React Hook Form with Zod validation
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  equipment_name: z.string().min(1),
  serial_number: z.string().min(1)
})

const form = useForm({
  resolver: zodResolver(schema)
})
```

**Server vs Client Components**:
- Use Server Components by default
- Add `'use client'` only when needed (hooks, event handlers, browser APIs)
- Keep Supabase server client in Server Components for security

### Import Aliases

```typescript
'@/*'          // Root directory
'@/components' // components/
'@/lib'        // lib/
'@/hooks'      // hooks/
'@/utils'      // lib/utils
'@/ui'         // components/ui/
```

### Styling

- **CSS Variables**: Defined in `app/globals.css` using Oklch color space
- **Theme Colors**: primary, secondary, accent, destructive, muted, card, popover
- **Chart Colors**: chart-1 through chart-5 for data visualization
- **Dark Mode**: Supports `.dark` class toggle
- **Utility**: Use `cn()` from `@/lib/utils` to merge Tailwind classes

### Key Conventions

1. **Type Safety**: All database queries should be typed using `Database` types from `lib/types/database.ts`
2. **Error Handling**: Always check Supabase errors and handle appropriately
3. **Authentication**: Never expose service role key client-side; use anon key only
4. **Server Actions**: Prefer server actions over API routes for mutations
5. **Validation**: All user inputs must be validated with Zod schemas
6. **Components**: Feature components go in feature folders (auth/, equipment/, etc.), base UI in ui/
7. **Naming**: PascalCase for components (.tsx), camelCase for utilities (.ts)

### Supabase Integration

**Client-side** (`lib/supabase/client.ts`):
- Use in Client Components and custom hooks
- For mutations, queries from browser
- Has user-level permissions only

**Server-side** (`lib/supabase/server.ts`):
- Use in Server Components, Server Actions, Route Handlers
- Has access to request cookies
- Supports SSR auth state

Both clients should be created using the Supabase SSR package with proper cookie handling.

### React Query Setup

Wrap app with QueryClientProvider in root layout. Use React Query DevTools in development:
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
```

Query keys should be organized by feature:
- `['equipment']` - Equipment lists
- `['equipment', id]` - Single equipment item
- `['work-orders']` - Work order lists
- `['qc-tests', equipmentId]` - QC tests for equipment

### Feature Modules

**Equipment Management**:
- CRUD operations for equipment inventory
- Track serial numbers, models, manufacturers, locations
- Monitor warranty and installation dates
- Manage risk levels and status

**Work Orders**:
- Create and assign maintenance work orders
- Track problem descriptions, fault codes
- Monitor downtime hours and completion
- Calculate labor and parts costs

**Quality Control**:
- Schedule and perform QC tests
- Track test protocols and results
- Record pass/fail status and deviations
- Manage corrective actions

**Dashboard**:
- Overview of equipment status
- Work order metrics
- QC test compliance
- Charts and visualizations using Recharts

### Development Notes

- The project is in early scaffolding phase - core directories exist but implementation is minimal
- Supabase client files need initialization before data operations work
- All feature components need to be built
- Database types in `database.ts` will be replaced by Supabase auto-generated types
- Forms need React Hook Form + Zod implementation
- Dashboard visualizations need Recharts integration
