<!--
---
name: New Prisma Model
description: A template for creating a new model in the `schema.prisma` file.
---
-->

```prisma
/// Represents a {{name}} in the system.
model {{name}} {
  /// Unique identifier for the {{name}}.
  id        String   @id @default(cuid())

  /// The name of the {{name}}.
  name      String

  /// A description of the {{name}}.
  description String?

  /// The user who created this {{name}}.
  /// This establishes a one-to-many relationship with the User model.
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String

  /// Timestamps for record management.
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // @@index([userId])
}

// Remember to add the other side of the relation to the User model:
// model User {
//   ...
//   {{name_lowercase}}s {{name}}[]
// }
```

### Notes on Usage:
- **`{{name}}`**: Replace this with the `PascalCase` name of your model (e.g., `Project`, `ChatMessage`).
- **`{{name_lowercase}}`**: Replace this with the `camelCase`, pluralized version for the relation field (e.g., `projects`, `chatMessages`).
- **Relations**: This template assumes a one-to-many relationship with the `User` model. Adjust the `@relation` attribute as needed for different relationships.
- **`@id @default(cuid())`**: Uses CUIDs for primary keys, which is a good practice for web applications.
- **`onDelete: Cascade`**: This will automatically delete all related `{{name}}` records if a `User` is deleted. Be mindful of this and change it if it's not the desired behavior.
- **Indexes**: Uncomment the `@@index` line if you plan to frequently query `{{name}}` records by `userId`.
- **Run `pnpm db:generate`** after adding a new model to update the Prisma Client.
- **Run `pnpm db:push` or create a new migration** to apply the schema changes to your database.
``` 