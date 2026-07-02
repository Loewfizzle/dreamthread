This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Database Schema (Dreams)

The core `dreams` table + Row Level Security is defined in:

- `supabase/migrations/001_create_dreams.sql` — complete SQL you can paste into the Supabase SQL Editor.

### Running the migration
1. Go to your Supabase project → SQL Editor.
2. Copy the contents of `supabase/migrations/001_create_dreams.sql` and run it.
3. (Recommended) After running, regenerate types if you want the absolute latest:
   ```bash
   npx supabase gen types typescript --project-id <ref> > types/database.ts
   ```

### TypeScript usage (strongly typed)

```ts
// Server Component / Server Action
import { createClient } from '@/lib/supabase/server'
import { getDreams, createDream } from '@/lib/dreams'
import type { Dream } from '@/types/database'

// Using the convenience helpers (recommended)
const dreams: Dream[] = await getDreams({ limit: 20, search: 'flying' })

// Or raw (still fully typed because createClient<Database>())
const supabase = await createClient()
const { data } = await supabase
  .from('dreams')
  .select('*')
  .eq('is_lucid', true)
  .order('dream_date', { ascending: false })
```

Client Components use the browser client the same way:

```tsx
'use client'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
```

All helpers and the Supabase clients are now typed against `Database` from `types/database.ts`. RLS policies guarantee users can only ever see/modify their own dreams.

See `lib/dreams.ts` for the current set of query helpers (`getDreams`, `getDream`, `createDream`, `updateDream`, `deleteDream`, etc.).


## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
