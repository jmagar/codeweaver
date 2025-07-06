# Rule: Development Workflow

This document outlines the standard development workflow for contributing to the CodeWeaver project. Following this workflow ensures consistency, quality, and smooth collaboration.

## 1. Local Development Setup

1.  **Clone the repository**:
    ```bash
    git clone <repo-url>
    cd codeweaver
    ```
2.  **Configure Environment**: Copy `.env.example` to `.env.development` and fill in the required values.
    ```bash
    cp .env.example .env.development
    ```
3.  **Start Infrastructure**: Use Docker Compose to start the database (PostgreSQL) and cache (Redis).
    ```bash
    docker-compose up -d
    ```
4.  **Install Dependencies**: Use `pnpm` to install all dependencies for the entire monorepo.
    ```bash
    pnpm install
    ```
5.  **Prepare Database**: Push the Prisma schema to your local database instance.
    ```bash
    pnpm db:push
    ```
6.  **Start Development Servers**: Use the root `dev` script, which leverages Turborepo to run all `dev` scripts in the `apps/*` packages.
    ```bash
    pnpm dev
    ```

## 2. Branching Strategy

- All new work must be done on a feature branch.
- Branch names should be descriptive and prefixed with a type (e.g., `feature/`, `fix/`, `chore/`).
  - **Example**: `feature/real-time-chat`
  - **Example**: `fix/auth-redirect-loop`
- Do not commit directly to the `main` branch.

## 3. Making Changes

1.  **Pull Latest Changes**: Before starting work, ensure your `main` branch is up-to-date and rebase your feature branch.
    ```bash
    git checkout main
    git pull origin main
    git checkout feature/your-branch
    git rebase main
    ```
2.  **Code and Test**: Make your code changes, adhering to the established code style and architecture rules. Write or update tests as necessary.
3.  **Run Checks Locally**: Before committing, run all checks to ensure your changes haven't introduced issues.
    ```bash
    pnpm lint
    pnpm typecheck
    pnpm test
    ```

## 4. Committing and Pushing

- **Commit Messages**: Write clear, concise commit messages. Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.
  - **Example**: `feat(api): add user profile update endpoint`
  - **Example**: `fix(web): correct alignment on login button`
- **Push your branch**: Push your feature branch to the remote repository.

## 5. Creating a Pull Request (PR)

1.  **Open a PR**: Open a pull request from your feature branch to the `main` branch.
2.  **Description**: Write a clear PR description that explains:
    - **What** the change is.
    - **Why** the change is being made.
    - **How** the change was implemented.
    - Any relevant screenshots or testing instructions.
3.  **Link Issues**: If your PR addresses a GitHub issue, link it in the description.
4.  **CI Checks**: Ensure all automated CI checks (linting, testing, building) pass. PRs with failing checks will be blocked.
5.  **Code Review**: Request a review from at least one other team member. Address all feedback and comments before merging.

## 6. Merging
- Once the PR is approved and all checks have passed, it can be merged into `main`.
- Prefer "Squash and merge" to maintain a clean Git history on the `main` branch.

This workflow is designed to be efficient while maintaining a high standard of code quality. Adherence is expected for all contributions. 