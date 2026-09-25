# API Pulse Check

API Pulse Check is an HTTP client application that allows users to build and send HTTP requests, inspect responses, and track request history. It provides a clean, browser-based interface for testing and debugging APIs.

## Overview

- **Purpose**: API Pulse Check simplifies API testing by providing an intuitive interface for constructing HTTP requests and analyzing responses — including status codes, response time, headers, and body content.

- **Web-Based**: As a web application, API Pulse Check runs entirely in the browser, requiring no installation or configuration. Simply open it in your browser and start testing.

- **Open Source**: The source code is available on GitHub, encouraging collaboration and contributions from developers around the world.

- **Client-Side**: All requests are made directly from the browser using the native Fetch API, making it lightweight and fast.

## Features

- **Request Builder**: Select HTTP method (GET, POST, PUT, DELETE, PATCH), enter URL, add custom headers, and include request body.

- **Response Viewer**: View status codes (color-coded by category), response time, response size, and formatted response body.

- **Request History**: Automatically logs all sent requests with method, URL, timestamp, and status for easy reference.

- **Error Handling**: Gracefully handles network errors, CORS issues, and timeouts with descriptive messages.

- **JSON Formatting**: Automatically pretty-prints JSON responses for readability.

## Technologies Used

- **Next.js**: React framework with App Router for file-based routing and build optimization.

- **React**: UI library for building component-based interactive interfaces.

- **TypeScript**: Static type safety for requests, responses, and application state.

- **Tailwind CSS**: Utility-first CSS framework for responsive, dark-mode-first styling.

- **Node.js**: Runtime for development server and build tooling.

## Database

Request history is persisted in **PostgreSQL** through Next.js Route Handlers, so it survives
page reloads and restarts. Everything the app needs lives in `request_history` (see `db/schema.sql`).

Runinng `npm run dev` starting postgress container. See `dev.mjs`

### 2. Configure the connection

```bash
cp .env.example .env.local
```

`.env.local` is git-ignored; never commit real credentials.

```bash
DATABASE_URL=postgresql://wander:wander@localhost:5432/wander
```

### 3. Create the schema and verify the connection

```bash
npm run db:migrate   # applies db/schema.sql (idempotent)
npm run db:check     # prints server version + tables
```

### API endpoints

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/db/health` | Connectivity probe (`200` connected / `503` offline) |
| `GET` | `/api/history?limit=50` | Recent history, newest first (max 200) |
| `POST` | `/api/history` | Store a sent request |
| `DELETE` | `/api/history` | Clear all history |
| `DELETE` | `/api/history/:id` | Delete a single entry |

The sidebar footer shows the live database status. If the database is unreachable the app keeps
working with in-memory history and reports `DB offline – history not saved`.

### Files

```
app/lib/db.ts            # pg connection pool + health probe
app/lib/history.ts       # client-side fetch wrappers for the history API
app/api/db/health/       # connectivity endpoint
app/api/history/         # history collection + single-entry endpoints
db/schema.sql            # database schema
docker-compose.yml       # PostgreSQL service (used by npm run dev)
scripts/dev.mjs          # npm run dev - DB lifecycle + Next.js dev server
scripts/db-migrate.mjs   # npm run db:migrate
scripts/db-check.mjs     # npm run db:check
```
