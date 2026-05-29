import { lstatSync, mkdtempSync, readFileSync, readlinkSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { findTemplate, listTemplates } from "../src/registry.ts";
import { scaffold } from "../src/scaffold.ts";

describe("registry", () => {
  it("discovers the sandbox template with its manifest", () => {
    const sandbox = findTemplate("sandbox");
    expect(sandbox).toBeDefined();
    expect(sandbox?.title).toBe("Railway Sandbox");
    expect(sandbox?.env).toContain("RAILWAY_API_TOKEN");
    expect(sandbox?.symlinks).toEqual({ "CLAUDE.md": "AGENTS.md" });
  });

  it("includes sandbox in the template list", () => {
    expect(listTemplates().map((t) => t.name)).toContain("sandbox");
  });
});

describe("scaffold (sandbox)", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "create-railway-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  function run(projectName = "my-app") {
    const template = findTemplate("sandbox")!;
    scaffold({ template, targetDir: dir, projectName });
  }

  it("applies the rename map and omits source-only names", () => {
    run();
    for (const f of ["package.json", ".gitignore", ".env.example", "index.ts", "README.md"]) {
      expect(lstatSync(join(dir, f)).isFile()).toBe(true);
    }
    expect(() => lstatSync(join(dir, "_package.json"))).toThrow();
    expect(() => lstatSync(join(dir, "_gitignore"))).toThrow();
    expect(() => lstatSync(join(dir, "template.json"))).toThrow();
  });

  it("replaces {{projectName}} tokens", () => {
    run("acme");
    const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
    expect(pkg.name).toBe("acme");
    expect(readFileSync(join(dir, "AGENTS.md"), "utf8")).toContain("acme");
  });

  it("creates CLAUDE.md as a symlink to AGENTS.md", () => {
    run();
    const link = lstatSync(join(dir, "CLAUDE.md"));
    if (link.isSymbolicLink()) {
      expect(readlinkSync(join(dir, "CLAUDE.md"))).toBe("AGENTS.md");
    } else {
      // Windows fallback: a copy with identical contents.
      expect(readFileSync(join(dir, "CLAUDE.md"), "utf8")).toBe(
        readFileSync(join(dir, "AGENTS.md"), "utf8"),
      );
    }
  });
});
