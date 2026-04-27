# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Project: OrangeTrack — Sistema de Gestão de Laranjas

A premium SaaS-style management system for orange production and distribution companies. Designed with Apple-inspired aesthetics (clean, minimal, structured) with orange (#F57C00) and green (#2E7D32) as primary colors. Dark sidebar, white cards, hairline borders.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite, Tailwind CSS, shadcn/ui, Recharts, Framer Motion, Wouter

## Artifacts

- **orange-manager** (react-vite, `/`) — Main frontend app
- **api-server** (api, `/api`) — Express backend

## Modules

- Dashboard — KPI cards, production chart, order status, quality alerts
- POS / Caixa — Frente de caixa: cadastro/seleção de cliente, produto (estoque ou produção), pagamento (dinheiro/cartão/pix/promissória), entrega ou retirada, controle de caixa do dia
- Orders — Full order management with status workflow
- Customers — Customer CRUD with purchase history
- Products — Product catalog management
- Raw Materials — Incoming orange batch tracking
- Production — Production lot management with quality control (Brix/temperature)
- Inventory — Stock tracking with entries/exits
- Traceability — Full lot timeline from raw material to delivery
- Deliveries — Delivery routing and status tracking
- Reports — Production, Financial, Quality, Discard reports

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
