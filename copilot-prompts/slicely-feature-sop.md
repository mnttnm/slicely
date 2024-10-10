Follow this SOP when adding a new feature to Slicely. Make sure to make all the changes


# Standard Operating Procedure for Adding a New Feature to Slicely

## 1. Routing and Page Creation

**Q: Does this feature require a new route or page?**

If yes, follow these steps:

- [ ] Create a new folder under `src/app/(pages)/`
  ```bash
  mkdir src/app/(pages)/new-feature
  ```
- [ ] Create a `page.tsx` file in that folder
  ```bash
  touch src/app/(pages)/new-feature/page.tsx
  ```
- [ ] Add basic content to the page file
  ```typescript
  "use client";

  import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/app/components/ui/breadcrumb";

  export default function NewFeaturePage() {
    return (
      <div className="p-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>New Feature</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-xl mt-4">New Feature</h1>
        {/* Add your feature content here */}
      </div>
    );
  }
  ```

## 2. Backend Functionality

**Q: Does this feature require server-side logic?**

If yes, proceed to steps 3-5. If no, skip to step 6.

## 3. Database Schema

**Q: Does this feature require changes to the database schema?**

If yes:

- [ ] Update the Supabase schema in the Supabase dashboard (manually)
- [ ] Update the TypeScript types in `src/types/supabase-types/database.types.ts` (manually)

  ```typescript
  export interface Database {
    public: {
      Tables: {
        // ... existing tables
        new_feature: {
          Row: {
            id: string;
            name: string;
            created_at: string;
            user_id: string;
          };
          Insert: {
            id?: string;
            name: string;
            created_at?: string;
            user_id: string;
          };
          Update: {
            id?: string;
            name?: string;
            created_at?: string;
            user_id?: string;
          };
        };
      };
      // ... rest of the file
    };
  }
  ```

## 4. Server Actions

**Q: Are server actions needed for database operations?**

If yes:

- [ ] Create a new file `src/server/actions/new-feature/actions.ts`
- [ ] Implement server actions

  ```typescript
  "use server";

  import { createClient } from "@/server/services/supabase/server";
  import { Tables } from "@/types/supabase-types/database.types";

  export async function createNewFeature(data: { name: string }): Promise<Tables<"new_feature">> {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Authentication failed");
    }

    const { data: newFeature, error } = await supabase
      .from("new_feature")
      .insert({ ...data, user_id: user.id })
      .select()
      .single();

    if (error) {
      console.error("Error creating new feature:", error);
      throw new Error("Failed to create new feature");
    }

    return newFeature;
  }
  ```

## 5. Database Migration

**Q: Have there been changes to the database schema?**

If yes:

- [ ] Apply the changes in the Supabase dashboard (manually)
- [ ] Update local types by running: (manually)
  ```bash
  npm run generate:types
  ```

## 6. UI Components

**Q: Does this feature require new UI components?**

If yes:

- [ ] Check if required components exist in `src/app/components/ui/`
- [ ] If not, add using the Shadcn CLI
  ```bash
  npx shadcn@latest add card
  ```

## 7. Implement UI

**Q: Is it time to implement the user interface?**

If yes:

- [ ] Update `src/app/(pages)/new-feature/page.tsx`
- [ ] Implement the UI structure using Tailwind CSS for styling

  ```typescript
  "use client";

  import { useState } from "react";
  import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/app/components/ui/breadcrumb";
  import { Card } from "@/app/components/ui/card";
  import { Button } from "@/app/components/ui/button";
  import { Input } from "@/app/components/ui/input";
  import { createNewFeature } from "@/server/actions/new-feature/actions";
  import { useToast } from "@/app/hooks/use-toast";

  export default function NewFeaturePage() {
    const [name, setName] = useState("");
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        await createNewFeature({ name });
        toast({
          title: "Success",
          description: "New feature created successfully",
        });
        setName("");
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to create new feature",
          variant: "destructive",
        });
      }
    };

    return (
      <div className="p-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>New Feature</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-xl mt-4 mb-6">New Feature</h1>
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Feature name"
              className="w-full"
            />
            <Button type="submit" className="w-full">Create Feature</Button>
          </form>
        </Card>
      </div>
    );
  }
  ```

