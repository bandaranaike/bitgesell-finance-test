const request = require('supertest');
const express = require('express');
const fs = require('fs');
const itemsRouter = require('../routes/items');

// Mock fs.promises
jest.mock('fs', () => ({
    promises: {
        readFile: jest.fn(),
        writeFile: jest.fn(),
    },
}));
const fsPromises = fs.promises;

describe('Items API Routes', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/api/items', itemsRouter);
        // Error handler to format errors
        app.use((err, req, res, next) => {
            res.status(err.status || 500).json({ message: err.message });
        });
        jest.clearAllMocks();
    });


    describe('GET /api/items', () => {
        it('returns all items (happy path)', async () => {
            const items = [{ id: 1, name: 'AAA', price: 100 }, { id: 2, name: 'BBB', price: 200 }];
            fsPromises.readFile.mockResolvedValue(JSON.stringify(items));

            const res = await request(app).get('/api/items');
            expect(res.status).toBe(200);
            expect(res.body).toEqual(items);
            expect(fsPromises.readFile).toHaveBeenCalledWith(expect.any(String), 'utf-8');
        });

        it('filters by query parameter', async () => {
            const items = [
                { id: 1, name: 'CCC', price: 10 },
                { id: 2, name: 'DDD', price: 20 },
            ];
            fsPromises.readFile.mockResolvedValue(JSON.stringify(items));

            const res = await request(app).get('/api/items?q=cc');
            expect(res.status).toBe(200);
            expect(res.body).toEqual([{ id: 1, name: 'CCC', price: 10 }]);
        });

        it('applies limit parameter', async () => {
            const items = [
                { id: 1, name: 'A', price: 1 },
                { id: 2, name: 'B', price: 2 },
                { id: 3, name: 'C', price: 3 },
            ];
            fsPromises.readFile.mockResolvedValue(JSON.stringify(items));

            const res = await request(app).get('/api/items?limit=2');
            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
        });

        it('handles read errors', async () => {
            fsPromises.readFile.mockRejectedValue(new Error('Read failed'));

            const res = await request(app).get('/api/items');
            expect(res.status).toBe(500);
            expect(res.body).toHaveProperty('message', 'Read failed');
        });
    });

    describe('GET /api/items/:id', () => {
        it('returns a single item when found', async () => {
            const items = [{ id: 1, name: 'Only', price: 50 }];
            fsPromises.readFile.mockResolvedValue(JSON.stringify(items));

            const res = await request(app).get('/api/items/1');
            expect(res.status).toBe(200);
            expect(res.body).toEqual(items[0]);
        });

        it('returns 404 when item not found', async () => {
            const items = [{ id: 1, name: 'Only', price: 50 }];
            fsPromises.readFile.mockResolvedValue(JSON.stringify(items));

            const res = await request(app).get('/api/items/2');
            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('message', 'Item not found');
        });

        it('handles read errors on single item fetch', async () => {
            fsPromises.readFile.mockRejectedValue(new Error('Read failed'));

            const res = await request(app).get('/api/items/1');
            expect(res.status).toBe(500);
            expect(res.body).toHaveProperty('message', 'Read failed');
        });
    });

    describe('POST /api/items', () => {
        it('creates a new item (happy path)', async () => {
            const existing = [];
            fsPromises.readFile.mockResolvedValue(JSON.stringify(existing));
            fsPromises.writeFile.mockResolvedValue();

            const newItem = { name: 'New', price: 123 };
            const res = await request(app)
                .post('/api/items')
                .send(newItem)
                .set('Content-Type', 'application/json');

            expect(res.status).toBe(201);
            expect(res.body).toMatchObject(newItem);
            expect(res.body).toHaveProperty('id');
            expect(fsPromises.writeFile).toHaveBeenCalledWith(
                expect.any(String),
                expect.stringContaining(`"name": "New"`),
                'utf-8'
            );
        });

        it('handles write errors', async () => {
            fsPromises.readFile.mockResolvedValue(JSON.stringify([]));
            fsPromises.writeFile.mockRejectedValue(new Error('Write failed'));

            const res = await request(app)
                .post('/api/items')
                .send({ name: 'Fail', price: 0 })
                .set('Content-Type', 'application/json');

            expect(res.status).toBe(500);
            expect(res.body).toHaveProperty('message', 'Write failed');
        });
    });
});
