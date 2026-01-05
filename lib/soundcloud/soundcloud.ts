import axios from 'axios';
import { Request, Response } from 'express';

export const name = '/soundcloud';

function getClientId(req: Request) {
  return String(req.query.client_id || process.env.SOUND_CLOUD_CLIENT_ID || 'dH1Xed1fpITYonugor6sw39jvdq58M3h').trim();
}

async function resolveTrack(urlOrId: string, clientId: string) {
  // If passed a full URL, use /resolve to get the API resource
  if (/^https?:\/\//.test(urlOrId)) {
    const endpoint = `https://api-v2.soundcloud.com/resolve?url=${encodeURIComponent(urlOrId)}&client_id=${clientId}`;
    const r = await axios.get(endpoint, { timeout: 10000 });
    return r.data;
  }
  // otherwise assume it's an id
  const endpoint = `https://api-v2.soundcloud.com/tracks/${encodeURIComponent(urlOrId)}?client_id=${clientId}`;
  const r = await axios.get(endpoint, { timeout: 10000 });
  return r.data;
}

async function getStreamUrlFromTranscoding(transcoding: any, clientId: string) {
  if (!transcoding || !transcoding.url) return null;
  const endpoint = `${transcoding.url}?client_id=${clientId}`;
  const r = await axios.get(endpoint, { timeout: 10000 });
  return r.data && r.data.url ? r.data.url : null;
}

export const index = async (req: Request, res: Response) => {
  try {
    const clientId = getClientId(req);
    if (!clientId) return res.status(400).json({ error: 'client_id required (query param or SOUND_CLOUD_CLIENT_ID env)' });

    const q = String(req.query.keyword || req.query.q || '').trim();
    const url = String(req.query.url || req.query.track || '').trim();

    if (!q && !url) return res.status(400).json({ error: 'keyword or url required' });

    if (q) {
      // Use official search endpoint
      const endpoint = `https://api-v2.soundcloud.com/search/tracks?q=${encodeURIComponent(q)}&client_id=${clientId}&limit=10`;
      const resp = await axios.get(endpoint, { timeout: 10000 });
      const items = (resp.data && resp.data.collection) ? resp.data.collection.map((t: any) => ({ id: t.id, title: t.title, user: t.user && t.user.username, permalink: t.permalink_url, duration: t.duration })) : [];

      // Auto-resolve and fetch formats for the top result (if any)
      let top: any = null;
      let topFormats: any[] = [];
      if (items.length > 0) {
        try {
          const topTrack = await resolveTrack(items[0].permalink, clientId);
          top = { id: topTrack.id, title: topTrack.title, permalink: topTrack.permalink_url, user: topTrack.user && topTrack.user.username };
          const transcodings = (topTrack.media && topTrack.media.transcodings) || [];
          for (const t of transcodings) {
            try {
              const streamUrl = await getStreamUrlFromTranscoding(t, clientId);
              if (streamUrl) topFormats.push({ format: t.format, mime_type: t.format && t.format.protocol, quality: t.quality || null, url: streamUrl });
            } catch (e) {
              // ignore individual transcoding failures
            }
          }
        } catch (e) {
          // ignore resolve failures for top
        }
      }

      // If endpoint is /down or query param download=1, return direct MP3 or redirect
      const wantsDirect = String((req.query as any).download || '').toLowerCase() === '1' || req.path.endsWith('/down');
      if (wantsDirect) {
        // prefer progressive / mp3-like formats
        const pick = topFormats.find((f) => (f.mime_type && f.mime_type.toString().toLowerCase().includes('mp3')) || (f.format && f.format.protocol === 'progressive')) || topFormats[0] || null;
        const mp3Url = pick ? pick.url : null;
        if ((req.query as any).redirect === '1' && mp3Url) return res.redirect(302, mp3Url);
        return res.json({ keyword: q, top, mp3: mp3Url, topFormats });
      }

      return res.json({ keyword: q, results: items, top, topFormats });
    }

    // url provided -> resolve track and return stream/download URLs using official API
    if (url) {
      const track = await resolveTrack(url, clientId);
      const meta = { id: track.id, title: track.title, user: track.user && track.user.username, permalink: track.permalink_url, duration: track.duration, artwork: track.artwork_url };

      // track.media.transcodings contains available formats; try to resolve progressive/https mp3 first
      const transcodings = (track.media && track.media.transcodings) || [];
      const formats: any[] = [];
      for (const t of transcodings) {
        try {
          const streamUrl = await getStreamUrlFromTranscoding(t, clientId);
          if (streamUrl) formats.push({ format: t.format, mime_type: t.format && t.format.protocol, quality: t.quality || null, url: streamUrl });
        } catch (e) {
          // ignore individual transcoding failures
        }
      }

      return res.json({ meta, formats });
    }

    return res.status(400).json({ error: 'no action' });
  } catch (err: any) {
    return res.status(500).json({ error: true, message: String(err) });
  }
};

export default { name, index };
