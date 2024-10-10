# Standard Operating Procedure for Adding a New Feature to a Next.js Project

## 1. Routing and Page Creation

**Q: Does this feature require a new route or page?**

If yes, follow these steps:

- [ ] Create a new folder under `app/`
  ```bash
  # Example
  mkdir app/new-feature
  ```
- [ ] Create a `page.tsx` file in that folder
  ```bash
  # Example
  touch app/new-feature/page.tsx
  ```
- [ ] Add basic content to the page file
  ```typescript
  // Example: app/new-feature/page.tsx
  export default function NewFeaturePage() {
    return (
      <div>
        <h1>New Feature</h1>
        {/* Add your feature content here */}
      </div>
    )
  }
  ```

## 2. Backend Functionality

**Q: Does this feature require server-side logic?**

If yes, proceed to steps 3-5. If no, skip to step 6.

## 3. Database Schema

**Q: Does this feature require changes to the database schema?**

If yes:

- [ ] Open `lib/db.ts`
- [ ] Add or modify the schema for the new feature

  ```typescript
  // Example: lib/db.ts
  import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

  export const newFeatureTable = pgTable("new_feature", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  });
  ```

## 4. Server Actions

**Q: Are server actions needed for database operations?**

If yes:

- [ ] Create a new file `app/new-feature/actions.ts`
- [ ] Implement server actions

  ```typescript
  // Example: app/new-feature/actions.ts
  "use server";

  import { db } from "@/lib/db";
  import { newFeatureTable } from "@/lib/db";
  import { revalidatePath } from "next/cache";
  import { showNotification } from "@/lib/notifications";

  export async function createNewFeature(data: { name: string }) {
    try {
      const result = await db.insert(newFeatureTable).values(data).returning();
      revalidatePath("/new-feature"); // Revalidate the page
      showNotification("success", "Feature created successfully");
      return result;
    } catch (error) {
      showNotification("error", "Failed to create feature");
      throw error;
    }
  }
  ```

## 5. Database Migration

**Q: Have there been changes to the database schema?**

If yes:

- [ ] Run Drizzle migration
  ```bash
  # Example
  npx drizzle-kit push:pg
  ```

## 6. UI Components

**Q: Does this feature require new UI components?**

If yes:

- [ ] Check if required components exist in `components/ui/`
- [ ] If not, add using the Shadcn CLI
  ```bash
  # Example
  npx shadcn-ui@latest add card
  ```

## 7. Implement UI

**Q: Is it time to implement the user interface?**

If yes:

- [ ] Open `app/new-feature/page.tsx`
- [ ] Implement the UI structure

  ```typescript
  // Example: app/new-feature/page.tsx
  import { Card } from '@/components/ui/card'
  import { createNewFeature } from './actions'

  export default function NewFeaturePage() {
    async function handleSubmit(formData: FormData) {
      'use server'
      const name = formData.get('name') as string
      await createNewFeature({ name })
    }

    return (
      <div>
        <h1>New Feature</h1>
        <Card>
          <form action={handleSubmit}>
            <input type="text" name="name" placeholder="Feature name" />
            <button type="submit">Create Feature</button>
          </form>
        </Card>
      </div>
    )
  }
  ```

## 8. Component Breakdown

**Q: Can the UI be broken down into smaller, reusable components?**

If yes:

- [ ] For generic components, create them in `app/common/`
- [ ] For feature-specific components, keep them in `app/new-feature/`

Example of a reusable component:

```typescript
// Example: app/common/FeatureForm.tsx
'use client'

import { Card } from '@/components/ui/card'

interface FeatureFormProps {
  onSubmit: (formData: FormData) => Promise<void>
}

export function FeatureForm({ onSubmit }: FeatureFormProps) {
  return (
    <Card>
      <form action={onSubmit}>
        <input type="text" name="name" placeholder="Feature name" />
        <button type="submit">Create Feature</button>
      </form>
    </Card>
  )
}
```

## 9. Data Fetching

**Q: Does this feature require server-side data fetching?**

If yes:

- [ ] Make the component async and fetch data

  ```typescript
  // Example: app/new-feature/page.tsx
  import { db } from '@/lib/db'
  import { newFeatureTable } from '@/lib/db'
  import { FeatureForm } from '@/app/common/FeatureForm'

  export default async function NewFeaturePage() {
    const features = await db.select().from(newFeatureTable);

    async function handleSubmit(formData: FormData) {
      'use server'
      // ... (same as before)
    }

    return (
      <div>
        <h1>New Feature</h1>
        <FeatureForm onSubmit={handleSubmit} />
        <ul>
          {features.map(feature => (
            <li key={feature.id}>{feature.name}</li>
          ))}
        </ul>
      </div>
    )
  }
  ```

## 10. Client-side Interactivity

**Q: Does the feature require client-side interactivity?**

If yes:

