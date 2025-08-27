# alx-polly

Create, share, and run live polls with QR codes. alx-polly is a Next.js + Supabase app for instructors, event hosts, and teams to collect votes from any device and view real‑time results with simple, secure management.
## Getting Started

### Prerequisites

- Node.js 18.17+ (or 20+)
- Package manager: npm, Yarn, pnpm, or Bun

### Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### Run the development server

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

## Project Docs

- **Feature overview**: Create polls with multiple choices, share via QR code, and view real‑time results. See the app entry at `app/page.tsx` and auth at `app/(auth)/` for flows.
- **Folder structure**:
  - [`app/`](./app) — Next.js App Router pages, layouts, and routes
  - [`components/`](./components) — UI and composite components (e.g., `components/ui/*`)
  - [`lib/`](./lib) — clients and utilities (e.g., Supabase in `lib/supabase/*`)
  - [`types/`](./types) — shared TypeScript types (e.g., `types/poll.ts`)
  - [`public/`](./public) — static assets (icons, images)
- **Development and build scripts**: See [`package.json`](./package.json)
  - `dev`: start local dev server
  - `build`: production build
  - `start`: run built app
- **Environment and setup**:
  - Create a `.env.local` with your Supabase credentials:
    - `NEXT_PUBLIC_SUPABASE_URL="..."`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY="..."`
  - Supabase clients live in `lib/supabase/client.ts` and `lib/supabase/server.ts`.
- **Contribution guide**: Use conventional commits, open a draft PR early, and add context/screenshots. Lint and type-check before pushing. A full `CONTRIBUTING.md` will be added later.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
