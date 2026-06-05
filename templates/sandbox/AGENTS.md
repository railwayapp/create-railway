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

// Sandbox.create(opts)   — { env, networkIsolation, idleTimeoutMinutes }
// Sandbox.create(tmpl)   — boot from a Sandbox.template() base
// Sandbox.create(source) — fork an existing sandbox (static form of .fork())
// Sandbox.connect(id)    — reattach to an existing sandbox
// Sandbox.list()         — list sandboxes in the environment
// sandbox.fork()         — clone this sandbox's filesystem into a new one
// sandbox.refresh()      — re-read status/fields
// sandbox.destroy()      — manual cleanup (prefer `await using`)
```

### Streaming & durable commands

```ts
// exec returns a handle that resolves to ExecResult; stream output live.
const handle = sandbox.exec("npm run test:slow", {
  onStdout: (chunk) => process.stdout.write(chunk),
  timeoutSec: 120,
});

// Durable: detach and reattach by sessionName — even from another process.
const sessionName = await handle.sessionName;
await handle.detach();                 // stop streaming; command keeps running
const sb = await Sandbox.connect(sandbox.id);
const result = await sb.exec({ sessionName }, {
  onStdout: (chunk) => process.stdout.write(chunk), // resumeFromLastRead: true → only new output
});
// handle.kill(signal?) — defaults to "TERM"
```

### Templates

```ts
const base = Sandbox.template()
  .withPackages("ffmpeg")    // install Debian packages
  .withEnv({ KEY: "value" }) // build-time env
  .workdir("/app")
  .run("echo build step");
await using sandbox = await Sandbox.create(base); // base.build() pre-warms the cache
```

## Notes

- `exec` returns `{ exitCode, stdout, stderr, truncated, timedOut }` — check `exitCode`; a
  non-zero exit does not throw, and `exitCode` is `null` when killed or timed out.
- Prefer `await using` over a manual `destroy()` so the sandbox is always cleaned up.
- `Sandbox.create({ networkIsolation: "PRIVATE" })` joins the environment private network
  (default `"ISOLATED"` = public egress only). `env` sets runtime vars; `idleTimeoutMinutes`
  overrides the idle shutdown.
- `fork` clones the filesystem (not live processes) into a fresh sandbox in the same
  environment; the source must be `RUNNING`. `Sandbox.create(source)` is the static form.
- Errors extend `RailwayError`: `RailwayAuthError`, `SandboxNotFoundError`,
  `SandboxFailedError`, `SandboxTimeoutError`, `SandboxTemplateBuildError`.

Docs: https://github.com/railwayapp/railway-ts-sdk#readme
