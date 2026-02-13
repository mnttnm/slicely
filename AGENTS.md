# Repository Guidelines

## Project Structure & Module Organization
Application code lives in `src/`. Use `src/app/` for Next.js App Router pages, layouts, hooks, and UI components (including `src/app/components/ui/`). Put server-side actions and service logic in `src/server/`, shared integrations in `src/lib/`, and domain services in `src/services/`. Database artifacts are under `supabase/` (`migrations/`, `seed.sql`, `config.toml`). Utility scripts belong in `scripts/`. CI workflow definitions are in `.github/workflows/`.

## Build, Test, and Development Commands
- `npm run dev`: start local development server.
- `npm run build`: production build validation.
- `npm run start`: run the built app.
- `npm run lint`: run ESLint checks.
- `npm run check-format`: verify Prettier formatting.
- `npx tsc --noEmit`: run strict TypeScript checks.
- `npm run generate:types`: regenerate Supabase types into `src/types/supabase-types/database.types.ts`.
- `npx tsx scripts/generate-embeddings.ts`: run the embeddings utility script.

## Coding Style & Naming Conventions
Use TypeScript with strict typing and explicit error handling. Formatting is Prettier-driven: 2-space indentation, semicolons, double quotes, trailing commas (`es5`), and 100-character line width. ESLint extends `next/core-web-vitals` and enforces style rules such as arrow callbacks and template literals. Name `*.ts`/`*.tsx` files and folders in kebab-case (for example, `pdf-processing-service.ts`). Prefer `@/*` imports for modules under `src/`.

## Testing Guidelines
There is no dedicated unit/integration test framework configured yet. Treat the quality gate as:
1. Lint (`npm run lint`)
2. Format check (`npm run check-format`)
3. Type check (`npx tsc --noEmit`)
4. Build (`npm run build`)
For UI-heavy changes, include manual verification steps for critical flows (upload, studio, dashboard, auth callback).

## Commit & Pull Request Guidelines
Follow concise, imperative commit messages with a conventional prefix when possible (examples from history: `feat: ...`, `fix: ...`). Keep each commit focused. PRs should include: a short summary, linked issue/task, screenshots for UI changes, notes on env/config updates, and confirmation that CI checks pass (`lint`, `format`, `typecheck`, `build`).

## Security & Configuration Tips
Never commit secrets. Use `.env.local` for local development and keep `.env.example` up to date when adding variables. Supabase and OpenAI keys are required for full functionality; CI uses placeholder values only for build verification.
