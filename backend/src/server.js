import { createApp } from './app.js';
import { db } from './database.js';

const port = Number(process.env.PORT || 3001);
const app = createApp(db);

app.listen(port, () => {
  console.log(`Ticket API kör på http://localhost:${port}`);
});
