# Zipper

Welcome to the Zipper Functions repo. If you can see this file, you're in our trusted circle. Thank you for helping us build something great.

First off, some terminology:

1. **Zipper** is the name of the company and the product
2. **Zipper Functions** is the name of the repo. We've pivoted the company and already had a repo named Zipper.
3. **Applets** are the things people create on Zipper - they have a URL, inputs, and outputs. They are made up of multiple files. Files have functions.
4. **Internal tools** refers to software that's written and used within a company to automate processes, share information, or codify some part of their culture.

Also, here is [Zipper's Product Manual](https://www.notion.so/zipper-inc/Documentation-f1c584a926c74fbfa70850f2a461c7d4#ef8d434a16844e18bf25d8704ac60413).

## Motivation

We want to empower people to write simple, creative software that makes their work lives better. We're doing this by removing a lot of the cruft around writing and deploying modern software (frontend frameworks, complex integrations, and authz/authn) so that people can focus on the problem they want to solve.

## Architecture

### Stack

- Database: Postgres accessed via Prisma
- KV store: Redis
- Frontend/Backend: Next.js
- Backend APIs: tRPC
- Monorepo: Turbo
- Auth: Clerk.dev
- UI components: Chakra
- Testing: Jest
- Code runner: Deno subhosting (SaaS service)

### Diagram

<img width="1370" alt="zipper-infra-diagram" src="https://github.com/Zipper-Inc/zipper-functions/assets/1039639/c8d6899e-de27-47ab-b6e4-efe6a3e79be0">

## What's inside?

This turborepo uses [Yarn](https://classic.bun runpkg.com/) as a package manager. It includes the following packages/apps:

### Apps and Packages

- `zipper.dev`: a [Next.js](https://nextjs.org/) app where users can log in, browse apps, create apps, and write code
- `zipper.run`: a [Next.js](https://nextjs.org/) app that communicates with Deno Subhosting to start an app, gets the results, and provides different ways to view the output. It also handles routing to the public facing URLs for apps (app-slug.zipper.run)
- `@zipper/ui`: a React component library shared by both `zipper.dev` and `zipper.run` applications
- `@zipper/types`: a library of typescript types that are shared by both `zipper.dev` and `zipper.run`
- `@zipper/utils`: common utilities that are shared across both apps

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

### Utilities

This turborepo has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting

### Tests?

Have we made some money yet? If not, it's probably not worth it unless:

- they're being used to validate that something really critical is working (think authz and authn)
- documenting complex and brittle code that we know is hacky and likely to break

Tests should live in the same folder as the code that's being tested.

# Getting started

1. Make sure you have the following installed:

- [Docker](https://docs.docker.com/engine/install/)
- [Node](https://nodejs.org/en/download) (download here or use `nvm`, we're using v18.x LTS)
- [Ngrok](https://ngrok.com/download)
- [Deno](https://deno.com/manual@v1.34.1/getting_started/installation)

2. Clone this repo

```
git clone https://github.com/Zipper-Inc/zipper-functions
```

3. Start ngrok - chat to Sachin or Ibu to get you access to ngrok

```
ngrok http 3000 --domain [yourname].zipper.ngrok.app
```

4. Copy `.env.example` to `.env.local`

```
cp .env.example .env.local
```

5. Fill in the top two missing variables in `.env.local`

```
# Your local ngrok tunnel address
ZIPPER_ENV_LOCAL_NGROK_URL=https://{yourname}.zipper.ngrok.app
# Get this access token from https://zipper.dev/zipper-inc/zipper-env-local
ZIPPER_ENV_LOCAL_ACCESS_TOKEN=
```

6. Start the databases using Docker Compose

```
docker-compose up
```

7. Run `bun run get-started` to install dependencies, set up the env files, and get your database migrated and seeded

```
bun run get-started
```

8. Run `bun run dev` to start development

If you hit any problems, let us know in #engineering
