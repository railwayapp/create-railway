# {{projectName}}

A [Railway sandbox](https://railway.com) quickstart — ephemeral compute via the `railway` SDK.

## Getting started

```bash
{{pm}} install
cp .env.example .env   # then fill in RAILWAY_TOKEN + RAILWAY_ENVIRONMENT_ID
{{pm}} start
```

`{{pm}} start` runs `index.ts`: it creates a sandbox, runs a command in it, and tears it down
automatically.

## Credentials

| Variable                 | Where to get it                                                                 |
| ------------------------ | ------------------------------------------------------------------------------- |
| `RAILWAY_TOKEN`          | Project token (recommended). Account tokens work as `RAILWAY_API_TOKEN` instead. |
| `RAILWAY_ENVIRONMENT_ID` | Railway project → Settings → copy the environment ID                            |

Create tokens at https://railway.com/account/tokens (account) or the project's Settings → Tokens.

## Learn more

- SDK docs: https://github.com/railwayapp/railway-ts-sdk#readme
- `AGENTS.md` has an API cheat sheet (also symlinked as `CLAUDE.md` for coding agents).
