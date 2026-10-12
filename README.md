# AirportOps — Barcelona-El Prat

A browser-based airport operations management simulator built with React, TypeScript, Vite and Supabase.

## Current MVP
- Operational dashboard and navigation
- Simulated flight board with search and status filters
- Pause / 1x / 2x / 5x simulation clock
- Gate and stand assignment with overlap and aircraft compatibility checks
- Demo data clearly marked as simulated
- Optional Supabase client configuration
- SQL migration starter with Row Level Security

## Run locally
Requires Node.js 20+.

```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

## Supabase
1. Create a Supabase project.
2. Copy `.env.example` to `.env.local`.
3. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Run `supabase/migrations/001_initial_schema.sql` in the Supabase SQL Editor.

The current demo game runs without Supabase. Until persistence is wired to the game repository, the interface will explicitly indicate that the session is running in demo/local mode. Never put a service-role key in frontend environment variables.

## Deploy to GitHub and Vercel
Upload the project files to a GitHub repository. In Vercel, import that repository, use the Vite defaults, and set the two environment variables if using Supabase.
