# create-railway

Scaffold a TypeScript project that uses the [`railway`](https://www.npmjs.com/package/railway) SDK.

[![npm version](https://img.shields.io/npm/v/create-railway.svg)](https://www.npmjs.com/package/create-railway)
[![license](https://img.shields.io/npm/l/create-railway.svg)](./LICENSE)

```bash
npm create railway@latest
# or
bun create railway
pnpm create railway
yarn create railway
```

This downloads `create-railway` and scaffolds a ready-to-run TypeScript project wired to the
`railway` SDK — local code that talks to Railway, set up for you. It defaults to the **sandbox**
template, so the command above needs no flags; pass `--sandbox` to be explicit.

## Usage

```
create-railway [template] [dir] [options]

Templates:
  sandbox            A TypeScript app on the Railway SDK: create, exec, destroy a sandbox   (default)

Options:
  --<template>       Select a template by name (e.g. --sandbox)
  --yes              Scaffold into a non-empty directory
  --help             Show this help

Examples:
  create-railway                     # default sandbox template → ./railway-sandbox
  create-railway my-app              # sandbox template → ./my-app
  create-railway --sandbox my-app    # select the template explicitly
```

## What you get

A minimal TypeScript project wired to the [`railway`](https://www.npmjs.com/package/railway) SDK:

- `index.ts` — a sandbox quickstart (`create` → `exec` → auto-destroy)
- `.env.example` — the credentials to fill in
- `AGENTS.md` (+ `CLAUDE.md` symlink) — an API cheat sheet for coding agents

Then:

```bash
cd railway-sandbox
pnpm install
cp .env.example .env   # then fill in your credentials
pnpm start
```

## Adding a template

Drop a new directory under `templates/<name>/` with a `template.json` manifest. The CLI
discovers it automatically — no code changes.

## Development

```bash
mise run install
mise run check         # typecheck + test + build
mise run smoke         # scaffold into a temp dir and assert output
mise run package-check # validate the packed npm tarball
```
