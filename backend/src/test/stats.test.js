const express = require('express');
const request = require('supertest');

jest.mock('fs', () => ({
    promise: {
        stat: jest.fn(),
        readFile: jest.fn()
    }
}));


const fs = require('fs').promises;

// Importing the router
const statsRouter = require('../routes/stats');

function createApp() {
    const app = express();
    app.use('/api/stats', statsRouter);
    app.use((err, req, res, next) => {
        res.status(500).json({error: err.message});
    });
    return app;
}


describe('GET /api/stats', () => {
    let app;
    beforeEach(() => {
        app = createApp();
        fs.stat.mockReset();
        fs.readFile.mockReset()
    })

    it('should return correct stats when items present', async () => {
        const fakeItems = [{price: 10}, {price: 20}, {price: 30}];
        fs.stats.mockResolvedValue({mtimesMs: 100});
        fs.readFile.mockResolvedValue(JSON.stringify(fakeItems))

        const res = await request(app).get('/api/stats');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({total: 3, averagePrice: 20});
    })

    it('should return zero stats when no items', async () => {

    })

    it('should use cache when file not changed', async () => {

    })

    it('should return 500 on fs.stat error', async () => {

    })
})