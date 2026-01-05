import express from 'express';
import path from 'path';

// Shared handler module shape
type HandlerModule = {
  name?: string;
  index?: (req: any, res: any, next?: any) => any;
  handler?: (req: any, res: any) => any;
  default?: any;
  [k: string]: any;
};

// Import existing modules (typed as HandlerModule when using dynamic require)
const capcut: HandlerModule = require(path.join(__dirname, '..', 'lib', 'capcut', 'capcut')) as HandlerModule;
import * as anime from '../lib/media/anime';
import * as girl from '../lib/media/girl';
import * as girlsexy from '../lib/media/girlsexy';
import * as videogai from '../lib/media/videogai';
import * as videoanime from '../lib/media/videoanime';
import * as cadao from '../lib/media/cadao';
import * as chamngon from '../lib/media/chamngon';
import * as du from '../lib/media/du';
import * as mong from '../lib/media/mong';
import * as thinh from '../lib/media/thinh';
import * as truyencuoi from '../lib/media/truyencuoi';
import * as joker from '../lib/media/joker';

const tiktokDown: HandlerModule = require(path.join(__dirname, '..', 'lib', 'tiktok', 'tiktokdown')) as HandlerModule;
const facebook: HandlerModule = require(path.join(__dirname, '..', 'lib', 'facebook', 'fbdown')) as HandlerModule;
let youtube: HandlerModule;
try {
  youtube = require(path.join(__dirname, '..', 'lib', 'youtube', 'youtubedown')) as HandlerModule;
} catch (e) {
  // fallback to index (TypeScript file or compiled JS)
  try {
    youtube = require(path.join(__dirname, '..', 'lib', 'youtube', 'index')) as HandlerModule;
  } catch (e2) {
    // final fallback: require package folder (if present)
    try {
      youtube = require(path.join(__dirname, '..', 'lib', 'youtube')) as HandlerModule;
    } catch (e3) {
      youtube = {} as HandlerModule;
    }
  }
}
// SoundCloud module (optional)
let soundcloud: HandlerModule;
try {
  soundcloud = require(path.join(__dirname, '..', 'lib', 'soundcloud', 'soundcloud')) as HandlerModule;
} catch (e) {
  try {
    soundcloud = require(path.join(__dirname, '..', 'lib', 'soundcloud', 'index')) as HandlerModule;
  } catch (e2) {
    soundcloud = {} as HandlerModule;
  }
}

const app = express();
app.use(express.json());

// Port and LAN detection — used to build URLs that expose the machine's LAN IP
const PORT = process.env.PORT || 3000;
function getLanIp() {
  const os = require('os');
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return '127.0.0.1';
}
const LAN_IP = process.env.PUBLIC_HOST || getLanIp();

const BASE = '/api/v1';

// If request host is localhost or 127.0.0.1, replace it with LAN_IP:PORT so handlers build LAN URLs
app.use((req, res, next) => {
  try {
    const hostHeader = (req.headers && req.headers.host) || '';
    if (/^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(hostHeader)) {
      req.headers.host = `${LAN_IP}:${PORT}`;
    }
  } catch (e) {}
  next();
});

app.get('/', (req, res) => res.json({ ok: true, base: BASE }));

// Normalize duplicate base prefixes like /api/v1/api/v1/... -> /api/v1/...
app.use((req, res, next) => {
  try {
    const prefix = BASE;
    const double = prefix + prefix;
    if (req.url.startsWith(double)) {
      req.url = req.url.replace(double, prefix);
    }
  } catch (e) {
    // ignore
  }
  next();
});

// Capcut
app.get(`${BASE}/capcut/down`, (req, res, next) => {
  if (typeof capcut.index === 'function') return capcut.index(req, res, next);
  return res.status(501).json({ error: 'capcut handler not implemented' });
});

// Tiktok
app.get(`${BASE}/tiktok/down`, (req, res) => {
  if (tiktokDown && typeof tiktokDown.index === 'function') return tiktokDown.index(req, res);
  return res.status(501).json({ error: 'tiktok handler not implemented' });
});

// Facebook route: prefer `index` or `handler` depending on module shape
// Add specific facebook sub-routes
app.get(`${BASE}/facebook/date`, async (req, res, next) => {
  try {
    const dateHandler = require(path.join(__dirname, '..', 'lib', 'facebook', 'date')) as HandlerModule;
    if (dateHandler && typeof dateHandler.index === 'function') return dateHandler.index(req, res, next);
  } catch (e) {
    // fallthrough to generic handlers
  }
  // Generic facebook handler: prefer `index` or `handler` depending on module shape
  if (facebook && typeof facebook.index === 'function') return facebook.index(req, res, next);
  if (facebook && typeof facebook.handler === 'function') return facebook.handler(req, res);
  return res.status(501).json({ error: 'facebook handler not implemented' });
});

