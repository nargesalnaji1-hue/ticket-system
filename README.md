# Biljettcentral – INL 1

## Kort beskrivning

Biljettcentral är ett fullstack-monorepo där en användare kan skapa biljetter med slumpmässiga koder, använda en biljett genom att ange koden, lista alla biljetter och radera biljetter som ännu inte är använda. Frontend är byggd med **React**, backend med **Node.js och Express**, och data sparas i en lokal **SQLite-databas** med `better-sqlite3`.

Projektet är byggt för att visa hur frontend, backend, CORS och en NoSQL/SQL-liknande lokal datalagring kan kopplas ihop. I denna implementation används SQLite enligt uppgiftens exempel. SQLite är en relationsdatabas, inte en NoSQL-databas; Node.js samarbetar med databasen genom `better-sqlite3` och SQL-frågor.

## Funktioner

- Skapa en biljett med en slumpmässig kod på åtta tecken.
- Använda en biljett genom att skriva in koden.
- Förhindra att samma biljett används två gånger.
- Lista alla biljetter med status **Oanvänd** eller **Använd**.
- Radera en biljett om den inte är använd.
- Förhindra radering av använda biljetter.
- Backend med JSON API, CORS och validering.
- Tester för både backend och frontend.

## Teknik och arkitektur

```text
+----------------------+       HTTP/JSON        +-------------------------+
| React + Vite         |  <------------------->  | Node.js + Express       |
| localhost:5173       |      CORS tillåter     | localhost:3001          |
+----------------------+                         +------------+------------+
                                                            |
                                                            | better-sqlite3
                                                            v
                                                +-------------------------+
                                                | SQLite: tickets.db      |
                                                | tickets-tabell          |
                                                +-------------------------+
```

### Databasdesign

Databasen skapas automatiskt vid start i `backend/data/tickets.db`.

```text
TABLE tickets
------------------------------------------------------------------------
| Kolumn     | Typ       | Regler                  | Beskrivning        |
------------------------------------------------------------------------
| id         | INTEGER   | PRIMARY KEY AUTOINCREMENT | Unikt ID         |
| code       | TEXT      | NOT NULL, UNIQUE        | Biljettkod         |
| used       | INTEGER   | NOT NULL, 0 eller 1     | Om den är använd   |
| created_at | TEXT      | NOT NULL                | Skapad tid         |
| used_at    | TEXT      | NULL                    | Använd tid         |
------------------------------------------------------------------------
```

`code` har en unik begränsning i databasen. Det betyder att databasen också skyddar mot dubbletter, även om två requests skulle inträffa nära varandra.

## CORS

**CORS** betyder *Cross-Origin Resource Sharing*. En origin består av protokoll, domän och port. När frontend körs på `http://localhost:5173` och backend på `http://localhost:3001` har de olika origin eftersom porten skiljer sig.

Webbläsaren blockerar som standard sådana cross-origin-anrop. Backend använder därför Express-middleware:

```js
app.use(cors({ origin: true }));
```

Detta lägger till CORS-headers i svaren, så att frontend får läsa API-svaren. I ett produktionssystem bör `origin` begränsas till frontendens riktiga adress i stället för att tillåta alla origins. CORS är en webbläsarregel, inte autentisering eller åtkomstkontroll. Därför behövs fortfarande validering och behörighetskontroller på backend.

## API-endpoints

| Metod | Endpoint | Användning | Svar |
|---|---|---|---|
| GET | `/api/health` | Hälsokontroll | `200` |
| GET | `/api/tickets` | Lista biljetter | `200` + JSON-lista |
| POST | `/api/tickets` | Skapa biljett | `201` + biljett |
| POST | `/api/tickets/use` | Använd kod | `200`, `400`, `404` eller `409` |
| DELETE | `/api/tickets/:id` | Radera oanvänd biljett | `204`, `404` eller `409` |

### Säkerhet och behörighet

I denna skoluppgift finns ingen inloggning. Alla kan skapa och använda biljetter i den lokala applikationen. Backendreglerna skyddar ändå datan: en saknad kod ger `404`, en tom kod ger `400`, en redan använd biljett ger `409`, och en använd biljett kan inte raderas. I ett större system bör radering skyddas med autentisering och en administratörsroll.

## TDD: red, green, refactor

Arbetssättet har varit:

1. **Red:** skriva tester för att skapa, använda, lista och radera biljetter innan implementationen är färdig.
2. **Green:** implementera minsta möjliga backend och frontend så att testerna går igenom.
3. **Refactor:** separera databasen från Express-appen, lägga till tydliga felkoder, validering och återanvändbara funktioner.

Backendtesterna använder en separat SQLite-databas i minnet. Därför påverkar testerna inte den riktiga `tickets.db`. Frontendtesterna kör React i jsdom och mockar `fetch`.

## Installation och körning

Förutsättning: Node.js 18 eller senare.

```bash
# Klona repot och gå in i projektet
cd ticket-system

# Installera beroenden
npm install
npm install --prefix backend
npm install --prefix frontend

# Starta backend och frontend samtidigt
npm run dev
```

Frontend öppnas på `http://localhost:5173` och backend kör på `http://localhost:3001`.

Det går också att starta dem var för sig:

```bash
npm run dev --prefix backend
npm run dev --prefix frontend
```

## Test och build

```bash
npm test
npm run build --prefix frontend
```

## Kodproblem och lösning till frågelådan

**Namn:** Narges

**Kodproblem:** Jag behövde se till att en biljett inte kunde användas två gånger. Om kontrollen av `used` och uppdateringen av databasen görs på fel sätt kan två requests i teorin försöka använda samma biljett samtidigt.

**Lösning:** Backend hämtar först biljetten och avbryter med status `409` om den redan är använd. Därefter uppdateras samma rad med `used = 1` och `used_at`. Dessutom finns en databasbegränsning på `code` så att dubbletter inte kan sparas. I en mer avancerad version skulle jag använda en transaktion eller en atomisk `UPDATE ... WHERE used = 0` och kontrollera antal uppdaterade rader.
