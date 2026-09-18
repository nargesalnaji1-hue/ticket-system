import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.jsx';

const tickets = [{ id: 1, code: 'AB12CD34', used: false, createdAt: '2026-01-01T12:00:00Z', usedAt: null }];

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn((url, options) => {
    if (url.endsWith('/tickets') && (!options || !options.method)) return Promise.resolve({ ok: true, json: async () => tickets });
    if (url.endsWith('/tickets') && options?.method === 'POST') return Promise.resolve({ ok: true, json: async () => ({ ...tickets[0], id: 2, code: 'FF00EE11' }) });
    return Promise.resolve({ ok: true, json: async () => ({}) });
  }));
});

describe('Ticket UI', () => {
  it('visar biljetter som hämtas från API:et', async () => {
    render(<App />);
    expect(await screen.findByText('AB12CD34')).toBeInTheDocument();
    expect(screen.getByText('Oanvänd')).toBeInTheDocument();
  });

  it('skapar biljett när användaren klickar på knappen', async () => {
    render(<App />);
    await screen.findByText('AB12CD34');
    const createButton = screen.getAllByRole('button', { name: 'Skapa biljett' })[0];
    fireEvent.click(createButton);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('FF00EE11'));
  });
});
