const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();
const DATA_PATH = path.join(__dirname, '../../../data/items.json');

async function readData() {
    const raw = await fs.readFile(DATA_PATH, 'utf-8');
    return JSON.parse(raw);
}

router.get('/', async (req, res, next) => {
    try {
        const data = await readData();
        const {limit: rawLimit, page: rawPage, q} = req.query;

        // Search
        let results = data;
        if (q) {
            const term = q.toLowerCase();
            results = results.filter(item =>
                item.name.toLowerCase().includes(term)
            );
        }


        // Pagination defaults
        const limit = parseInt(rawLimit, 10) || 10;
        const page = parseInt(rawPage, 10) || 1;
        const total = results.length;
        const totalPages = Math.ceil(total / limit);

        // Slice out current page
        const start = (page - 1) * limit;
        const pageItems = results.slice(start, start + limit);

        // Return both data and  meta
        res.json({
            data: pageItems,
            meta: {
                total,
                page,
                totalPages,
            }
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;