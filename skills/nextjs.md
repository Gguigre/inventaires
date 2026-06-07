---
name: nextjs
description: >
  Next.js 15 App Router conventions for this project. Use whenever working on a page,
  layout, route, Server Action, or Server Component — or deciding whether something
  should be a Server or Client Component. Also use when adding a new route,
  modifying middleware, setting up data fetching, or unsure whether to use
  a Server Action vs. an API route. Read this before touching app/ or any actions.ts.
---

# Next.js 15 App Router

## Route groups

- `(backoffice)/` — authenticated pages, sidebar layout
- `(frontoffice)/` — public pages, mobile-first full-screen layout

The middleware protects `(backoffice)`:

```ts
// middleware.ts
export function middleware(request: NextRequest) {
  const session = request.cookies.get('session')
  if (!session) return NextResponse.redirect(new URL('/login', request.url))
}
export const config = { matcher: ['/(backoffice)/:path*'] }
```

---

## Server vs Client Components

**Default: Server Component.** Add `'use client'` only when the component needs:
- React hooks (useState, useEffect…)
- Event listeners (onClick, onChange…)
- Zustand store
- Browser APIs (window, localStorage…)

Server Components keep dependencies out of the client bundle and can fetch data directly without an extra network round-trip. Staying server-side until there's a concrete reason to go client avoids both bundle bloat and unnecessary waterfalls.

---

## Data fetching in pages

Call use cases directly in Server Components — no `fetch()` or internal HTTP:

```ts
// app/(backoffice)/dashboard/controles/page.tsx
import { listControlsUseCase } from '@/features/controls/domain/use-cases'
import { getAuthenticatedUser } from '@/shared/lib/auth'

export default async function ControlesPage() {
  const user = await getAuthenticatedUser()
  const result = await listControlsUseCase(user.associationId)
  if (!result.ok) return <ErrorState message={result.error} />
  return <ControlsList controls={result.value} />
}
```

---

## Server Actions

Use Server Actions for all mutations. No REST API routes for simple mutations.

```ts
// features/controls/domain/actions.ts
'use server'
import type { Result } from '@/shared/domain/result'
import { createCorrectionUseCase } from './use-cases'
import { getAuthenticatedUser } from '@/shared/lib/auth'
import { revalidatePath } from 'next/cache'

export async function createCorrectionAction(input: CreateCorrectionInput): Promise<Result<void>> {
  const user = await getAuthenticatedUser()
  const result = await createCorrectionUseCase(input, user)
  if (result.ok) revalidatePath('/dashboard/controles')
  return result
}
```

Actions always return `Result<T>`. Never throw, never return `{ error } | { success }`, never expose internal IDs or Firebase UIDs.

---

## Layouts

```
app/layout.tsx                    → root (fonts, global providers)
app/(backoffice)/layout.tsx       → sidebar, auth check
app/(frontoffice)/layout.tsx      → full-screen mobile
```

---

## File naming

| Type | Convention | Example |
|------|-----------|---------|
| Page | `page.tsx` | `app/(backoffice)/dashboard/controles/page.tsx` |
| Layout | `layout.tsx` | `app/(backoffice)/layout.tsx` |
| Server Action | `actions.ts` | `features/controls/domain/actions.ts` |
| Use case | `use-cases.ts` | `features/controls/domain/use-cases.ts` |
| Repository | `repository.ts` | `features/controls/data/repository.ts` |
| Hook | `use-[name].ts` | `features/validator/ui/hooks/useValidator.ts` |
| Component | PascalCase | `features/controls/ui/ControlCard.tsx` |

---

## What not to do

- ❌ Fetch Firestore in a Client Component
- ❌ Create REST API routes for mutations — use Server Actions
- ❌ Import Node-only modules in `'use client'` files
- ❌ Put business logic in pages or layouts
