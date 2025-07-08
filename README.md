# CodeWeaver: AI-Assisted Development Environment

CodeWeaver is a next-generation, AI-assisted development environment designed for modern engineering teams. It provides a seamless, multi-modal, and agentic coding experience by integrating multiple cutting-edge AI providers, a robust real-time API layer, and a scalable, containerized infrastructure.

## 🚀 Core Features

- **Monorepo Architecture**: Scalable `pnpm` monorepo using TypeScript project references.
- **Multi-Provider AI**: Flexible integration with OpenRouter, Claude, Gemini, and other providers via a unified abstraction layer.
- **Advanced AI Chat**: Powered by the **Vercel AI SDK v5 Beta**, supporting multi-modal content, tool usage, and agentic workflows.
- **Extensible Tooling**: **Model Context Protocol (MCP)** support allows the application to connect with external tools and data sources.
- **End-to-End Type Safety**: A fully type-safe API layer built with **tRPC**, including real-time WebSocket subscriptions.
- **Modern Frontend**: Built with **Next.js 15** and **React 19**, styled with **TailwindCSS 4**.
- **Containerized**: Deployed via **Docker Compose**.

## 🛠️ Tech Stack

| Category                  | Technology                                     |
| ------------------------- | ---------------------------------------------- |
| **Monorepo & Build**      | pnpm Workspaces, TypeScript                    |
| **Frontend**              | Next.js 15, React 19, TailwindCSS 4            |
| **API Layer**             | tRPC, WebSockets                               |
| **Database**              | PostgreSQL 15, Prisma, `pgvector`              |
| **Caching & Messaging**   | Redis 7                                        |
| **Authentication**        | NextAuth.js, Google OAuth                      |
| **AI Integration**        | Vercel AI SDK v5, MCP, OpenRouter, Claude, Gemini|
| **Deployment**            | Docker, Docker Compose                         |

## 📋 Prerequisites

- **Node.js 24+**
- **pnpm 9+**
- **Docker & Docker Compose**
- **Google Cloud Credentials** for OAuth

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd codeweaver
```

### 2. Set up environment variables

Copy the example environment file. The application uses different `.env` files for each environment (`.env.development`, `.env.production`).

```bash
cp .env.example .env.development
```

Update `.env.development` with your local configuration:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/codeweaver_dev"

# Redis
REDIS_URL="redis://localhost:6379"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secure-secret-key" # Generate with: openssl rand -hex 32

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# AI Providers
OPENROUTER_API_KEY="your-openrouter-key"
CLAUDE_API_KEY="your-claude-api-key"
GEMINI_API_KEY="your-gemini-api-key"
```

### 3. Start the Infrastructure

The entire local development stack is managed by Docker Compose. This command will start PostgreSQL and Redis.

```bash
docker compose up -d
```

### 4. Install dependencies

```bash
pnpm install
```

### 5. Prepare the database

Generate the Prisma client and push the database schema.

```bash
pnpm db:generate
pnpm db:push
```

### 6. Start the development server

This command uses `pnpm` to run all applications (`web`, `api`, etc.) in development mode.

```bash
pnpm dev
```

The main application will be available at [http://localhost:3000](http://localhost:3000).

## 📚 Available Scripts

- `pnpm dev` - Start all apps in the monorepo in development mode.
- `pnpm build` - Build all apps and packages.
- `pnpm lint` - Lint all code in the monorepo.
- `pnpm typecheck` - Run TypeScript compiler across the monorepo.
- `pnpm test` - Run all tests.
- `pnpm db:generate` - Generate Prisma client.
- `pnpm db:push` - Push schema changes to the database.
- `pnpm db:studio` - Open Prisma Studio to view and manage data.

## 🏗️ Project Structure

The project is a `pnpm` monorepo with the following structure:

```
codeweaver/
├── apps/
│   ├── web/                 # Next.js 15 frontend application
│   └── docs/                # Documentation site
├── packages/
│   ├── api/                 # Shared tRPC router and API logic
│   ├── ui/                  # Shared React components (e.g., Shadcn UI)
│   ├── db/                  # Prisma schema and database client
│   └── lib/                 # Shared utilities and libraries
├── .env.example             # Example environment variables
├── docker-compose.yml       # Docker Compose for infrastructure
├── package.json             # Root package.json
└── pnpm-workspace.yaml      # pnpm workspace configuration
```

## 🔐 Authentication

Authentication is handled by **NextAuth.js** using the **Google OAuth** provider. Sessions are stored in the PostgreSQL database via the Prisma adapter, ensuring persistent logins. Protected routes and API endpoints are secured using Next.js middleware.

## 🤖 AI & MCP Integration

CodeWeaver's AI capabilities are powered by a flexible provider architecture:
- **AI SDK v5**: Provides a modern, structured interface for all LLM interactions, including multi-modal content and tool usage.
- **Provider Abstraction**: A custom layer allows seamless switching between providers like OpenRouter, Claude, and Gemini.
- **MCP Client**: The application can connect to external **Model Context Protocol (MCP)** servers, allowing the AI to use external tools (e.g., file system access, code execution) in a standardized and secure way.

## 🚀 Deployment

The application is designed for containerized deployments using Docker.

### Local/Development
Use the provided `docker-compose.yml` to spin up the required services (PostgreSQL, Redis).

```bash
docker compose up -d
```

### Production
A production-ready `docker-compose.prod.yml` (or a similar Kubernetes configuration) should be used. This involves:
1. Building optimized, multi-stage Docker images for each application.
2. Managing secrets using Docker Secrets or a cloud provider's secret manager.
3. Configuring network policies for secure inter-service communication.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature-name`).
3. Make your changes.
4. Commit your changes (`git commit -m 'Add some feature'`).
5. Push to the branch (`git push origin feature/your-feature-name`).
6. Open a pull request.

---

Built with ❤️ and the future of AI.
