# PWA Configuration Blueprint

**Version:** 1.0  
**Date:** July 7, 2025

**Status:** Future Implementation

> This document serves as a blueprint for a planned feature. The steps outlined below have not yet been implemented.

## 1. Overview

This document provides a blueprint for configuring the CodeWeaver Next.js application as a Progressive Web App (PWA). This will enable offline capabilities, allow users to "install" the app on their devices, and improve overall performance and user engagement. We will use the `next-pwa` library for a robust and straightforward implementation.

## 2. PWA Strategy

Our PWA strategy focuses on a few key areas:
- **Offline-First Chat**: Core chat functionality should be available offline. Messages sent while offline will be queued and synced when connectivity is restored.
- **App-Like Experience**: The application should be installable on mobile and desktop devices, with a proper icon and launch screen.
- **Performance**: Aggressive caching of application shell and static assets to ensure fast load times, even on poor network connections.
- **Push Notifications**: (Future consideration) The PWA architecture will be set up to easily integrate push notifications for chat mentions or other important events.

## 3. Implementation Steps

### Step 3.1: Install Dependencies
First, add the `next-pwa` package to the `apps/web` application.

```bash
pnpm --filter web add next-pwa
```

### Step 3.2: Configure `next.config.mjs`
Wrap the Next.js config with the `withPWA` function to enable PWA capabilities.

**`apps/web/next.config.mjs`**
```javascript
import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ... any other Next.js configs
};

const pwaConfig = {
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    // Add caching strategies for different types of assets
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 365 days
        },
      },
    },
    {
      urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-font-assets',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
      },
    },
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-image-assets',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    // Cache tRPC API calls with a network-first strategy
    {
        urlPattern: ({ url }) => url.pathname.startsWith('/api/trpc'),
        handler: 'NetworkFirst',
        options: {
            cacheName: 'trpc-api-cache',
            expiration: {
                maxEntries: 32,
                maxAgeSeconds: 60 * 60, // 1 hour
            },
            networkTimeoutSeconds: 10,
        },
    },
  ],
};

export default withPWA(pwaConfig)(nextConfig);
```
- **`disable`**: The PWA features are disabled in development to prevent caching issues, and only enabled for production builds.

### Step 3.3: Create the App Manifest
The `manifest.json` file provides metadata about the PWA. Place this file in `apps/web/public/`.

**`apps/web/public/manifest.json`**
```json
{
  "name": "CodeWeaver",
  "short_name": "CodeWeaver",
  "description": "An AI-assisted development environment.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#111827",
  "theme_color": "#4F46E5",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icons/maskable-icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```
*Note: The corresponding icon files must be created and placed in the `public/icons` directory.*

### Step 3.4: Link the Manifest in `layout.tsx`
Add the manifest link and theme color meta tags to the root layout.

**`apps/web/src/app/layout.tsx`**
```typescript
import './globals.css';

export const metadata = {
  title: 'CodeWeaver',
  description: 'AI-assisted development environment',
  manifest: '/manifest.json',
  themeColor: '#4F46E5',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CodeWeaver" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

## 4. Offline Sync Strategy for Chat

To enable offline chat, we'll use a combination of the Service Worker's cache and a client-side library like `Dexie.js` (an IndexedDB wrapper) to queue outgoing messages.

1.  **Cache Chat UI**: The service worker, configured via `next-pwa`, will cache the main application shell and UI components, making the chat interface load instantly, even offline.
2.  **Queue Outgoing Messages**:
    - When a user sends a message while offline, the application will save it to an IndexedDB queue.
    - The UI will be updated optimistically to show the message as "pending" or "sending".
3.  **Background Sync**:
    - We will use the **Background Sync API**. The service worker will listen for a `sync` event, which triggers when network connectivity is restored.
    - On this event, the service worker will read the queued messages from IndexedDB and send them to the server via the tRPC API.
    - Once successfully sent, the message is removed from the queue and the UI is updated to show the message as "sent".

This blueprint provides a solid foundation for building a full-featured PWA. The initial setup with `next-pwa` handles the core caching and service worker generation, while the offline sync strategy can be layered on top to create a truly resilient user experience. 