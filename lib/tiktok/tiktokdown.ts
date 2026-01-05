import axios from 'axios';
import { Request, Response } from 'express';

export const name = '/tiktok';
const tikwm = `https://www.tikwm.com`;

export const index = async (req: Request, res: Response) => {
  try {
    const { user, video, music, trending, search, info } = req.query as any;
    let data: any = null;

    if (user) {
      const resp = await axios.post(`${tikwm}/api/user/posts`, { unique_id: String(user) });
      data = resp.data;
    } else if (video || (req.query as any).url) {
      const theUrl = String(video || (req.query as any).url);
      const resp = await axios.post(`${tikwm}/api/`, { url: theUrl });
      data = resp.data;
    } else if (music) {
      const resp = await axios.post(`${tikwm}/api/music/posts`, { music_id: String(music) });
      data = resp.data;
    } else if (trending) {
      const resp = await axios.post(`${tikwm}/api/feed/list`, { region: String(trending) });
      data = resp.data;
    } else if (search) {
      const resp = await axios.post(`${tikwm}/api/feed/search?keywords=${encodeURIComponent(String(search))}`);
      data = resp.data;
    } else if (info) {
      const resp = await axios.post(`${tikwm}/api/user/info?unique_id=${encodeURIComponent(String(info))}`);
      data = resp.data;
    } else {
      return res.status(400).json({ error: 'no action specified' });
    }

    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: true, message: String(err) });
  }
};

export default { name, index };