- [ ] Convert to a client component using `'use client'`
- [ ] Implement necessary state and event handlers

  ```typescript
  // Example: app/new-feature/ClientComponent.tsx
  'use client'

  import { useState } from 'react'
  import { FeatureForm } from '@/app/common/FeatureForm'
  import { createNewFeature } from './actions'

  export function ClientComponent() {
    const [features, setFeatures] = useState<{ id: number; name: string }[]>([])

    async function handleSubmit(formData: FormData) {
      const name = formData.get('name') as string
      const newFeature = await createNewFeature({ name })
      setFeatures(prev => [...prev, newFeature])
    }

    return (
      <div>
        <FeatureForm onSubmit={handleSubmit} />
        <ul>
          {features.map(feature => (
            <li key={feature.id}>{feature.name}</li>
          ))}
        </ul>
      </div>
    )
  }
  ```

## 11. Custom Hooks

**Q: Can logic be abstracted into custom hooks?**

If yes:

- [ ] Create a new hook in `app/hooks/useNewFeature.ts`
- [ ] Implement and use the hook in your component

  ```typescript
  // Example: app/hooks/useNewFeature.ts
  import { useState } from "react";
  import { createNewFeature } from "@/app/new-feature/actions";

  export function useNewFeature() {
    const [features, setFeatures] = useState<{ id: number; name: string }[]>(
      [],
    );

    async function addFeature(name: string) {
      const newFeature = await createNewFeature({ name });
      setFeatures((prev) => [...prev, newFeature]);
    }

    return { features, addFeature };
  }

  // Usage in component:
  // Example: app/new-feature/ClientComponent.tsx
  ("use client");

  import { useNewFeature } from "@/app/hooks/useNewFeature";
  import { FeatureForm } from "@/app/common/FeatureForm";

  export function ClientComponent() {
    const { features, addFeature } = useNewFeature();

    async function handleSubmit(formData: FormData) {
      const name = formData.get("name") as string;
      await addFeature(name);
    }

    // ... rest of the component
  }
  ```

## 12. Utility Functions

**Q: Are there any utility functions needed for this feature?**

If yes:

- [ ] Open `lib/utils.ts`
- [ ] Add new utility functions

  ```typescript
  // Example: lib/utils.ts
  export function formatFeatureName(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  }

  export function validateFeatureName(name: string): boolean {
    return name.length >= 3 && name.length <= 50;
  }
  ```

## 13. Route Protection

**Q: Does this feature require authentication or authorization?**

If yes:

- [ ] Move the feature to the `(protected)` folder structure
  ```bash
  # Example
  mv app/new-feature app/(protected)/new-feature
  ```
- [ ] Implement necessary auth checks

  ```typescript
  // Example: app/(protected)/new-feature/page.tsx
  import { getServerSession } from "next-auth/next";
  import { redirect } from "next/navigation";

  export default async function ProtectedNewFeaturePage() {
    const session = await getServerSession();
    if (!session) {
      redirect("/login");
    }

    // ... rest of the component
  }
  ```

## 14. Navigation Update

**Q: Should this feature be accessible from the main navigation?**

If yes:

- [ ] Update `app/common/Header.tsx` to include the new feature

  ```typescript
  // Example: app/common/Header.tsx
  import Link from 'next/link'

  export function Header() {
    return (
      <header>
        <nav>
          <Link href="/">Home</Link>
          <Link href="/new-feature">New Feature</Link>
          {/* Other navigation items */}
        </nav>
      </header>
    )
  }
  ```

## 15. Error Handling

**Q: Have error boundaries been implemented for this feature?**

If no:

- [ ] Create `app/new-feature/error.tsx`
- [ ] Implement error boundary component

  ```typescript
  // Example: app/new-feature/error.tsx
  'use client'

  import { useEffect } from 'react'
  import { showNotification } from '@/lib/notifications'

  export default function ErrorBoundary({
    error,
    reset,
  }: {
    error: Error
    reset: () => void
  }) {
    useEffect(() => {
      showNotification('error', error.message)
    }, [error])

    return (
      <div>
        <h2>Something went wrong!</h2>
        <button onClick={() => reset()}>Try again</button>
      </div>
    )
  }
  ```

## 16. Form Validation

**Q: Does this feature include forms that require validation?**

If yes:

- [ ] Create a schema in `schemas/form-schemas.ts`
- [ ] Implement form validation using the schema

  ```typescript
  // Example: schemas/form-schemas.ts
  import { z } from "zod";

  export const newFeatureSchema = z.object({
    name: z
      .string()
      .min(3, "Name must be at least 3 characters long")
      .max(50, "Name must not exceed 50 characters"),
  });

  // Usage in component:
  // Example: app/new-feature/ClientComponent.tsx
  ("use client");

  import { useForm } from "react-hook-form";
  import { zodResolver } from "@hookform/resolvers/zod";
  import { newFeatureSchema } from "@/schemas/form-schemas";

  export function ClientComponent() {
    const {
      register,
      handleSubmit,
      formState: { errors },
    } = useForm({
      resolver: zodResolver(newFeatureSchema),
    });

    // ... rest of the component
  }
  ```

