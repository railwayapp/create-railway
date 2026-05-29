import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const DEFAULT_TEMPLATE = "sandbox";

/**
 * Templates live at `<pkg>/templates`. This file runs from `<pkg>/dist` (built) or
 * `<pkg>/src` (tsx) — both one level below the package root, so `../templates` resolves in both.
 */
const templatesRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "templates");

export interface Template {
  name: string;
  dir: string;
  title: string;
  description: string;
  env: string[];
  nextSteps: string[];
  symlinks: Record<string, string>;
}

interface TemplateManifest {
  title?: string;
  description?: string;
  env?: string[];
  nextSteps?: string[];
  symlinks?: Record<string, string>;
}

export function listTemplates(): Template[] {
  return readdirSync(templatesRoot)
    .filter((name) => statSync(join(templatesRoot, name)).isDirectory())
    .map((name) => {
      const dir = join(templatesRoot, name);
      const manifest = readManifest(dir);
      return {
        name,
        dir,
        title: manifest.title ?? name,
        description: manifest.description ?? "",
        env: manifest.env ?? [],
        nextSteps: manifest.nextSteps ?? [],
        symlinks: manifest.symlinks ?? {},
      };
    });
}

export function findTemplate(name: string): Template | undefined {
  return listTemplates().find((t) => t.name === name);
}

function readManifest(dir: string): TemplateManifest {
  return JSON.parse(readFileSync(join(dir, "template.json"), "utf8")) as TemplateManifest;
}
