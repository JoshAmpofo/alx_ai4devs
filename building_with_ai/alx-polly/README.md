# alx-polly

Create, share, and run live polls with QR codes. alx-polly is a Next.js + Supabase app for instructors, event hosts, and teams to collect votes from any device and view real‑time results with simple, secure management.

## Recent Updates & Improvements

### UI Component Enhancements
- **Card Components**: Updated `CardHeader`, `CardContent`, and `CardFooter` to properly handle className merging using the `cn` utility
- **Improved Styling**: Enhanced component props handling for better customization and consistent styling patterns
- **Better Accessibility**: Improved component structure for better screen reader support

### Authentication & Routing Fixes
- **Next.js 15 Compatibility**: Fixed page components to work with the new App Router params as Promise pattern
- **Route Protection**: Enhanced authentication flow with proper async/await handling for dynamic routes
- **Link Component Fixes**: Resolved invalid `<Link>` usage by removing nested `<a>` tags and applying className directly

### Code Quality Improvements
- **TypeScript Enhancements**: Better type definitions and improved type safety across components
- **Linting Compliance**: All components now pass linting checks with no errors
- **Component Architecture**: Improved component structure and prop handling patterns

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

### Key Components

#### UI Components (`components/ui/`)
- **Card System**: Flexible card components with proper className merging
- **Form Elements**: Consistent form styling and validation patterns
- **Layout Components**: Responsive layout utilities and containers

#### Authentication System (`app/(auth)/`)
- **Login/Register**: User authentication flows with Supabase integration
- **Route Protection**: Secure routing with proper authentication checks
- **Context Management**: Global auth state management with React Context

#### Poll Management (`app/polls/`)
- **Poll Creation**: Dynamic poll creation with multiple choice options
- **Real-time Results**: Live voting and result updates
- **QR Code Sharing**: Easy poll sharing via QR codes

## Development Status

### Completed Features ✅
- Basic authentication system with Supabase
- Poll creation and management interface
- Real-time voting system
- QR code generation for polls
- Responsive UI components
- Next.js 15 compatibility fixes
- Component architecture improvements

### Planned Improvements 🚧
- Enhanced UI/UX design and animations
- Advanced authentication features (OAuth, 2FA)
- Poll analytics and reporting
- User profile management
- Advanced poll types and customization
- Mobile app development
- API rate limiting and security enhancements

## Contribution Guide

- Use conventional commits for all changes
- Open draft PRs early for feedback
- Add context and screenshots for UI changes
- Ensure all code passes linting and type-checking
- Test changes across different devices and browsers
- Follow the established component patterns

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
