import { Request, Response } from 'express';

const resp: any[] = require('./data/dovui.json');

export const name = '/game/dovui';
export const index = async (req: Request, res: Response, next?: any) => {
  try {
    const length = Array.isArray(resp) ? resp.length : 0;
    if (length === 0) return res.json({ author: 'Dũngkon SUMIPROJECT', data: null });
    const item = resp[Math.floor(Math.random() * length)];
    return res.json({ author: 'Dũngkon SUMIPROJECT', data: item });
  } catch (err: any) {
    return res.status(500).json({ error: true, message: String(err) });
  }
};

export default { name, index };
