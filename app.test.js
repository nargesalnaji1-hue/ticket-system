import { afterEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import Database from 'better-sqlite3';
import { createApp } from '../src/app.js';

const databases = [];
function setup() {
  const database = new Database(':memory:');
  database.exec(`CREATE TABLE tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    used INTEGER NOT NULL DEFAULT 0 CHECK (used IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    used_at TEXT
  )`);
  databases.push(database);
  return request(createApp(database));
}

afterEach(() => databases.splice(0).forEach((database) => database.close()));

describe('Ticket API', () => {
  it('skapar en biljett med en unik kod', async () => {
    const api = setup();
    const response = await api.post('/api/tickets');
    expect(response.status).toBe(201);
    expect(response.body.code).toMatch(/^[A-F0-9]{8}$/);
    expect(response.body.used).toBe(false);
  });

  it('listar biljetter och markerar en använd biljett', async () => {
    const api = setup();
    const created = await api.post('/api/tickets');
    await api.post('/api/tickets/use').send({ code: created.body.code });
    const response = await api.get('/api/tickets');
    expect(response.body).toHaveLength(1);
    expect(response.body[0].used).toBe(true);
  });

  it('hindrar återanvändning av en biljett', async () => {
    const api = setup();
    const created = await api.post('/api/tickets');
    await api.post('/api/tickets/use').send({ code: created.body.code });
    const response = await api.post('/api/tickets/use').send({ code: created.body.code });
    expect(response.status).toBe(409);
  });

  it('raderar oanvänd biljett men inte använd biljett', async () => {
    const api = setup();
    const unused = await api.post('/api/tickets');
    expect((await api.delete(`/api/tickets/${unused.body.id}`)).status).toBe(204);
    const used = await api.post('/api/tickets');
    await api.post('/api/tickets/use').send({ code: used.body.code });
    expect((await api.delete(`/api/tickets/${used.body.id}`)).status).toBe(409);
  });
});
