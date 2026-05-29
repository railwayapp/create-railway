import {
  copyFileSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

import type { Template } from "./registry.ts";

/** Template files shipped under safe names; emitted under their real names. */
const RENAME: Record<string, string> = {
  "_package.json": "package.json",
  "_gitignore": ".gitignore",
  "_env.example": ".env.example",
};

/** Not part of the scaffolded output — read by the registry only. */
const SKIP = new Set(["template.json"]);

export function scaffold({
  template,
  targetDir,
  projectName,
}: {
  template: Template;
  targetDir: string;
  projectName: string;
}): void {
  mkdirSync(targetDir, { recursive: true });
  copyDir({ from: template.dir, to: targetDir, projectName });

  for (const [linkPath, target] of Object.entries(template.symlinks)) {
    createSymlink({ dir: targetDir, linkPath, target });
  }
}

function copyDir({
  from,
  to,
  projectName,
}: {
  from: string;
  to: string;
  projectName: string;
}): void {
  for (const entry of readdirSync(from)) {
    if (SKIP.has(entry)) continue;

    const src = join(from, entry);
    const dest = join(to, RENAME[entry] ?? entry);

    if (statSync(src).isDirectory()) {
      mkdirSync(dest, { recursive: true });
      copyDir({ from: src, to: dest, projectName });
      continue;
    }

    const content = readFileSync(src, "utf8").replaceAll("{{projectName}}", projectName);
    writeFileSync(dest, content);
  }
}

/**
 * Create a relative symlink (e.g. CLAUDE.md → AGENTS.md). On platforms where symlinks are
 * unprivileged (notably Windows), fall back to copying so the file always exists.
 */
function createSymlink({
  dir,
  linkPath,
  target,
}: {
  dir: string;
  linkPath: string;
  target: string;
}): void {
  try {
    symlinkSync(target, join(dir, linkPath));
  } catch {
    copyFileSync(join(dir, target), join(dir, linkPath));
  }
}
