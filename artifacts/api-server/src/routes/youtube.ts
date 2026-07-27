import { Router, type Request, type Response } from "express";
import { logger } from "../lib/logger";

const router = Router();
const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

function getApiKey(): string {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) throw new Error("GOOGLE_API_KEY environment variable is not set");
  return key;
}

// GET /api/youtube/music?country=US&q=music&maxResults=20
router.get("/music", async (req: Request, res: Response) => {
  try {
    const country = ((req.query.country as string) || "US").toUpperCase().slice(0, 2);
    const q = (req.query.q as string) || "music";
    const maxResults = Math.min(Number(req.query.maxResults) || 20, 50);

    const params = new URLSearchParams({
      part: "snippet",
      type: "video",
      videoCategoryId: "10",
      regionCode: country,
      q,
      maxResults: maxResults.toString(),
      key: getApiKey(),
    });

    const response = await fetch(`${YOUTUBE_API_BASE}/search?${params}`);
    if (!response.ok) {
      const err = await response.json() as any;
      res.status(response.status).json({ error: err?.error?.message || "YouTube API error" });
      return;
    }

    const data = await response.json() as any;
    const items = (data.items || [])
      .map((item: any) => ({
        videoId: item.id?.videoId,
        title: item.snippet?.title,
        channelTitle: item.snippet?.channelTitle,
        thumbnail:
          item.snippet?.thumbnails?.high?.url ||
          item.snippet?.thumbnails?.medium?.url ||
          item.snippet?.thumbnails?.default?.url,
        publishedAt: item.snippet?.publishedAt,
        description: item.snippet?.description,
      }))
      .filter((i: any) => i.videoId);

    res.json(items);
  } catch (err) {
    logger.error({ err }, "YouTube music fetch error");
    res.status(502).json({ error: "Failed to fetch music" });
  }
});

// GET /api/youtube/artists?country=US&maxResults=20
router.get("/artists", async (req: Request, res: Response) => {
  try {
    const country = ((req.query.country as string) || "US").toUpperCase().slice(0, 2);
    const maxResults = Math.min(Number(req.query.maxResults) || 20, 50);

    const params = new URLSearchParams({
      part: "snippet",
      type: "channel",
      regionCode: country,
      q: "music artist",
      maxResults: maxResults.toString(),
      key: getApiKey(),
    });

    const response = await fetch(`${YOUTUBE_API_BASE}/search?${params}`);
    if (!response.ok) {
      const err = await response.json() as any;
      res.status(response.status).json({ error: err?.error?.message || "YouTube API error" });
      return;
    }

    const data = await response.json() as any;
    const items = (data.items || [])
      .map((item: any) => ({
        channelId: item.id?.channelId,
        title: item.snippet?.title,
        description: item.snippet?.description,
        thumbnail:
          item.snippet?.thumbnails?.high?.url ||
          item.snippet?.thumbnails?.medium?.url ||
          item.snippet?.thumbnails?.default?.url,
        publishedAt: item.snippet?.publishedAt,
      }))
      .filter((i: any) => i.channelId);

    res.json(items);
  } catch (err) {
    logger.error({ err }, "YouTube artists fetch error");
    res.status(502).json({ error: "Failed to fetch artists" });
  }
});

// GET /api/youtube/playlists?country=US&q=playlist&maxResults=20
router.get("/playlists", async (req: Request, res: Response) => {
  try {
    const country = ((req.query.country as string) || "US").toUpperCase().slice(0, 2);
    const q = (req.query.q as string) || "music playlist";
    const maxResults = Math.min(Number(req.query.maxResults) || 20, 50);

    const params = new URLSearchParams({
      part: "snippet",
      type: "playlist",
      regionCode: country,
      q,
      maxResults: maxResults.toString(),
      key: getApiKey(),
    });

    const response = await fetch(`${YOUTUBE_API_BASE}/search?${params}`);
    if (!response.ok) {
      const err = await response.json() as any;
      res.status(response.status).json({ error: err?.error?.message || "YouTube API error" });
      return;
    }

    const data = await response.json() as any;
    const items = (data.items || [])
      .map((item: any) => ({
        playlistId: item.id?.playlistId,
        title: item.snippet?.title,
        channelTitle: item.snippet?.channelTitle,
        description: item.snippet?.description,
        thumbnail:
          item.snippet?.thumbnails?.high?.url ||
          item.snippet?.thumbnails?.medium?.url ||
          item.snippet?.thumbnails?.default?.url,
        publishedAt: item.snippet?.publishedAt,
      }))
      .filter((i: any) => i.playlistId);

    res.json(items);
  } catch (err) {
    logger.error({ err }, "YouTube playlists fetch error");
    res.status(502).json({ error: "Failed to fetch playlists" });
  }
});

export default router;
