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
page reloads and restarts. Signed-in users get their own rows in `request_history`
(`user_id`-scoped); signed-out visitors keep history in **browser localStorage** only
(a warning label in the sidebar says it is cleared on page reset). Accounts and
sessions are handled by **Better Auth** (`user`, `session`, `account`, `verification`
tables - see `db/schema.sql` and `app/lib/auth.ts`).

Runinng `npm run dev` starting postgress container. See `dev.mjs`

### 2. Configure the connection

```bash
cp .env.example .env.local
```

```bash
DATABASE_URL=postgresql://wander:wander@localhost:5432/wander
```

### 3. Create the schema and verify the connection

```bash
npm run db:migrate   # applies db/schema.sql (idempotent)
npm run db:check     # prints server version + tables
```

### 4. Production database (Neon) - separate from dev

Development keeps using the Docker container above; production uses a managed
**Neon** Postgres on the free tier. The two databases are completely independent -
the app always talks to whichever `DATABASE_URL` it is given, so there is no
conflict between them.

1. Create a free Neon project and copy the **pooled** connection string
   (Neon console -> your project -> Connect). Keep `sslmode=require`.
2. Create the schema on Neon once (idempotent, safe to re-run):

   ```bash
   DATABASE_URL="<neon pooled url>" npm run db:migrate:prod
   ```

   The command prints the connected database name - expect `neondb`, not `wander`.
3. Deploy: import the GitHub repo on your hosting platform (e.g. Vercel) and set
   in the platform's environment variables:
   - `DATABASE_URL` - the same Neon URL
   - `BETTER_AUTH_SECRET` - generate with `openssl rand -base64 32` (>= 32 chars)
   - `BETTER_AUTH_URL` - `https://<your-domain>` (auth breaks without it)

   Every push to the branch redeploys automatically.

Local `.env.local` is git-ignored and only read by local dev, so the Neon
credentials live solely in the hosting platform's environment settings.
Troubleshooting: if the connection fails during the TLS handshake, change
`sslmode=require` to `sslmode=no-verify` in the Neon URL.

### API endpoints

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/db/health` | Connectivity probe (`200` connected / `503` offline) |
| `GET` | `/api/history?limit=50` | Recent history for the signed-in user (max 200) - `401` when signed out |
| `POST` | `/api/history` | Store a sent request - `401` when signed out |
| `DELETE` | `/api/history` | Clear the signed-in user's history - `401` when signed out |
| `DELETE` | `/api/history/:id` | Delete a single own entry - `401` when signed out |
| `POST` | `/api/auth/sign-up/email` | Create an account (Better Auth, no verification email) |
| `POST` | `/api/auth/sign-in/email` | Sign in, sets the session cookie |
| `POST` | `/api/auth/sign-out` | Sign out |
| `GET` | `/api/auth/get-session` | Current session (`null` when signed out) |

The sidebar footer shows the live database status. If the database is unreachable the app keeps
working with in-memory history and reports `DB offline – history not saved`. Signed-out
visitors instead see a `Local storage - browser only` footer plus a warning that
history lives in this browser only and is lost on a page reset.

### Files

```
app/lib/db.ts            # pg connection pool + health probe
app/lib/auth.ts          # Better Auth server instance (email + password)
app/lib/auth-client.ts   # Better Auth browser client (session, sign in/out)
app/lib/history.ts       # history API wrappers + localStorage fallback
app/api/auth/[...all]/   # Better Auth catch-all endpoints
app/api/db/health/       # connectivity endpoint
app/api/history/         # history endpoints (session-gated, per-user)
app/login/ app/signup/   # account pages
db/schema.sql            # database schema (app + auth tables)
docker-compose.yml       # PostgreSQL service (used by npm run dev)
scripts/dev.mjs          # npm run dev - DB lifecycle + Next.js dev server
scripts/db-migrate.mjs   # npm run db:migrate / db:migrate:prod
scripts/db-check.mjs     # npm run db:check
```