## 8. Component Breakdown

**Q: Can the UI be broken down into smaller, reusable components?**

If yes:

- [ ] For generic components, create them in `src/app/components/`
- [ ] For feature-specific components, keep them in `src/app/(pages)/new-feature/`

Example of a reusable component:
``` typescript
// src/app/components/FeatureForm.tsx
"use client";
import { useState } from "react";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
interface FeatureFormProps {
onSubmit: (name: string) => Promise<void>;
}
export function FeatureForm({ onSubmit }: FeatureFormProps) {
const [name, setName] = useState("");
const handleSubmit = async (e: React.FormEvent) => {
e.preventDefault();
await onSubmit(name);
setName("");
};
return (
<Card className="p-6">
<form onSubmit={handleSubmit} className="space-y-4">
<Input
type="text"
value={name}
onChange={(e) => setName(e.target.value)}
placeholder="Feature name"
className="w-full"
/>
<Button type="submit" className="w-full">Create Feature</Button>
</form>
</Card>
);
}
```
## 9. Data Fetching

**Q: Does this feature require server-side data fetching?**

If yes:

- [ ] Create a new server action for fetching data
- [ ] Use the action in your component

  ```typescript
  // src/server/actions/new-feature/actions.ts
  export async function getNewFeatures(): Promise<Tables<"new_feature">[]> {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Authentication failed");
    }

    const { data: features, error } = await supabase
      .from("new_feature")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching new features:", error);
      throw new Error("Failed to fetch new features");
    }

    return features;
  }

  // Usage in component:
  // src/app/(pages)/new-feature/page.tsx
  "use client";

  import { useEffect, useState } from "react";
  import { FeatureForm } from "@/app/components/FeatureForm";
  import { createNewFeature, getNewFeatures } from "@/server/actions/new-feature/actions";
  import { useToast } from "@/app/hooks/use-toast";
  import { Tables } from "@/types/supabase-types/database.types";

  export default function NewFeaturePage() {
    const [features, setFeatures] = useState<Tables<"new_feature">[]>([]);
    const { toast } = useToast();

    useEffect(() => {
      fetchFeatures();
    }, []);

    const fetchFeatures = async () => {
      try {
        const fetchedFeatures = await getNewFeatures();
        setFeatures(fetchedFeatures);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch features",
          variant: "destructive",
        });
      }
    };

    const handleSubmit = async (name: string) => {
      try {
        await createNewFeature({ name });
        toast({
          title: "Success",
          description: "New feature created successfully",
        });
        fetchFeatures();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to create new feature",
          variant: "destructive",
        });
      }
    };

    return (
      <div className="p-4">
        <h1 className="text-xl mb-6">New Feature</h1>
        <FeatureForm onSubmit={handleSubmit} />
        <ul className="mt-6 space-y-2">
          {features.map((feature) => (
            <li key={feature.id} className="bg-gray-100 p-2 rounded">{feature.name}</li>
          ))}
        </ul>
      </div>
    );
  }
  ```

## 10. Custom Hooks

**Q: Can logic be abstracted into custom hooks?**

If yes:

- [ ] Create a new hook in `src/app/hooks/useNewFeature.ts`
- [ ] Implement and use the hook in your component

  ```typescript
  // src/app/hooks/useNewFeature.ts
  import { useState, useEffect } from "react";
  import { Tables } from "@/types/supabase-types/database.types";
  import { createNewFeature, getNewFeatures } from "@/server/actions/new-feature/actions";
  import { useToast } from "@/app/hooks/use-toast";

  export function useNewFeature() {
    const [features, setFeatures] = useState<Tables<"new_feature">[]>([]);
    const { toast } = useToast();

    const fetchFeatures = async () => {
      try {
        const fetchedFeatures = await getNewFeatures();
        setFeatures(fetchedFeatures);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch features",
          variant: "destructive",
        });
      }
    };

    const addFeature = async (name: string) => {
      try {
        await createNewFeature({ name });
        toast({
          title: "Success",
          description: "New feature created successfully",
        });
        fetchFeatures();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to create new feature",
          variant: "destructive",
        });
      }
    };

    useEffect(() => {
      fetchFeatures();
    }, []);

    return { features, addFeature };
  }
  ```

