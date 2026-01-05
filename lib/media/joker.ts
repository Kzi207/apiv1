import fs from "fs";
import path from "path";

const dataPath = path.join(__dirname, "data", "joker.json");
let list: string[] = [];
try {
  const raw = fs.readFileSync(dataPath, "utf8");
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed)) list = parsed as string[];
} catch (err) {
  list = [];
}

export function getRandomCadao() {
  if (!list || list.length === 0) return null;
  const idx = Math.floor(Math.random() * list.length);
  return { total: list.length, index: idx, url: list[idx] };
}

export function randomHandler(req: any, res: any) {
  const data = getRandomCadao();
  if (!data) return res.json({ error: "no data" });
  let url = data.url;
  const cre = req.query && (req.query.cre || req.query.creator) ? (req.query.cre || req.query.creator) : 'Khánh Duy';
  const payload = { total: data.total, index: data.index, url, cre };
  if (res && typeof res.setHeader === 'function') {
    res.setHeader('Content-Type', 'application/json');
    return res.json(payload);
  }
  return payload;
}

export default getRandomCadao;
