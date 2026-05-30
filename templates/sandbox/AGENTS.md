# {{projectName}} — Railway Sandbox

Ephemeral compute via the [`railway`](https://www.npmjs.com/package/railway) SDK.

## Setup

Set `RAILWAY_API_TOKEN` and `RAILWAY_ENVIRONMENT_ID` in `.env` (see `.env.example`), then:

```bash
{{pm}} install
{{pm}} start
```

## API cheat sheet

```ts
import { Sandbox } from "railway";

await using sandbox = await Sandbox.create();          // auto-destroyed on scope exit
const { stdout, exitCode } = await sandbox.exec("ls"); // non-zero exit is NOT a throw

// Sandbox.connect(id)  — reattach to an existing sandbox
// Sandbox.list()       — list sandboxes in the environment
// sandbox.refresh()    — re-read status/fields
// sandbox.destroy()    — manual cleanup (prefer `await using`)
```

## Notes

- `exec` returns `{ exitCode, stdout, stderr, truncated, timedOut }` — check `exitCode`; a
  non-zero exit does not throw.
- Prefer `await using` over a manual `destroy()` so the sandbox is always cleaned up.
- Templates: `Sandbox.template().withPackages("ffmpeg").withEnv({ ... }).build()`.

Docs: https://github.com/railwayapp/railway-ts-sdk#readme
