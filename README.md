# MenuPass / MinePay Clone (Scaffold)

Full-stack scaffold for a cashless canteen SaaS:

- **Backend API**: Express + Prisma controllers/services (`src/`)
- **Web app modules**: Next.js style pages for Totem, Sponsor, and Kitchen (`apps/web/src/app`)
- **Mobile app modules**: Expo screens for consumer and sponsor (`apps/mobile`)

## Implemented Domains

- Multi-tenant RBAC entities (`Tenant`, `User`, `Wallet`, `Ledger`, `Product`, `Order`, `AsaasPayment`).
- Wallet engine with `validateOrder()` and atomic `processTransaction()`.
- Sponsor governance for daily limits and product blacklist.
- Asaas Pix create + webhook processing.
- Totem with NFC fallback and face descriptor matching.
- KDS websocket stream (`order:paid`, `order:status`) + status lifecycle.

## Main Entry Points

- API server: `src/server.ts`
- API routes: `src/routes/index.ts`
- Totem page: `apps/web/src/app/totem/page.tsx`
- Kitchen page: `apps/web/src/app/kitchen/page.tsx`
- Sponsor page: `apps/web/src/app/sponsor/page.tsx`
- Expo root: `apps/mobile/App.tsx`

## Notes

This repository is currently a source scaffold only (no package manifests were provided in workspace), so runtime bootstrapping (`npm install`, migrations, env wiring) should be added in the host project.
