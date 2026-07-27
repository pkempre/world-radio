---
name: World Radio background playback
description: Durable platform constraint and implementation direction for World Radio playback.
---

World Radio's background listening should use a direct HTML audio stream with Media Session metadata and lock-screen action handlers. A PWA install improves continuity when the browser is backgrounded, while browser and operating-system policies still control whether playback may continue.

**Why:** Embedded YouTube playback cannot provide the same unrestricted background behavior as a direct audio stream because YouTube and browser policies control its lifecycle.

**How to apply:** Keep radio stations on the direct audio player path; treat YouTube as a separate embedded experience and do not promise Spotify-like background behavior for it in a browser-only app.

The Radio Browser proxy is mounted below `/api/radio`; with Express 5, use router middleware for catch-all proxying rather than relying on the older wildcard route form.

**Why:** The legacy wildcard syntax registered without serving the radio endpoints, producing 404 responses while the API health check still passed.

**How to apply:** When adding or changing catch-all routes in this server, verify the real proxied endpoint through the shared `/api` path, not only the health endpoint.