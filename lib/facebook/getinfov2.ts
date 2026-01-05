import { Request, Response } from 'express';
import axios from 'axios';

export const name = '/facebook/getinfov2';

function tryHuydev(req: Request, res: Response) {
  try {
    // optional huydev module — if present, call it
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('./huydev');
    if (mod && typeof mod === 'function') return mod(req, res);
    if (mod && typeof mod.huydev === 'function') return mod.huydev(req, res);
  } catch (e) {
    // ignore — not mandatory
  }
  return false;
}

export const index = async (req: Request, res: Response) => {
  try {
    if (tryHuydev(req, res)) return;

    // token: allow override via ?token=... or env var FB_TOKEN; fall back to embedded token if present
    const token = String(req.query.token || process.env.FB_TOKEN || "EAAGNO4a7r2wBQeQL9rnQZAL2AgkO67KL8CHRXspVflTWoQGGGn9uDGUDspLWhgGnMkH0v4omGk6xWEndt5MnRxm813YnLYA6lY9nfPgINYvsG1FrEVHA9UddvHSwNWQzJi45Yyp8ORqxI4BxZBaa3XsLawLEI50hdcPi4VI75eUns0EmdZClWpgtpiRegZDZD").trim();

    let uid = (req.query.uid as string) || '';
    const urlParam = (req.query.url as string) || '';
    if (!uid && urlParam) {
      // try extract username or id from facebook URL
      const m = String(urlParam).match(/facebook\.com\/(?:r|profile\.php\?id=)?(?:.*?\/)?(profile\.php\?id=\d+|[A-Za-z0-9\.\-_]+)/i);
      if (m && m[1]) {
        uid = m[1].replace(/profile\.php\?id=/i, '');
      } else {
        // fallback: take last path segment
        try {
          const u = new URL(urlParam);
          const seg = u.pathname.split('/').filter(Boolean).pop();
          if (seg) uid = seg;
        } catch (e) {}
      }
    }

    if (!uid) return res.status(400).json({ error: 'thiếu uid or url.' });

    const fields = 'id,is_verified,cover,updated_time,work,education,likes,created_time,posts,hometown,username,family,timezone,link,name,locale,location,about,website,birthday,gender,relationship_status,significant_other,quotes,first_name,subscribers.limit(0)';
    try {
      const response = await axios.get(`https://graph.facebook.com/${encodeURIComponent(uid)}?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(token)}`);
      return res.json({ source: 'graph', data: response.data });
    } catch (fbErr: any) {
      // If Graph API fails (400/401), attempt a public HTML scrape fallback from mbasic.facebook.com
      const status = fbErr && fbErr.response && fbErr.response.status;
      if (status && (status === 400 || status === 401 || status === 403)) {
        try {
          const fbUrl = urlParam || `https://mbasic.facebook.com/${uid}`;
          const page = await axios.get(fbUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }, timeout: 10000 });
          const html = String(page.data || '');
          const meta = {} as any;
          // Extract og:meta tags
          const ogMatches = html.match(/<meta\s+(?:property|name)=["']([^"']+)["']\s+content=["']([^"']*)["'][^>]*>/gi) || [];
          ogMatches.forEach((m: string) => {
            const keyMatch = m.match(/(?:property|name)=["']([^"']+)["']/i);
            const valMatch = m.match(/content=["']([^"']*)["']/i);
            if (keyMatch && valMatch) meta[keyMatch[1]] = valMatch[1];
          });
          // Basic info from page title if available
          const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
          if (titleMatch) meta.title = (meta['og:title'] || titleMatch[1]).trim();
          // fallback username from URL or page
          meta.permalink = fbUrl;
          return res.json({ source: 'scrape', data: meta });
        } catch (scrapeErr) {
          console.error('Graph failed and scrape failed:', fbErr && fbErr.response ? fbErr.response.data : fbErr, scrapeErr);
          return res.status(500).json({ error: 'Graph API token invalid and HTML fallback failed', details: String(fbErr && fbErr.response ? fbErr.response.data : fbErr) });
        }
      }
      // Other errors: rethrow
      throw fbErr;
    }
  } catch (error: any) {
    console.error(error && error.response ? error.response.data || error.message : error);
    return res.status(500).json({ error: 'Tài khoàn die hoặc token api die vui lòng liên hệ admin.', details: String(error && error.message ? error.message : error) });
  }
};

export default { name, index };
