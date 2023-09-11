# Prisma + tRPC

## Features

- 🧙‍♂️ E2E typesafety with [tRPC](https://trpc.io)
- ⚡ Full-stack React with Next.js
- ⚡ Database with Prisma
- ⚙️ VSCode extensions
- 🎨 ESLint + Prettier
- 💚 CI setup using GitHub Actions:
  - ✅ E2E testing with [Playwright](https://playwright.dev/)
  - ✅ Linting
- 🔐 Validates your env vars on build and start

## Setup

**bun run:**

```bash
bun run create next-app --example https://github.com/trpc/trpc --example-path examples/next-prisma-starter trpc-prisma-starter
cd trpc-prisma-starter
bun run
bun run dx
```

**npm:**

```bash
npx create-next-app --example https://github.com/trpc/trpc --example-path examples/next-prisma-starter trpc-prisma-starter
cd trpc-prisma-starter
bun run
bun run dx
```

### Requirements

- Node >= 14
- Docker (for running Postgres)

## Development

### Start project

```bash
bun run create next-app --example https://github.com/trpc/trpc --example-path examples/next-prisma-starter trpc-prisma-starter
cd trpc-prisma-starter
bun run
bun run dx
```

### Commands

```bash
bun run build      # runs `prisma generate` + `prisma migrate` + `next build`
bun run db-nuke    # resets local db
bun run dev        # starts next.js
bun run dx         # starts postgres db + runs migrations + seeds + starts next.js
bun run test-dev   # runs e2e tests on dev
bun run test-start # runs e2e tests on `next start` - build required before
bun run test:unit  # runs normal jest unit tests
bun run test:e2e   # runs e2e tests
```

## Deployment

### Using [Render](https://render.com/)

The project contains a [`render.yaml`](./render.yaml) [_"Blueprint"_](https://render.com/docs/blueprint-spec) which makes the project easily deployable on [Render](https://render.com/).

Go to [dashboard.render.com/blueprints](https://dashboard.render.com/blueprints) and connect to this Blueprint and see how the app and database automatically gets deployed.

## Files of note

<table>
  <thead>
    <tr>
      <th>Path</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><a href="./prisma/schema.prisma"><code>./prisma/schema.prisma</code></a></td>
      <td>Prisma schema</td>
    </tr>
    <tr>
      <td><a href="./src/pages/api/trpc/[trpc].ts"><code>./src/pages/api/trpc/[trpc].ts</code></a></td>
      <td>tRPC response handler</td>
    </tr>
    <tr>
      <td><a href="./src/server/routers"><code>./src/server/routers</code></a></td>
      <td>Your app's different tRPC-routers</td>
    </tr>
  </tbody>
</table>

---

Created by [@alexdotjs](https://twitter.com/alexdotjs).
