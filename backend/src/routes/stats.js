const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();
const DATA_PATH = path.join(__dirname, '../../data/items.json');

let cache = {
  status: null,
  mtimeMs: 0
}

// GET /api/stats
router.get('/', async (req, res, next) => {
  try {
    const stat = await fs.stat(DATA_PATH);
    if (!cache.status || cache.mtimeMs < stat.mtimeMs) {
      const raw = await fs.readFile(DATA_PATH, 'utf-8');
      const items = JSON.parse(raw);

      cache.status = computeStats(items);
      cache.mtimeMs = stat.mtimeMs;
    }
    res.json(cache.status);
  } catch (err) {
    next(err);
  }
});

function computeStats(items) {
  const total = items.length;
  const averagePrice = total > 0
      ? items.reduce((acc, cur) => acc + cur.price, 0) / total
      : 0;
  return {total, averagePrice};
}


module.exports = router;