# Turborepo + Bun workspaces monorepo

Shopstart is structured as a Turborepo-managed Bun workspace: `apps/api` (NestJS), `apps/web` (TanStack Start storefront), `apps/admin` (TanStack Router admin SPA), and `packages/*` for code shared between them (starting with `packages/types` for DTOs shared between the API and both frontends). We considered plain Bun workspaces without Turborepo, which would mean fewer moving parts and one less tool for adopters to learn.

We chose Turborepo anyway because the template ships three separate apps from day one that need to build/lint/test/dev together, and task orchestration (a single `turbo dev` running all three with clean interleaved output, `turbo build` respecting dependency order between `packages/*` and the apps that consume them) is exactly the problem Turborepo solves. The cost is one additional tool in the stack; the alternative was every adopter re-deriving their own root scripts for the same three-app coordination problem.
