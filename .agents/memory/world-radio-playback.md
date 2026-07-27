---
name: World Radio background playback
description: Durable platform constraint and implementation direction for World Radio playback.
---

World Radio's background listening should use a direct HTML audio stream with Media Session metadata and lock-screen action handlers. A PWA install improves continuity when the browser is backgrounded, while browser and operating-system policies still control whether playback may continue.

**Why:** Embedded YouTube playback cannot provide the same unrestricted background behavior as a direct audio stream because YouTube and browser policies control its lifecycle.

**How to apply:** Keep radio stations on the direct audio player path; treat YouTube as a separate embedded experience and do not promise Spotify-like background behavior for it in a browser-only app.