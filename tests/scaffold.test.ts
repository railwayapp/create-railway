import { lstatSync, mkdtempSync, readFileSync, readlinkSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { detectPackageManager } from "../src/pm.ts";
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

  function run(projectName = "my-app", pm = "pnpm") {
    const template = findTemplate("sandbox")!;
    scaffold({ template, targetDir: dir, projectName, pm });
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

  it("replaces {{pm}} tokens in docs", () => {
    run("acme", "bun");
    for (const f of ["README.md", "AGENTS.md"]) {
      const content = readFileSync(join(dir, f), "utf8");
      expect(content).toContain("bun install");
      expect(content).toContain("bun start");
      expect(content).not.toContain("{{pm}}");
      expect(content).not.toContain("pnpm");
    }
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

describe("detectPackageManager", () => {
  const original = process.env.npm_config_user_agent;

  afterEach(() => {
    if (original === undefined) delete process.env.npm_config_user_agent;
    else process.env.npm_config_user_agent = original;
  });

  function detectWith(ua: string | undefined): string {
    if (ua === undefined) delete process.env.npm_config_user_agent;
    else process.env.npm_config_user_agent = ua;
    return detectPackageManager();
  }

  it("reads the leading token from npm_config_user_agent", () => {
    expect(detectWith("pnpm/8.15.0 npm/? node/v22.0.0 darwin arm64")).toBe("pnpm");
    expect(detectWith("bun/1.1.0 npm/? node/v22.0.0")).toBe("bun");
    expect(detectWith("yarn/1.22.22 npm/? node/v22.0.0")).toBe("yarn");
    expect(detectWith("npm/10.5.0 node/v22.0.0 darwin arm64")).toBe("npm");
  });

  it("defaults to npm for unset or unknown agents", () => {
    expect(detectWith(undefined)).toBe("npm");
    expect(detectWith("")).toBe("npm");
    expect(detectWith("deno/1.0.0")).toBe("npm");
  });
});
