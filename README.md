# MenuPass / MinePay Clone - Full Scope Monorepo Scaffold

This repository now includes an integrated **API + Web + Mobile** project structure with Prisma/PostgreSQL and realtime kitchen events.

## Project Structure

- `src/` → Node API (Express + Prisma + WebSocket)
- `prisma/` → Prisma schema
- `apps/web/` → Next.js 14 App Router frontend (Totem, Kitchen, Sponsor)
- `apps/mobile/` → Expo React Native app (Consumer + Sponsor)
- `docker-compose.yml` → PostgreSQL service

## Integrations Included

- Wallet validation + transaction engine (`validateOrder`, `processTransaction`)
- Asaas PIX generation and webhook crediting
- RBAC middleware for protected routes
- Kitchen realtime event stream (`order:paid`, `order:status`) over WebSocket
- Totem touch-first grid + Web NFC fallback + face descriptor matching utility
- Sponsor controls for daily limits and blacklist governance

## API Boot

```bash
cp .env.example .env
docker compose up -d
npm install
npm run prisma:generate
npm run prisma:push
npm run dev
```

API base: `http://localhost:4000/api`
WebSocket KDS: `ws://localhost:4000/ws/kds`

## Web Boot

```bash
cd apps/web
npm install
npm run dev
```

Web app: `http://localhost:3000`

## Mobile Boot

```bash
cd apps/mobile
npm install
npm run start
```

## Important Notes

- This is a full-scope scaffold with realistic integration wiring; provider credentials (Asaas, etc.) must be supplied in `.env`.
- Use `x-role` request header (`SUPERADMIN`, `MERCHANT`, `SPONSOR`, `CONSUMER`) to test RBAC-protected API endpoints.
