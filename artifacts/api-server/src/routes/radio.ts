import { Router, type Request, type Response } from "express";
import { logger } from "../lib/logger";

const router = Router();
const RADIO_BASE = "https://de1.api.radio-browser.info";

async function proxyToRadio(req: Request, res: Response) {
  const qs = new URLSearchParams(
    req.query as Record<string, string>
  ).toString();
  const url = `${RADIO_BASE}${req.path}${qs ? `?${qs}` : ""}`;

  try {
    const upstream = await fetch(url, {
      method: req.method,
      headers: {
        "User-Agent": "WorldRadio/1.0",
        Accept: "application/json",
      },
    });

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: "Radio API error" });
      return;
    }

    const json = await upstream.json();
    res.json(json);
  } catch (err) {
    logger.error({ err, url }, "Radio proxy error");
    res.status(502).json({ error: "Radio API unavailable" });
  }
}

// Proxy all GET and POST requests to Radio Browser API
router.get("/*path", proxyToRadio);
router.post("/*path", proxyToRadio);

export default router;
