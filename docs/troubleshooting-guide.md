# Troubleshooting & Debugging Guide

**Version:** 1.0  
**Date:** July 7, 2025

## 1. Overview

This guide provides solutions and debugging strategies for common issues that may arise during the development of the CodeWeaver project.

## 2. General Environment Reset

When your local environment gets into a strange state, a full reset can often solve the problem.

**Complete Environment Reset Procedure:**
```bash
# 1. Stop and remove all Docker containers, networks, and volumes
docker compose down -v

# 2. Remove all node_modules and build artifacts
git clean -fdx

# 3. Re-install all dependencies from scratch
pnpm install

# 4. Start the infrastructure services again
docker compose up -d

# 5. Push the database schema
pnpm db:push

# 6. Start the development server
pnpm dev
```

## 3. tRPC and API Issues

### 3.1. Problem: Type Errors between Client and Server
- **Symptom**: The client-side `trpc` object shows type errors, or `useQuery` hooks complain about mismatched types.
- **Cause**: The server and client are out of sync. This usually happens after you change a tRPC router (`packages/api`) but the web app (`apps/web`) hasn't picked up the changes.
- **Solution**:
    1.  Ensure the tRPC API package is built correctly: `pnpm --filter @codeweaver/api build`.
    2.  Restart the Next.js development server (`pnpm dev`). Turborepo should handle this, but a manual restart can force the type regeneration.
    3.  Ensure you are importing the correct `trpc` instance on the client (`@/lib/trpc/client`) vs. the server (`@/lib/trpc/server`).

### 3.2. Problem: CORS Errors
- **Symptom**: The browser console shows a CORS error when the frontend tries to call the tRPC API.
- **Cause**: The API server is not configured to accept requests from the client's origin.
- **Solution**: Check the `Access-Control-Allow-Origin` headers being sent from your tRPC handler. In production, ensure your frontend's domain is on the allowlist.

## 4. AI SDK v5 and Provider Issues

### 4.1. Problem: AI SDK Streaming Not Working
- **Symptom**: The chat interface does not display the AI's response token-by-token.
- **Cause**: The response from the server is not a valid `UIMessageStreamResponse` or the client is not correctly handling the SSE stream.
- **Solution**:
    1.  **Check Server Response**: In your browser's network tab, inspect the API response. Ensure the `Content-Type` is `text/event-stream; charset=utf-8` and `X-Vercel-AI-UI-Message-Stream` is `v1`.
    2.  **Inspect Stream Chunks**: Look at the raw data chunks being sent. They should be in the format specified by the AI SDK v5.
    3.  **Check Client Logic**: Ensure you are using `useChat` or a similar hook from the AI SDK correctly to process the stream.

### 4.2. Problem: AI Provider API Key Error (401/403)
- **Symptom**: API calls to an AI provider fail with an authentication error.
- **Cause**: The API key is missing, incorrect, or has expired.
- **Solution**:
    1.  Verify the correct API key is in your `.env.development` file.
    2.  Ensure the environment variable name matches what the provider abstraction layer expects (e.g., `OPENROUTER_API_KEY`).
    3.  Check the provider's dashboard to ensure the API key is still active.
    4.  Restart the server after changing `.env` files.

## 5. Model Context Protocol (MCP) Issues

### 5.1. Problem: Cannot Connect to MCP Server
- **Symptom**: The application throws an error when trying to instantiate an MCP client.
- **Cause**: The MCP server executable (e.g., a Docker container or a local binary) is not running or is not in the system's `PATH`.
- **Solution**:
    1.  Ensure the MCP server is running. If it's a Docker container, check its status with `docker ps`.
    2.  Verify the command used to instantiate the `StdioClientTransport` is correct.
    3.  Check the logs of the MCP server process for any startup errors.

## 6. PWA and Service Worker Issues

### 6.1. Problem: PWA Not Updating After a New Deployment
- **Symptom**: Users are seeing an old, cached version of the application.
- **Cause**: The service worker's `skipWaiting` and `clientsClaim` lifecycle is not correctly configured, or the browser is holding onto the old service worker.
- **Solution**:
    1.  The `next-pwa` configuration includes `skipWaiting: true`, which helps.
    2.  **In Chrome DevTools**: Go to the "Application" tab -> "Service Workers", check "Update on reload", and click "Unregister" for the site's service worker. Then do a hard refresh (Cmd+Shift+R or Ctrl+Shift+R).

### 6.2. Problem: Offline Mode is Not Working
- **Symptom**: The app does not load when offline.
- **Cause**: The service worker failed to install or the runtime caching rules are incorrect.
- **Solution**:
    1.  **Verify Service Worker Registration**: In DevTools ("Application" -> "Service Workers"), check that a service worker is activated and running for your domain.
    2.  **Check Cache Storage**: In DevTools ("Application" -> "Cache Storage"), inspect the caches created by `next-pwa` (e.g., `google-fonts`, `static-image-assets`). Ensure they contain the expected assets.
    3.  Debug the service worker file (`sw.js` in the browser) to see if there are any runtime errors.

This guide should serve as the first point of reference when encountering issues. If a problem is not covered here, check the service logs and use browser developer tools to diagnose the root cause. 