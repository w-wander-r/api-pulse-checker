# Agent Instructions: API Pulse Check Application

## Tech Stack & Architecture
- **Frontend:** Next.js (App Router, TypeScript, Tailwind CSS).
- **Backend/API:** Node.js (Express or Next.js Route Handlers).
- **Domain:** HTTP Client & Monitoring Tool (Postman alternative). Handles sending HTTP requests (GET, POST, PUT, DELETE), displaying responses, status codes, timing metrics, and headers.

## Development Standards
- **Component Design:** Keep UI components modular. Separate request building UI, response viewer, and history sidebar into distinct components.
- **Type Safety:** Maintain strict TypeScript interfaces for API Requests, Responses, and Environment variables.
- **Error Handling:** Gracefully catch network errors, timeouts, and CORS issues when sending API calls.

## Key Terminal Commands
- **Install Dependencies:** `npm install`
- **Run Dev Server:** `npm run dev`
- **Build & Lint:** `npm run build && npm run lint`

## Agent Guidelines
- Before making multi-file edits, outline a 2-step execution plan.
- Always run `npm run lint` or check TypeScript diagnostics after modifying API routes.
- Do not store API keys or secrets directly in code; use `.env.local`.