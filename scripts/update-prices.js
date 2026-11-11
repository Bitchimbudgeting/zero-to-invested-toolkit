// Runs once a day from GitHub Actions (see .github/workflows/update-prices.yml).
// Fetches every ticker in scripts/tickers.txt from Twelve Data, a few at a time to respect
// the free plan's per minute limit, and writes public/prices.json.
// If a ticker fails, its previous value is kept, so one bad call never wipes the site.
const fs = require('fs');
const path = require('path');

const KEY = process.env.TWELVE_DATA_API_KEY;
if (!KEY) { console.error('Missing TWELVE_DATA_API_KEY'); process.exit(1); }

const OUT = path.join(__dirname, '..', 'public', 'prices.json');
const tickers = fs.readFileSync(path.join(__dirname, 'tickers.txt'), 'utf8').split(/\s+/).filter(Boolean);
const CHUNK = 8;            // free plan: 8 credits per minute
const WAIT_MS = 62 * 1000;  // wait a little over a minute between chunks

let prev = { updatedAt: null, quotes: {} };
try { prev = JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch (e) {}
const quotes = { ...(prev.quotes || {}) };
const sleep = ms => new Promise(r => setTimeout(r, ms));

function toQuote(d) {
  const price = parseFloat(d.close);
  if (!isFinite(price)) return null;
  const pc = parseFloat(d.percent_change);
  const fw = d.fifty_two_week || {};
  const lo = parseFloat(fw.low), hi = parseFloat(fw.high);
  return {
    name: d.name || null,
    price,
    change: isFinite(pc) ? pc : null,
    low52: isFinite(lo) ? lo : null,
    high52: isFinite(hi) ? hi : null,
    currency: d.currency || null,
    asOf: d.datetime || null,
  };
}

async function fetchChunk(list) {
  const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(list.join(','))}&apikey=${KEY}`;
  const resp = await fetch(url);
  const data = await resp.json();
  // One symbol returns the object itself, several return an object keyed by symbol.
  const bySym = list.length === 1 ? { [list[0]]: data } : data;
  let ok = 0;
  for (const sym of list) {
    const d = bySym[sym];
    if (d && d.status !== 'error' && !d.code) {
      const q = toQuote(d);
      if (q) { quotes[sym] = q; ok++; continue; }
    }
    console.warn('No fresh data for', sym, d && d.message ? d.message : '');
  }
  return ok;
}

(async () => {
  let ok = 0;
  for (let i = 0; i < tickers.length; i += CHUNK) {
    const list = tickers.slice(i, i + CHUNK);
    try { ok += await fetchChunk(list); } catch (e) { console.warn('Chunk failed', list.join(','), e.message); }
    if (i + CHUNK < tickers.length) await sleep(WAIT_MS);
  }
  console.log(`Updated ${ok} of ${tickers.length} tickers.`);
  if (ok === 0) { console.error('Nothing updated, leaving prices.json as is.'); process.exit(1); }
  fs.writeFileSync(OUT, JSON.stringify({ updatedAt: new Date().toISOString(), quotes }, null, 1));
})();