app.get(`${BASE}/facebook/getinfov2`, async (req, res, next) => {
  try {
    const handler = require(path.join(__dirname, '..', 'lib', 'facebook', 'getinfov2')) as HandlerModule;
    if (handler && typeof handler.index === 'function') return handler.index(req, res, next);
  } catch (e) {
    // ignore and fallthrough
  }
  return res.status(501).json({ error: 'facebook getinfov2 handler not implemented' });
});

// Youtube: youtubedown exports helpers, not an express handler. Provide simple 501 or wire specific endpoints later.
// YouTube endpoints: expose search, info, download using youtubedown methods when available
app.get(`${BASE}/youtube/search`, async (req, res) => {
  try {
    const keyword = String(req.query.keyword || req.query.q || '');
    if (!keyword) return res.status(400).json({ error: 'keyword required' });
    const fn = youtube.GetListByKeyword || (youtube.default && youtube.default.GetListByKeyword);
    if (typeof fn !== 'function') return res.status(501).json({ error: 'youtube search not available' });
    const data = await fn(keyword);
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

app.get(`${BASE}/youtube/info`, async (req, res) => {
  try {
    const videoId = String(req.query.videoId || req.query.id || '');
    if (!videoId) return res.status(400).json({ error: 'videoId required' });
    const fn = youtube.GetVideoDetails || (youtube.default && youtube.default.GetVideoDetails);
    if (typeof fn !== 'function') return res.status(501).json({ error: 'youtube info not available' });
    const data = await fn(videoId);
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

app.get(`${BASE}/youtube/download`, async (req, res) => {
  try {
    // download handler supports either videoId or a full url param
    const rawVideoId = String(req.query.videoId || req.query.id || '');
    const rawUrl = String(req.query.url || '');

    const vidFromParam = rawVideoId || '';
    let videoId = vidFromParam;

    const getVideoIdFn = youtube.GetVideoId || (youtube.default && youtube.default.GetVideoId);
    if (!videoId && rawUrl) {
      if (typeof getVideoIdFn === 'function') {
        videoId = String(getVideoIdFn(rawUrl) || '');
      } else {
        // fallback: try simple regex to extract id
        const m = rawUrl.match(/(?:v=|youtu\.be\/|embed\/)([^#&?\n]{11})/);
        if (m && m[1]) videoId = m[1];
      }
    }

    if (!videoId) return res.status(400).json({ error: 'videoId required (or provide url=...)' });

    const fn = youtube.downloadVideo || (youtube.default && youtube.default.downloadVideo);
    if (typeof fn !== 'function') return res.status(501).json({ error: 'youtube download not available' });
    const data = await fn(videoId);
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

// alias: /youtube/down -> same handler
app.get(`${BASE}/youtube/down`, async (req, res) => {
  // reuse the download route handler by calling it directly
  return app._router.stack
    .filter((r: any) => r.route && r.route.path === `${BASE}/youtube/download`)[0]
    .route.stack[0].handle(req, res);
});

// SoundCloud routes: search by keyword or download by url
app.get(`${BASE}/soundcloud/search`, async (req, res) => {
  if (soundcloud && typeof soundcloud.index === 'function') return soundcloud.index(req, res);
  return res.status(501).json({ error: 'soundcloud search not available' });
});

app.get(`${BASE}/soundcloud/download`, async (req, res) => {
  if (soundcloud && typeof soundcloud.index === 'function') return soundcloud.index(req, res);
  return res.status(501).json({ error: 'soundcloud download not available' });
});

app.get(`${BASE}/soundcloud/down`, async (req, res) => {
  return app._router.stack
    .filter((r: any) => r.route && r.route.path === `${BASE}/soundcloud/download`)[0]
    .route.stack[0].handle(req, res);
});

// Media routes (random selectors)
app.get(`${BASE}/media/anime`, (req, res) => anime.randomHandler(req, res));
app.get(`${BASE}/media/girl`, (req, res) => girl.randomHandler(req, res));
app.get(`${BASE}/media/girlsexy`, (req, res) => girlsexy.randomHandler(req, res));
app.get(`${BASE}/media/videogai`, (req, res) => videogai.randomHandler(req, res));
app.get(`${BASE}/media/videoanime`, (req, res) => videoanime.randomHandler(req, res));
app.get(`${BASE}/media/cadao`, (req, res) => cadao.randomHandler(req, res));
app.get(`${BASE}/media/chamngon`, (req, res) => chamngon.randomHandler(req, res));
app.get(`${BASE}/media/du`, (req, res) => du.randomHandler(req, res));
app.get(`${BASE}/media/mong`, (req, res) => mong.randomHandler(req, res));
app.get(`${BASE}/media/thinh`, (req, res) => thinh.randomHandler(req, res));
app.get(`${BASE}/media/truyencuoi`, (req, res) => truyencuoi.randomHandler(req, res));
app.get(`${BASE}/media/joker`, (req, res) => joker.randomHandler(req, res));

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API server listening on http://0.0.0.0:${PORT}${BASE} (LAN: http://${LAN_IP}:${PORT}${BASE})`);
});
