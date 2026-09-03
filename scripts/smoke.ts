import { execFileSync } from "node:child_process";
import { lstatSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Exercises the BUILT CLI (dist/index.js) end-to-end so we catch path-resolution and packaging
// issues the unit tests (which import src) can miss. Offline — no Railway calls.

const root = mkdtempSync(join(tmpdir(), "create-railway-smoke-"));
const appDir = join(root, "app");

try {
  execFileSync("node", ["dist/index.js", "--sandbox", appDir, "--yes"], { stdio: "inherit" });

  const expected = ["package.json", ".gitignore", ".env.example", "index.ts", "AGENTS.md", "README.md"];
  for (const f of expected) {
    if (!lstatSync(join(appDir, f)).isFile()) throw new Error(`missing ${f}`);
  }

  for (const f of ["_package.json", "_gitignore", "template.json"]) {
    let present = true;
    try {
      lstatSync(join(appDir, f));
    } catch {
      present = false;
    }
    if (present) throw new Error(`unexpected source-only file emitted: ${f}`);
  }

  const claude = lstatSync(join(appDir, "CLAUDE.md"));
  if (!claude.isSymbolicLink() && !claude.isFile()) throw new Error("CLAUDE.md missing");

  const pkg = JSON.parse(readFileSync(join(appDir, "package.json"), "utf8"));
  if (pkg.name !== "app") throw new Error(`projectName not applied: ${pkg.name}`);
  if (pkg.dependencies?.railway !== "^3.11.0") {
    throw new Error(`unexpected railway version: ${pkg.dependencies?.railway}`);
  }

  console.log("\nsmoke: OK");
} finally {
  rmSync(root, { recursive: true, force: true });
}
