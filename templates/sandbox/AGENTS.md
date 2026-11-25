# {{projectName}} — Railway Sandbox

Ephemeral compute via the [`railway`](https://www.npmjs.com/package/railway) SDK.

## Setup

Set `RAILWAY_TOKEN` in `.env` (see `.env.example`), then:

```bash
{{pm}} install
{{pm}} start
```

`RAILWAY_TOKEN` is a project token (`authType: "project-token"`); the SDK uses the
token's environment, so `RAILWAY_ENVIRONMENT_ID` is only needed to target a different one.
`RAILWAY_API_TOKEN` is an account/workspace bearer token and always needs
`RAILWAY_ENVIRONMENT_ID`. The SDK tries `RAILWAY_TOKEN` first.

## API cheat sheet

```ts
import { Sandbox } from "railway";

await using sandbox = await Sandbox.create();          // auto-destroyed on scope exit
const { stdout, exitCode } = await sandbox.exec("ls"); // non-zero exit is NOT a throw

// Sandbox.create(opts)   — { env, networkIsolation, idleTimeoutMinutes, region, resources, domains }
// Sandbox.create(tmpl)   — boot from a Sandbox.template() base
// Sandbox.create(source) — fork an existing sandbox (static form of .fork())
// Sandbox.create(name)   — boot from a saved checkpoint (see Checkpoints)
// Sandbox.connect(id)    — reattach to an existing sandbox
// Sandbox.list()         — list sandboxes in the environment
// Sandbox.checkpoints()  — list the environment's checkpoints (newest first)
// Sandbox.renameCheckpoint(id, name) / Sandbox.deleteCheckpoint(id)
// sandbox.fork()         — clone this sandbox's filesystem into a new one
// sandbox.checkpoint(n)  — capture this sandbox's disk as a named checkpoint
// sandbox.files          — read/write the sandbox filesystem (see Files)
// sandbox.execHttp(cmd)  — one HTTPS request; no streaming/stdin, output cut at 16,000 bytes
// sandbox.sessions()     — list shells/exec sessions (null if unsupported)
// sandbox.heartbeat()    — reset the idle countdown
// sandbox.refresh()      — re-read status/fields
// sandbox.destroy()      — manual cleanup (prefer `await using`)
```

### Streaming & durable commands

```ts
// exec returns a handle that resolves to ExecResult; stream output live.
const handle = sandbox.exec("npm run test:slow", {
  onStdout: (chunk) => process.stdout.write(chunk),
  timeoutSec: 120,
  cwd: "/app",                 // fresh execs only
  env: { CI: "true" },         // layered over sandbox env; visible in `ps`
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

### Stdin, cancellation, and ephemeral execs

```ts
const handle = sandbox.exec("cat", { stdin: true, onStdout: (c) => process.stdout.write(c) });
await handle.stdin.write("hello\n"); // await each write for backpressure
await handle.stdin.end();            // EOF; without stdin: true, stdin closes immediately
await handle;

// signal: abort → TERM, KILL after 5s; rejects with the abort reason.
const dev = sandbox.exec("npm run dev", { signal: controller.signal });

// ephemeral: no durable session (no sessionName/detach); killed on disconnect.
await sandbox.exec("git status --short", { ephemeral: true });
```

Output is captured in full by default. For long-running or chatty commands pass
`captureOutput: false` (callbacks still get every chunk) or `maxOutputBytes` (sets
`truncated`). Durable execs keep only ~8 MiB for reattach; use `ephemeral: true` for
large output.

### Files

```ts
await sandbox.files.write("/app/config.json", JSON.stringify(config));
const text = await sandbox.files.read("/app/config.json");             // string
const bytes = await sandbox.files.read("/x.bin", { format: "bytes" }); // Uint8Array
await sandbox.files.write("/app/run.sh", "#!/bin/sh\n...", { mode: 0o755 });

// Streams move files larger than memory; prefer the function form so a retry rereads.
import { createReadStream } from "node:fs";
await sandbox.files.write("/data/dataset.bin", () => createReadStream("./dataset.bin"));
const stream = await sandbox.files.read("/data/out.bin", { format: "stream" });

// Range reads: offset/length from start, or fromEnd for tails.
const tail = await sandbox.files.read("/var/log/app.log", { length: 4096, fromEnd: true });

// files.list(dir) / stat / exists / mkdir (recursive) / rename / remove
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

### Checkpoints

```ts
// Capture a running sandbox's disk; synchronous — bootable as soon as it resolves.
await source.exec("echo data > /etc/marker");
const checkpoint = await source.checkpoint("my-checkpoint");

// Boot fresh sandboxes from it by name, any number of times.
await using clone = await Sandbox.create("my-checkpoint");

// Manage by id (find via Sandbox.checkpoints()).
await Sandbox.deleteCheckpoint(checkpoint.id);
```

### Regions, size, and domains

```ts
await using sandbox = await Sandbox.create({
  region: "us-east4-eqdc4a",
  resources: { cpu: 2, memoryGB: 4 },          // omitted fields use the workspace default
  networkIsolation: "PRIVATE",                 // required for domains
  domains: [{ port: 8080 }, { prefix: "api", port: 3000 }],
});
sandbox.region;  // logical region the platform selected
sandbox.domains; // [{ prefix, port, domain }]
```

Forks, templates, and checkpoints boot in the region their data lives in; requesting
another region is rejected. Domains are create-time only and forks do not inherit them.

## Notes

- `exec` returns `{ exitCode, stdout, stderr, truncated, timedOut }` — check `exitCode`; a
  non-zero exit does not throw. A `timeoutSec` timeout sets `timedOut` with `exitCode: -1`
  (or `null` if no exit is confirmed); `exitCode` is `null` after `detach()`.
- Prefer `await using` over a manual `destroy()` so the sandbox is always cleaned up.
- `Sandbox.create({ networkIsolation: "PRIVATE" })` joins the environment private network
  (default `"ISOLATED"` = public egress only). `env` sets runtime vars; `idleTimeoutMinutes`
  overrides the idle shutdown (`0` = never, on plans that allow it; otherwise call
  `heartbeat()` within the timeout); `region` picks where it runs.
- `fork` clones the filesystem (not live processes) into a fresh sandbox in the same
  environment; the source must be `RUNNING`. `Sandbox.create(source)` is the static form.
- A checkpoint is an immutable disk snapshot; the source must be `RUNNING` to capture, and
  later changes to it don't affect the checkpoint. Boot by name (`key`), rename/delete by
  `id`. Capturing an existing name replaces that checkpoint; renaming to one errors.
- `files` paths are absolute within the sandbox. `write` auto-creates parent dirs (files
  created `0644`; pass `mode` to override). `remove` deletes files and empty dirs only —
  use `exec("rm -rf ...")` for recursive. Reads of missing paths throw
  `SandboxFileNotFoundError`.
- Per-exec `cwd`/`env` apply to fresh execs only (reattach by `sessionName` rejects them).
  Exec `env` values are visible in `ps`; bake secrets in at `Sandbox.create({ env })`.
- Errors extend `RailwayError`: `RailwayAuthError`, `RailwayConnectionError`,
  `RailwayGraphQLError`, `RailwayRateLimitError`, `SandboxNotFoundError`,
  `SandboxFailedError`, `SandboxTimeoutError`, `SandboxTemplateBuildError`,
  `SandboxFilesError`, `SandboxFileNotFoundError`, `ExecInterruptedError`,
  `ExecNotStartedError`.
- `RailwayRateLimitError` means nothing ran and the SDK did not retry; wait
  `.retryAfterMs` (when set) before trying again. `ExecNotStartedError` also means the
  command never ran, so it is safe to retry.

## Also in this SDK

Feature flags and TypeScript IaC ship in the same `railway` package:

```ts
import { flags } from "railway";
await flags.init(); // scope from RAILWAY_TOKEN / RAILWAY_PROJECT_ID
if (flags.getBoolean("checkout-v2", { key: "user-123" })) { /* ... */ }
flags.close();
```

```ts
// .railway/railway.ts
import { defineRailway, github, postgres, project, service } from "railway/iac";

export default defineRailway(() => {
  const db = postgres("db");
  const web = service("web", {
    source: github("acme/web"),
    env: { DATABASE_URL: db.env.DATABASE_URL },
  });
  return project("my-app", { resources: [db, web] });
});
```

Then `railway config plan` / `railway config apply` (CLI 5.42.1+). IaC is experimental.

Docs: https://github.com/railwayapp/railway-ts-sdk#readme
