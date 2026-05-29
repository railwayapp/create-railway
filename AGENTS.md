# Agent Instructions

`create-railway` — the scaffolder behind `bun create railway` (and the npm/pnpm/yarn
equivalents). It writes a ready-to-run Railway project from a template; it does **not** import
the `railway` SDK, only references the published package inside template files.

## Commands

Use mise tasks, not direct package scripts:

- `mise run install` — install dependencies
- `mise run build` — bundle the CLI with tsup → `dist/index.js`
- `mise run check` — typecheck + test + build (run before handing off)
- `mise run test` — offline unit tests (vitest)
- `mise run smoke` — build, then run the **built** CLI into a temp dir and assert the output
- `mise run package-check` — publint + `npm pack --dry-run`

## How resolution works

`bun create railway --sandbox` downloads the npm package `create-railway` and runs its `bin`,
forwarding extra args. `npm/pnpm/yarn create railway` resolve the same package. `sandbox` is the
default template, so a bare `create railway` scaffolds it too.

## Architecture

- `src/index.ts` — flags-only CLI (`node:util` parseArgs, no prompt libs). Resolves the template
  (a `--<name>` flag → a positional name → default `sandbox`), picks the target dir, guards
  non-empty dirs (`--yes` overrides), scaffolds, prints next steps + auth help.
- `src/registry.ts` — discovers `templates/*/template.json`. The folder name **is** the template
  name. This is the extensibility seam.
- `src/scaffold.ts` — copies a template dir, applies the rename map, token-replaces
  `{{projectName}}`, and creates manifest-declared symlinks.

## Templates

Each template is a directory under `templates/<name>/` with a `template.json` manifest
(`title`, `description`, `env[]`, `nextSteps[]`, `symlinks{}`). Conventions:

- Files are shipped under safe names and renamed on scaffold: `_package.json` → `package.json`,
  `_gitignore` → `.gitignore`, `_env.example` → `.env.example`. (npm strips a real `.gitignore`
  and mis-treats a nested `package.json` on publish — hence the `_` prefix.)
- `template.json` is read by the registry and **not** emitted.
- `{{projectName}}` (the target dir basename) is replaced in every text file.
- `symlinks` entries become relative symlinks in the output (e.g. `CLAUDE.md` → `AGENTS.md`),
  with a copy fallback on platforms without symlink permission.

**Adding a template:** drop a new `templates/<name>/` dir with a `template.json`. No CLI changes —
the registry discovers it.

## Conventions

- Zero runtime dependencies — the CLI uses only `node:*`. Keep it that way.
- Tests stay offline; never call Railway.
- Templates reference the **published** `railway` package by version (e.g. `^3.0.0`); bump
  manually on SDK majors. `create-railway` versions independently of the SDK.
- pnpm 11 gates esbuild's build script — approved via `allowBuilds` in `pnpm-workspace.yaml`.

## Release

Tag-driven, single package (mirrors the SDK repo):

- Push a `vX.Y.Z` tag → `release.yml` builds a changelog, drafts a GitHub release, runs
  check/smoke/package-check, and `npm publish`es via npm Trusted Publisher (OIDC).
- `create-release.yml` is the manual `workflow_dispatch` that bumps the version, tags, and pushes.