## 17. Environment Variables

**Q: Does this feature require new environment variables?**

If yes:

- [ ] Update `.env` and `.env.example`
  ```
  # Example: .env and .env.example
  NEW_FEATURE_API_KEY=your_api_key_here
  ```
- [ ] Update `schemas/env.ts`

  ```typescript
  // Example: schemas/env.ts
  import { z } from "zod";

  export const envSchema = z.object({
    // ... existing env variables
    NEW_FEATURE_API_KEY: z.string().min(1),
  });

  export const env = envSchema.parse(process.env);
  ```

- [ ] Use the new environment variable in your code

  ```typescript
  // Example usage
  import { env } from "@/schemas/env";

  const apiKey = env.NEW_FEATURE_API_KEY;
  ```

## 18. Testing

**Q: Have tests been written for this new feature?**

If no:

- [ ] Create a new test file `__tests__/new-feature.test.tsx`
- [ ] Write unit and integration tests

  ```typescript
  // Example: __tests__/new-feature.test.tsx
  import { render, screen } from '@testing-library/react'
  import '@testing-library/jest-dom'
  import NewFeaturePage from '@/app/new-feature/page'

  describe('NewFeaturePage', () => {
    it('renders the page title', () => {
      render(<NewFeaturePage />)
      expect(screen.getByRole('heading', { name: /new feature/i })).toBeInTheDocument()
    })

    // Add more tests...
  })
  ```

## 19. Documentation

**Q: Has the documentation been updated to reflect this new feature?**

If no:

- [ ] Update `README.md`
- [ ] Add any necessary API documentation

  ````markdown
  # Example README.md update

  ## New Feature

  This feature allows users to create and manage new items.

  ### API

  #### `POST /api/new-feature`

  Creates a new feature item.

  Request body:

  ```json
  {
    "name": "Feature Name"
  }
  ```
  ````

  Response:

  ```json
  {
    "id": 1,
    "name": "Feature Name",
    "createdAt": "2023-04-01T12:00:00Z"
  }
  ```

  ## 20. Notifications

  **Q: Does this feature need to show notifications to the user?**

  If yes:

  - [ ] Create a global notification handler in `lib/notifications.ts`

    ```typescript
    // Example: lib/notifications.ts
    import { toast } from "react-toastify";

    type NotificationType = "success" | "error" | "info" | "warning";

    export function showNotification(type: NotificationType, message: string) {
      toast[type](message, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
    ```

  - [ ] Use the notification handler in server actions and UI components

    ```typescript
    // Example usage in server action
    // app/new-feature/actions.ts
    'use server'

    import { showNotification } from '@/lib/notifications'

    export async function createNewFeature(data: { name: string }) {
      try {
        const result = await db.insert(newFeatureTable).values(data).returning();
        showNotification('success', 'Feature created successfully');
        return result;
      } catch (error) {
        showNotification('error', 'Failed to create feature');
        throw error;
      }
    }

    // Example usage in UI component
    // app/new-feature/ClientComponent.tsx
    'use client'

    import { useState } from 'react'
    import { showNotification } from '@/lib/notifications'

    export function ClientComponent() {
      const [name, setName] = useState('')

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
          await createNewFeature({ name })
          setName('')
          showNotification('success', 'Feature created successfully')
        } catch (error) {
          showNotification('error', 'Failed to create feature')
        }
      }

      return (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Feature name"
          />
          <button type="submit">Create Feature</button>
        </form>
      )
    }
    ```

  - [ ] Add the ToastContainer to your app layout

    ```typescript
    // Example: app/layout.tsx
    import { ToastContainer } from 'react-toastify'
    import 'react-toastify/dist/ReactToastify.css'

    export default function RootLayout({
      children,
    }: {
      children: React.ReactNode
    }) {
      return (
        <html lang="en">
          <body>
            {children}
            <ToastContainer />
          </body>
        </html>
      )
    }
    ```

Remember to commit your changes regularly and follow the existing coding style and best practices of the project. This SOP provides a comprehensive guide, but you may need to adjust some steps based on the specific requirements of your new feature.

## Final Checklist

Before considering the feature complete, ensure you've addressed all the following points:

- [ ] New route and page created (if applicable)
- [ ] Backend functionality implemented (if needed)
- [ ] Database schema updated and migrated (if required)
- [ ] Server actions created for data operations
- [ ] UI components added and implemented
- [ ] Client-side interactivity added (if needed)
- [ ] Custom hooks created for reusable logic
- [ ] Utility functions added (if needed)
- [ ] Route protection implemented (if required)
- [ ] Navigation updated to include new feature
- [ ] Error handling and boundaries set up
- [ ] Form validation implemented (if applicable)
- [ ] Environment variables added and used securely
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] Notification system implemented and used where appropriate

After completing all these steps, your new feature should be well-integrated into the Next.js project, following best practices and maintaining consistency with the existing codebase.
