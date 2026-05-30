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

## Templates

Build an environment once, then create sandboxes from it:

```ts
const base = Sandbox.template()
  .withPackages("jq")          // install Debian packages
  .withEnv({ KEY: "value" });  // env for later steps
// .workdir("/app")            — optional working dir
// .run("cmd")                 — optional raw build step
// .build()                    — optional: pre-warm for caching

await using sandbox = await Sandbox.create(base); // pass the template to create()
await sandbox.exec("jq --version");
```

Everything after `withEnv` is optional — `Sandbox.create(base)` works on an unbuilt template.

Full API & docs: https://github.com/railwayapp/railway-ts-sdk#readme
