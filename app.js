import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';

export function createApp(database) {
  const app = express();
  app.use(cors({ origin: true }));
  app.use(express.json());

  const mapTicket = (ticket) => ({
    id: ticket.id,
    code: ticket.code,
    used: Boolean(ticket.used),
    createdAt: ticket.created_at,
    usedAt: ticket.used_at
  });

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.get('/api/tickets', (_req, res) => {
    const tickets = database.prepare('SELECT * FROM tickets ORDER BY id DESC').all();
    res.json(tickets.map(mapTicket));
  });

  app.post('/api/tickets', (_req, res) => {
    let ticket;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      try {
        const result = database.prepare('INSERT INTO tickets (code) VALUES (?)').run(code);
        ticket = database.prepare('SELECT * FROM tickets WHERE id = ?').get(result.lastInsertRowid);
        break;
      } catch (error) {
        if (!error.message.includes('UNIQUE')) throw error;
      }
    }
    if (!ticket) return res.status(500).json({ error: 'Kunde inte skapa en unik biljettkod.' });
    return res.status(201).json(mapTicket(ticket));
  });

  app.post('/api/tickets/use', (req, res) => {
    const code = String(req.body?.code ?? '').trim().toUpperCase();
    if (!code) return res.status(400).json({ error: 'En biljettkod måste anges.' });
    const ticket = database.prepare('SELECT * FROM tickets WHERE code = ?').get(code);
    if (!ticket) return res.status(404).json({ error: 'Biljettkoden finns inte.' });
    if (ticket.used) return res.status(409).json({ error: 'Biljetten är redan använd.' });
    database.prepare("UPDATE tickets SET used = 1, used_at = datetime('now') WHERE id = ?").run(ticket.id);
    return res.json(mapTicket(database.prepare('SELECT * FROM tickets WHERE id = ?').get(ticket.id)));
  });

  app.delete('/api/tickets/:id', (req, res) => {
    const ticket = database.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Biljetten finns inte.' });
    if (ticket.used) return res.status(409).json({ error: 'En använd biljett får inte raderas.' });
    database.prepare('DELETE FROM tickets WHERE id = ?').run(ticket.id);
    return res.status(204).send();
  });

  app.use((_req, res) => res.status(404).json({ error: 'Resursen hittades inte.' }));
  return app;
}
