const express = require('express');
const request = require('supertest');

// Mocking the fs.promises
jest.mock('fs', () => ({
    promises: {
        stat: jest.fn(),
        readFile: jest.fn()
    }
}));


const fs = require('fs').promises;

// Importing the router
const statsRouter = require('../routes/stats');

// Helper to create app
function createApp() {
    const app = express();
    app.use('/api/stats', statsRouter);
    app.use((err, req, res, next) => { res.status(500).json({ error: err.message }); });
    return app;
}

describe('GET /api/stats', () => {
    let app;

    beforeEach(() => {
        app = createApp();
        fs.stat.mockReset();
        fs.readFile.mockReset();
    });

    it('should return correct stats when items present', async () => {
        const fakeItems = [{ price: 10 }, { price: 20 }, { price: 30 }];
        fs.stat.mockResolvedValue({ mtimeMs: 100 });
        fs.readFile.mockResolvedValue(JSON.stringify(fakeItems));

        const res = await request(app).get('/api/stats');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ total: 3, averagePrice: 20 });
    });

    it('should return zero stats when no items', async () => {
        const fakeItems = [];
        fs.stat.mockResolvedValue({ mtimeMs: 200 });
        fs.readFile.mockResolvedValue(JSON.stringify(fakeItems));

        const res = await request(app).get('/api/stats');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ total: 0, averagePrice: 0 });
    });

    it('should use cache when file not changed', async () => {
        const fakeItems = [{ price: 5 }, { price: 15 }];
        fs.stat
            .mockResolvedValueOnce({ mtimeMs: 300 })
            .mockResolvedValueOnce({ mtimeMs: 300 });
        fs.readFile.mockResolvedValue(JSON.stringify(fakeItems));

        // First request populates cache
        const res1 = await request(app).get('/api/stats');
        expect(res1.body).toEqual({ total: 2, averagePrice: 10 });

        // Ensure readFile is not called again
        fs.readFile.mockImplementation(() => { throw new Error('Should not read file'); });

        const res2 = await request(app).get('/api/stats');
        expect(res2.body).toEqual({ total: 2, averagePrice: 10 });
    });

    it('should return 500 on fs.stat error', async () => {
        fs.stat.mockRejectedValue(new Error('stat error'));

        const res = await request(app).get('/api/stats');
        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('error', 'stat error');
    });
});
