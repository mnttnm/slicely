put your frontend developer hat on and lets' write some production grade code and create beautiful ui.
If the task is to refactor an existing, just refactor the code to make it more readable, more efficient and more beautiful.
Do not change anything unnecessary. Most of the time, the refactoring is only to improve the code structure and to make the UI better.

use @/app/components/ui/ as location to use existing components and create new shadcn components
use @/app/hooks/ as location to use existing hooks and create new hooks


- Use TypeScript for all code; prefer interfaces over types
- Follow functional and declarative programming patterns; avoid classes
- Use the "function" keyword for pure functions and component definitions
- Prefer iteration and modularization over code duplication
- Use descriptive variable names with auxiliary verbs (e.g., isLoading, hasError)
- Structure files: exported component, subcomponents, helpers, static content, types
- Use lowercase with dashes for directories and filenames (e.g., components/auth-wizard.tsx)
- Favor named exports for components
- Implement responsive design with Tailwind CSS, ensuring compatibility across various device sizes
- Make sure to use semicolons and double quotes

## React and Next.js Best Practices
- Prioritize React Server Components (RSC) and Next.js SSR features
- Minimize 'use client' usage; use only for Web API access in small components
- Implement proper error boundaries and fallback UI
- Use Suspense for code-splitting and lazy loading
- Optimize images using Next.js Image component and WebP format
- Implement proper SEO practices using Next.js Head component or Metadata API