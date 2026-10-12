# Project Context for AI Agents

## Project Overview

This repository is a full-stack TypeScript application with a React/Vite frontend and a NestJS backend. PostgreSQL is the primary database. Docker Compose is used for containerized deployment and local infrastructure.

## Repository Map

- `frontend/src/app-store/`: Redux Toolkit store, slices, and RTK Query API clients.
- `frontend/src/components/`: shared UI, forms, cart, and application shell.
- `frontend/src/pages/`: route-level page components.
- `frontend/src/router/`: React Router routes and route guards.
- Frontend imports use the `@/*` alias for `frontend/src/*`.
- `backend/src/`: NestJS application modules, including auth, users, products, cart, and currencies.
- `backend/src/migrations/`: database migrations. Add migrations for production schema changes; do not rely on TypeORM synchronization in production.
- `docker-compose.yml`: container orchestration for the application and supporting services.
- `README.md`: authoritative local setup, environment configuration, OAuth, and deployment instructions.

## Development and Verification

Run package commands from the relevant directory:

- Frontend: `cd frontend`; `npm run dev`, `npm run build`, and `npm run lint`.
- Backend: `cd backend`; `npm run start:dev`, `npm run build`, `npm run lint`, `npm test`, and `npm run test:e2e`.
- Containerized deployment: use the documented `docker compose` commands in the README.

Prefer focused tests and linting for the files being changed, then run the build or broader checks when appropriate. The frontend build runs TypeScript project checks before Vite production bundling.

## Working Conventions

- Follow nearby code patterns, TypeScript types, existing ESLint/Prettier rules, and the established module boundaries.
- Keep frontend routing in React Router and use existing RTK Query/API patterns for server communication.
- Never commit secrets or local environment files. Consult the README and example environment files; do not print or expose secret values.
- Treat database volumes and data as persistent: do not use destructive Docker commands such as `docker compose down -v` unless explicitly requested.
- Update relevant documentation when setup, behavior, or operational requirements change.
- Keep user-facing text readable and natural: write Russian text as literal UTF-8, not Unicode escape sequences or mojibake. When touching UI text, inspect and correct all affected strings rather than only decoding escaped characters.
