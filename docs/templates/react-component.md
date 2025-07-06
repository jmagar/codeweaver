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
import { FC } from 'react';

/**
 * Props for the {{name}} server component.
 */
interface {{name}}Props {
  itemId: string;
}

/**
 * A server component to display data for a specific item.
 * It fetches data directly on the server using tRPC.
 */
const {{name}}: FC<{{name}}Props> = async ({ itemId }) => {
  // Fetch data directly using the server-side tRPC client
  const item = await trpc.item.getById({ id: itemId });

  if (!item) {
    return <div>Item not found.</div>;
  }

  return (
    <div className="p-4 border rounded-lg shadow-md">
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
import { FC, useState } from 'react';

/**
 * Props for the {{name}} client component.
 */
interface {{name}}ClientProps {
  initialItemId: string;
}

/**
 * An interactive client component for managing an item.
 */
const {{name}}Client: FC<{{name}}ClientProps> = ({ initialItemId }) => {
  const [itemId, setItemId] = useState(initialItemId);

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
      trpc.useUtils().item.getById.invalidate({ id: itemId });
    },
  });

  const handleUpdate = () => {
    updateItem.mutate({ id: itemId, data: { name: 'New Name' } });
  };

  if (isLoading) {
    return <div>Loading item...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="p-4 border rounded-lg shadow-md">
      <h2 className="text-xl font-bold">{item?.name}</h2>
      <p className="text-gray-600">{item?.description}</p>
      <button
        onClick={handleUpdate}
        disabled={updateItem.isLoading}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        {updateItem.isLoading ? 'Updating...' : 'Update Name'}
      </button>
    </div>
  );
};

export default {{name}}Client;
``` 