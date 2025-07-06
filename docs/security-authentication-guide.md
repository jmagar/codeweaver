# Security & Authentication Configuration Guide

**Version:** 1.0  
**Date:** January 2025

## 1. Overview

This document outlines the security and authentication architecture for the CodeWeaver project. The strategy is built on industry best practices, leveraging NextAuth.js for robust authentication, implementing secure API key management, and enforcing strict security policies across the application.

## 2. Authentication

### 2.1. Provider: Google OAuth with NextAuth.js
- **Primary Method**: User authentication is exclusively handled via **Google OAuth 2.0**, managed by **NextAuth.js v5**. This delegates the complexity of password management to a trusted provider.
- **Implementation**: The NextAuth.js handler is located at `apps/web/src/app/api/auth/[...nextauth]/route.ts`.

### 2.2. Session Management
- **Strategy**: `database`. Sessions are persisted in the PostgreSQL database via the Prisma adapter. This is a secure and scalable approach that ensures sessions are not lost on server restart.
- **Session Tokens**: While the session is stored in the database, a JWT is used as the session token, which is stored in a secure, `HttpOnly` cookie. This prevents XSS attacks from accessing the session token.
- **Session Duration**: Sessions are configured with a maximum age of 30 days, with a rolling update policy to keep active users logged in.

### 2.3. Route Protection
- **Middleware**: Protected routes (e.g., `/dashboard`) and API endpoints are secured using Next.js middleware (`apps/web/middleware.ts`).
- **Logic**: The middleware validates the session cookie. If a user is not authenticated, they are redirected to the `/auth/signin` page. Authenticated users trying to access public-only pages like `/auth/signin` are redirected to the dashboard.

## 3. API Key Management

### 3.1. Storage
- All external API keys (Google, OpenRouter, Anthropic, etc.) **must** be stored as environment variables.
- They must **never** be hardcoded in the source code.
- They must **never** be committed to version control.

### 3.2. Access
- API keys are loaded into the application's environment at runtime.
- **Backend Only**: Keys should only be accessed and used in backend services (`packages/api`, `packages/lib`). They must **never** be exposed to the frontend client.
- **Provider Abstraction**: The AI provider abstraction layer is responsible for securely managing and using these keys when making requests to external AI services.

## 4. API Security (tRPC)

### 4.1. CORS (Cross-Origin Resource Sharing)
- For production environments, the tRPC API handler should be configured with a strict CORS policy that only allows requests from the application's public domain.
- This prevents other websites from making requests to our API on behalf of a user.

### 4.2. CSRF (Cross-Site Request Forgery)
- NextAuth.js provides built-in CSRF protection using a double-submit cookie pattern, which is enabled by default. No additional configuration is needed, but this is a critical layer of security for all `POST` requests.

### 4.3. Input Validation
- All tRPC procedure inputs are rigorously validated using **Zod**.
- This is our primary defense against malformed data and potential injection attacks at the API layer. Any request with an input that does not match the Zod schema is rejected with a `BAD_REQUEST` error before it reaches the business logic.

## 5. Content Security Policy (CSP)

A strict Content Security Policy is essential to mitigate XSS and other injection attacks. The policy will be configured in `next.config.mjs` via response headers.

**Example Production CSP:**
```
default-src 'self';
script-src 'self' 'unsafe-eval' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https://lh3.googleusercontent.com;
font-src 'self' https://fonts.gstatic.com;
connect-src 'self' wss://your-websocket-domain.com;
frame-ancestors 'none';
form-action 'self';
base-uri 'self';
```
- `script-src 'unsafe-eval'`: May be required for certain libraries in development. Strive to remove this in production.
- `connect-src`: Must allow connections to our own API and any WebSocket servers.
- `img-src`: Must allow images from Google (`lh3.googleusercontent.com`) for user profile pictures.

## 6. General Security Best Practices

- **Security Headers**: In addition to CSP, other security headers like `X-Frame-Options`, `X-Content-Type-Options`, and `Referrer-Policy` are set via middleware to protect against clickjacking and other vulnerabilities.
- **Dependency Scanning**: A CI job should be configured to automatically scan `pnpm` dependencies for known vulnerabilities (e.g., using `pnpm audit` or Snyk).
- **Container Security**: Docker images are built from hardened base images and run as non-root users. They are scanned for vulnerabilities as part of the CI/CD pipeline.

This multi-layered security approach ensures that the CodeWeaver application is protected at the authentication, API, and infrastructure levels. 