<Climb>
  <header>
    <id>fa4r</id>
    <type>task</type>
    <description>Align the project's directory structure to EXACTLY match the specifications in `docs/directory-structure.md`.</description>
  </header>
  <newDependencies>None anticipated, as this is a structural refactoring. The packages mentioned in the guide (`pnpm`, `turbo`, `typescript`, etc.) are expected to be part of the project's existing dev stack.</newDependencies>
  <prerequisiteChanges>The primary prerequisite is the `docs/directory-structure.md` file, which will serve as the blueprint. No other changes are required before starting.</prerequisiteChanges>
  <relevantFiles>
    - `docs/directory-structure.md` (The source of truth)
    - The entire project root, as many files and directories will be created or moved.
    - `pnpm-workspace.yaml` (Will be created/modified to define the workspace)
    - `turbo.json` (Will be created/modified)
    - All `package.json` files at the root and in each package/app.
    - All `tsconfig.json` files.
  </relevantFiles>
  <everythingElse>
    ## Feature Overview
    This task involves a comprehensive restructuring of the entire monorepo to align with the canonical directory structure defined in the project's documentation. The goal is to establish a clean, scalable, and maintainable foundation for future development.

    ## Requirements
    ### Functional Requirements
    1.  The final directory structure must be an exact match of the layout described in `docs/directory-structure.md`.
    2.  All existing source code and configuration files must be carefully moved to their new, correct locations within the structure.
    3.  Placeholder files (e.g., `package.json`, `tsconfig.json`, `.eslintrc.js`) should be created where specified in the guide if they don't exist. Their content should be minimal but valid.
    4.  The `pnpm-workspace.yaml` file must be created and configured to correctly identify the `apps/*` and `packages/*` workspaces.

    ### Technical Requirements
    1.  The project must remain a valid and functional `pnpm` workspace after the restructuring.
    2.  `turborepo` pipelines should be configured at a basic level in `turbo.json` as specified.
    3.  File and directory names must adhere strictly to the naming conventions outlined in the guide (`kebab-case` for packages, `PascalCase` for components, etc.).

    ## Implementation Considerations
    - **File Migration Strategy**: This is not a net-new feature; it's a refactor. A careful, file-by-file migration plan is needed. Files not explicitly mentioned in the target structure must be handled. We may need to ask for user input on where to place unknown files.
    - **Phased Approach**: The restructuring will be broken down into logical steps (moves):
        1. Create root-level configuration files.
        2. Scaffold the `apps/` directory and the `web` application.
        3. Scaffold the `packages/` directory and its shared libraries (`api`, `db`, `lib`, `ui`).
        4. Scaffold the `tooling/` directory and its configurations.
        5. Move existing files into the new structure.
        6. Validate the final structure and workspace configuration.

    ## What to Avoid
    - **Deleting Uncategorized Files**: Do not delete existing files that don't fit the new structure. They should be identified and the user should be consulted on how to handle them.
    - **Breaking the Build**: While some breakage is expected mid-refactor, the final state should be a fully functional, buildable workspace.
  </everythingElse>
</Climb> 