## 11. Error Handling

**Q: Have error boundaries been implemented for this feature?**

If no:

- [ ] Create `src/app/(pages)/new-feature/error.tsx`
- [ ] Implement error boundary component

  ```typescript
  // src/app/(pages)/new-feature/error.tsx
  "use client";

  import { useEffect } from "react";
  import { useToast } from "@/app/hooks/use-toast";
  import { Button } from "@/app/components/ui/button";

  export default function ErrorBoundary({
    error,
    reset,
  }: {
    error: Error;
    reset: () => void;
  }) {
    const { toast } = useToast();

    useEffect(() => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }, [error, toast]);

    return (
      <div className="p-4 text-center">
        <h2 className="text-xl mb-4">Something went wrong!</h2>
        <Button onClick={() => reset()} variant="outline">
          Try again
        </Button>
      </div>
    );
  }
  ```

## 12. Form Validation

**Q: Does this feature include forms that require validation?**

If yes:

- [ ] Use Zod for schema validation
- [ ] Implement form validation using the schema

  ```typescript
  // src/app/schemas/new-feature-schema.ts
  import { z } from "zod";

  export const newFeatureSchema = z.object({
    name: z
      .string()
      .min(3, "Name must be at least 3 characters long")
      .max(50, "Name must not exceed 50 characters"),
  });

  // Usage in component:
  // src/app/components/FeatureForm.tsx
  "use client";

  import { useForm } from "react-hook-form";
  import { zodResolver } from "@hookform/resolvers/zod";
  import { newFeatureSchema } from "@/app/schemas/new-feature-schema";
  import { Card } from "@/app/components/ui/card";
  import { Button } from "@/app/components/ui/button";
  import { Input } from "@/app/components/ui/input";
  import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/app/components/ui/form";

  interface FeatureFormProps {
    onSubmit: (name: string) => Promise<void>;
  }

  export function FeatureForm({ onSubmit }: FeatureFormProps) {
    const form = useForm({
      resolver: zodResolver(newFeatureSchema),
      defaultValues: {
        name: "",
      },
    });

    const handleSubmit = form.handleSubmit(async (data) => {
      await onSubmit(data.name);
      form.reset();
    });

    return (
      <Card className="p-6">
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Feature Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter feature name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">Create Feature</Button>
          </form>
        </Form>
      </Card>
    );
  }
  ```

## 13. Documentation

**Q: Has the documentation been updated to reflect this new feature?**

If no:

- [ ] Update `README.md`
- [ ] Add any necessary API documentation

  ```markdown
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

  Response:

  ```json
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Feature Name",
    "created_at": "2023-04-01T12:00:00Z",
    "user_id": "user_123"
  }
  ```
  ```

## Things to keep in mind while going through the steps:
- @cursorrules
- Do not create a new action or a UI component unless it does not already exist.
- Once the feature is complete, go through the checklist and check off the steps as you go.
- [ ] New route and page created (if applicable)
- [ ] Backend functionality implemented (if needed)
- [ ] Database schema updated in Supabase (if required)
- [ ] Server actions created for data operations
- [ ] UI components added and implemented
- [ ] Client-side interactivity added (if needed)
- [ ] Custom hooks created for reusable logic
- [ ] Error handling and boundaries set up
- [ ] Form validation implemented (if applicable)
- [ ] Documentation updated
- [ ] Notification system (toast) used where appropriate