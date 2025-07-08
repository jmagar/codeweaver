<!--
---
name: New React Component
description: A template for creating a new React component (server or client).
---
-->

### Server Component Example

Server components are the default in the Next.js App Router. They can directly fetch data and should be used whenever a component does not require interactivity or browser-only APIs.

```typescript
import { trpc } from '@/lib/trpc/server';

/**
 * @component
 * Props for the {{name}} server component.
 * @param {string} props.itemId - The ID of the item to display.
 */
interface {{name}}Props {
  itemId: string;
}

/**
 * @component
 * A server component to display data for a specific item.
 * It fetches data directly on the server using tRPC.
 */
const {{name}} = async ({ itemId }: {{name}}Props) => {
  // Fetch data directly using the server-side tRPC client
  const item = await trpc.item.getById({ id: itemId });

  if (!item) {
    return <div data-testid="{{name}}-not-found">Item not found.</div>;
  }

  return (
    <div className="p-4 border rounded-lg shadow-md" data-testid="{{name}}">
      <h2 className="text-xl font-bold">{item.name}</h2>
      <p className="text-gray-600">{item.description}</p>
      {/* This component cannot have state or effects (e.g., useState, useEffect) */}
    </div>
  );
};

export default {{name}};
```

---

### Client Component Example

Client components are needed for interactivity (e.g., state, event handlers) or browser-specific APIs. They are designated by the `'use client'` directive.

```typescript
'use client';

import { trpc } from '@/lib/trpc/client';
import { useState, useCallback } from 'react';

/**
 * @component
 * Props for the {{name}} client component.
 * @param {string} props.initialItemId - The initial ID for the item.
 */
interface {{name}}ClientProps {
  initialItemId: string;
}

/**
 * @component
 * An interactive client component for managing an item.
 */
const {{name}}Client = ({ initialItemId }: {{name}}ClientProps) => {
  const [itemId, setItemId] = useState(initialItemId);
  const [updateCount, setUpdateCount] = useState(0);
  const utils = trpc.useUtils();

  // Fetch data using tRPC hooks
  const { data: item, isLoading, error } = trpc.item.getById.useQuery(
    { id: itemId },
    {
      // Options like `enabled` can control when the query runs
      enabled: !!itemId,
    }
  );

  // tRPC mutation for updates
  const updateItem = trpc.item.update.useMutation({
    onSuccess: () => {
      // Invalidate the query to refetch data
      utils.item.getById.invalidate({ id: itemId });
      // Use functional update to prevent stale state
      setUpdateCount(prevCount => prevCount + 1);
    },
  });

  const handleUpdate = useCallback(() => {
    updateItem.mutate({ id: itemId, data: { name: 'New Name' } });
  }, [itemId, updateItem]);

  if (isLoading) {
    return <div data-testid="{{name}}-loading">Loading item...</div>;
  }

  if (error) {
    return <div className="text-red-500" data-testid="{{name}}-error">Error: {error.message}</div>;
  }

  return (
    <div className="p-4 border rounded-lg shadow-md" data-testid="{{name}}">
      <h2 className="text-xl font-bold">{item?.name}</h2>
      <p className="text-gray-600">{item?.description}</p>
      <p className="text-sm text-gray-500 mt-2">Updated {updateCount} times.</p>
      <button
        onClick={handleUpdate}
        disabled={updateItem.isLoading}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        data-testid="update-item-button"
      >
        {updateItem.isLoading ? 'Updating...' : 'Update Name'}
      </button>
    </div>
  );
};

export default {{name}}Client;
``` 