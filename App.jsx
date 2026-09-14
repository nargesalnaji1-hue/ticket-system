import { useEffect, useState } from 'react';
import './styles.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function App() {
  const [tickets, setTickets] = useState([]);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadTickets() {
    const response = await fetch(`${API_URL}/tickets`);
    if (!response.ok) throw new Error('Kunde inte hämta biljetter.');
    setTickets(await response.json());
  }

  useEffect(() => { loadTickets().catch((err) => setError(err.message)); }, []);

  async function createTicket() {
    setLoading(true); setError(''); setMessage('');
    try {
      const response = await fetch(`${API_URL}/tickets`, { method: 'POST' });
      const ticket = await response.json();
      if (!response.ok) throw new Error(ticket.error);
      setMessage(`Ny biljett skapad: ${ticket.code}`);
      await loadTickets();
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }

  async function useTicket(event) {
    event.preventDefault(); setLoading(true); setError(''); setMessage('');
    try {
      const response = await fetch(`${API_URL}/tickets/use`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code })
      });
      const ticket = await response.json();
      if (!response.ok) throw new Error(ticket.error);
      setMessage(`Biljetten ${ticket.code} är nu använd.`);
      setCode(''); await loadTickets();
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }

  async function deleteTicket(id) {
    setError(''); setMessage('');
    const response = await fetch(`${API_URL}/tickets/${id}`, { method: 'DELETE' });
    if (!response.ok) { const body = await response.json(); setError(body.error); return; }
    setMessage('Biljetten raderades.'); await loadTickets();
  }

  return (
    <main className="container">
      <header><p className="eyebrow">INL 1 · BILJETTSYSTEM</p><h1>Biljettcentral</h1><p>Skapa, använd och administrera biljetter.</p></header>
      {message && <div className="notice success" role="status">{message}</div>}
      {error && <div className="notice error" role="alert">{error}</div>}
      <section className="actions">
        <article><h2>Skapa biljett</h2><p>Generera en slumpmässig kod.</p><button onClick={createTicket} disabled={loading}>Skapa biljett</button></article>
        <article><h2>Använd biljett</h2><p>En kod kan bara användas en gång.</p><form onSubmit={useTicket}><label htmlFor="code">Biljettkod</label><input id="code" value={code} onChange={(event) => setCode(event.target.value)} placeholder="T.ex. 1A2B3C4D" required /><button disabled={loading}>Använd biljett</button></form></article>
      </section>
      <section className="list"><div className="list-heading"><h2>Biljetter i systemet</h2><button className="secondary" onClick={() => loadTickets().catch((err) => setError(err.message))}>Uppdatera</button></div>
        {tickets.length === 0 ? <p>Det finns inga biljetter ännu.</p> : <div className="table-wrap"><table><thead><tr><th>Kod</th><th>Status</th><th>Skapad</th><th>Åtgärd</th></tr></thead><tbody>{tickets.map((ticket) => <tr key={ticket.id}><td><code>{ticket.code}</code></td><td><span className={`badge ${ticket.used ? 'used' : 'available'}`}>{ticket.used ? 'Använd' : 'Oanvänd'}</span></td><td>{new Date(ticket.createdAt).toLocaleString('sv-SE')}</td><td><button className="danger" disabled={ticket.used} onClick={() => deleteTicket(ticket.id)}>Radera</button></td></tr>)}</tbody></table></div>}
      </section>
    </main>
  );
}
