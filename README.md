# create-railway

Scaffold a new [Railway](https://railway.com) project in seconds.

[![npm version](https://img.shields.io/npm/v/create-railway.svg)](https://www.npmjs.com/package/create-railway)
[![license](https://img.shields.io/npm/l/create-railway.svg)](./LICENSE)

```bash
bun create railway --sandbox
# or
npm create railway -- --sandbox
pnpm create railway --sandbox
yarn create railway --sandbox
```

This downloads `create-railway` and scaffolds a ready-to-run project. The `sandbox` template is
the default, so `bun create railway` (no flag) scaffolds it too.

## Usage

```
create-railway [template] [dir] [options]

Templates:
  sandbox            Ephemeral compute: create, exec, destroy   (default)

Options:
  --<template>       Select a template by name (e.g. --sandbox)
  --yes              Scaffold into a non-empty directory
  --help             Show this help

Examples:
  create-railway --sandbox my-app
  create-railway sandbox my-app
  create-railway                     # → ./railway-sandbox
```

## What you get

A minimal project wired to the [`railway`](https://www.npmjs.com/package/railway) SDK:

- `index.ts` — a sandbox quickstart (`create` → `exec` → auto-destroy)
- `.env.example` — the credentials to fill in
- `AGENTS.md` (+ `CLAUDE.md` symlink) — an API cheat sheet for coding agents

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
