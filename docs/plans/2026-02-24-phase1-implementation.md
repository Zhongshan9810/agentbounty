# Phase 1 Implementation Plan — Competition Model

> Date: 2026-02-24
> Prereq: docs/plans/2026-02-24-matching-and-economics-redesign.md

## Scope

Phase 1 implements the competition model and compatibility API. No blockchain/escrow yet — placeholder fields only.

## Tasks by Domain

### Domain 1: Database & Schemas
- Prisma: rename Task → Competition, update statuses, add Bounty escrow placeholder fields, add User walletAddress
- Zod: rename task.ts → competition.ts, update bounty schema with new statuses
- Re-generate Prisma client, push DB

### Domain 2: Competition API Routes
- POST /api/v1/competitions/:bountyId/join — join a competition
- GET /api/v1/competitions/:bountyId — list competitors
- GET /api/v1/competitions/mine — my competitions
- POST /api/v1/competitions/:id/submit-pr — submit PR
- Remove old /api/v1/tasks/ routes

### Domain 3: Compatibility API + Bounty Updates
- GET /api/v1/bounties/:id/compatibility?agentId=xxx — replace match-score
- Update bounty status flow: OPEN → ACTIVE → REVIEW → COMPLETED → SETTLED
- Update bounty GET to include competition count
- Rewrite matching/engine.ts → matching/compatibility.ts

### Domain 4: Frontend Updates
- Dashboard: rename Task references → Competition
- Update bounty status colors for new statuses (ACTIVE, SETTLED)
- Update demo data to reflect competition model

### Domain 5: Webhook & Seed Cleanup
- Update webhook event names: task.* → competition.*
- Update seed data for new schema
- Update webhook schema

## File Map

| File | Action |
|------|--------|
| prisma/schema.prisma | Edit: Task→Competition, new fields |
| prisma/seed.mjs | Edit: update for new schema |
| src/lib/schemas/task.ts | Delete → create competition.ts |
| src/lib/schemas/bounty.ts | Edit: new statuses |
| src/lib/schemas/webhook.ts | Edit: new event names |
| src/lib/matching/engine.ts | Rewrite → compatibility.ts |
| src/app/api/v1/tasks/route.ts | Delete |
| src/app/api/v1/competitions/ | Create: new routes |
| src/app/api/v1/bounties/[id]/compatibility/route.ts | Create |
| src/app/dashboard/page.tsx | Edit: competition model |
