# Contributing to shopstart

Thanks for taking the time to contribute!

## Development workflow

1. **Fork the repository** to your own GitHub account.
2. **Clone the project** and run `bun install` at the repo root.
3. **Create a branch** for your fix or feature:
   ```bash
   git checkout -b feat/amazing-new-feature
   # or
   git checkout -b fix/annoying-bug
   ```
4. **Make your changes** and test them locally (`bun run dev`, `bun run test`).
5. **Commit** using [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat: add support for saved payment methods"
   ```
6. **Push your branch** and open a Pull Request.

## Code style & standards

- **Runtime:** [Bun](https://bun.sh/). Please don't commit `package-lock.json` or `yarn.lock`.
- **TypeScript:** strict typing throughout. Avoid `any` unless there's a real reason.
- **Domain terms:** if a change touches the domain model (Cart, Order, Review, etc.),
  read [`CONTEXT.md`](./CONTEXT.md) first and update it if the model changes.
- **Architecture decisions:** hard-to-reverse, non-obvious technical choices belong in
  [`docs/adr/`](./docs/adr) — see existing ADRs for the format.

## Before submitting a PR

- `bun run lint`, `bun run typecheck`, and `bun run test` all pass.
- `bun run build` succeeds for all three apps.
- The relevant flow works end-to-end locally (register → browse → cart → checkout,
  or the admin equivalent).

## Reporting bugs

Please include steps to reproduce, expected vs. actual behavior, and any relevant
log output.

Happy coding!
