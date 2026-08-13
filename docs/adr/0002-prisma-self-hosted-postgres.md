# Prisma + self-hosted Postgres, no Supabase

The original codebase talked to Postgres exclusively through the `supabase-js` client, with no schema file, no migrations, and no generated types — the schema existed only as whatever columns happened to be in the Supabase dashboard. We're replacing this with Prisma against a plain, self-hosted Postgres instance (Docker Compose locally, any Postgres host in production). `schema.prisma` becomes the single source of truth for the domain model, with real migrations and fully-typed queries.

Dropping Supabase specifically (rather than just adding Prisma on top of it) removes a vendor dependency that a generic template shouldn't force on adopters — Supabase's value-adds (hosted Auth, Storage) weren't actually being used by the app's own JWT auth, and we deliberately don't build an image-upload pipeline (see the Product `imageUrl`-only decision), so there was nothing left that required Supabase specifically over plain Postgres.
