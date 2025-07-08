# Docker Development Setup Guide

**Version:** 1.0  
**Date:** July 7, 2025

## 1. Overview

This guide explains how to use Docker and Docker Compose to set up a consistent and isolated development environment for the CodeWeaver project. The Docker setup manages all our backend services, including PostgreSQL and Redis, ensuring that every developer works with the same infrastructure.

## 2. Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed on your machine.
- [Docker Compose](https://docs.docker.com/compose/install/) (usually included with Docker Desktop).

## 3. The `docker-compose.yml` File

The core of our development setup is the `docker-compose.yml` file located at the root of the monorepo.

```yaml
services:
  # PostgreSQL database with pgvector extension
  postgres:
    image: pgvector/pgvector:pg15
    restart: always
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: codeweaver_dev
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d codeweaver_dev"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis cache and message broker
  redis:
    image: redis:7-alpine
    restart: always
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

### 3.1. Services Explained

- **`postgres`**: Runs a PostgreSQL 15 database instance using the `pgvector` image, which is required for our AI embedding features. It exposes the database on port `5432`.
- **`redis`**: Runs a Redis 7 instance for caching, session management, and real-time messaging. It exposes Redis on port `6379`.
- **`volumes`**: `postgres_data` and `redis_data` are named volumes. Docker manages these volumes to persist our database and cache data across container restarts. This means your data won't be lost when you stop and start the services.

## 4. Setting Up and Running the Environment

### Step 4.1: Start the Services
To start all the services defined in the `docker-compose.yml` file, run the following command from the root of the project:

```bash
docker compose up -d
```
- The `-d` flag runs the containers in detached mode, meaning they run in the background.

### Step 4.2: Verify the Services are Running
You can check the status of your running containers with:

```bash
docker compose ps
```
You should see both the `postgres` and `redis` services listed with a `State` of `Up`.

### Step 4.3: Connect Your Application
Your Next.js application (running locally via `pnpm dev`) is pre-configured via the `.env.development` file to connect to these Docker services on `localhost` at their respective ports.

## 5. Managing the Development Environment

### Stopping the Services
To stop the running services:
```bash
docker compose down
```
This stops and removes the containers. Because we use named volumes, your data is safe and will be available the next time you run `docker compose up -d`.

### Stopping Services and Deleting Data
If you want to stop the services AND completely wipe all data (PostgreSQL and Redis), run:
```bash
docker compose down -v
```
**Warning**: This is a destructive action and will permanently delete your local database and cache data.

### Viewing Logs
To view the logs from all running services in real-time:
```bash
docker compose logs -f
```
To view logs for a specific service (e.g., `postgres`):
```bash
docker compose logs -f postgres
```

## 6. Database Seeding and Management

- **Database Migrations**: After starting the Docker services for the first time, you need to apply the database schema.
  ```bash
  pnpm db:push
  ```
- **Prisma Studio**: You can connect to the database running in Docker using Prisma Studio.
  ```bash
s
  pnpm db:studio
  ```
  This will open a web interface where you can view and manage your database tables.

## 7. Development vs. Production Configurations

The provided `docker-compose.yml` is optimized for **local development**. It maps ports directly to your `localhost` for easy access.

A production setup (`docker-compose.prod.yml`) would be different:
- It would not expose ports directly to the host machine.
- It would use a private network for inter-service communication.
- It would manage secrets more securely (e.g., using Docker secrets).
- It would include the application itself as a service, built from a `Dockerfile`.

This guide ensures that every developer has a consistent, reliable, and isolated environment for building and testing CodeWeaver. 