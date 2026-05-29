import { existsSync, readdirSync } from "node:fs";
import { basename, resolve } from "node:path";
import { parseArgs } from "node:util";

import { c } from "./colors.ts";
import { DEFAULT_TEMPLATE, findTemplate, listTemplates, type Template } from "./registry.ts";
import { scaffold } from "./scaffold.ts";

function main(argv: string[]): void {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    strict: false,
    options: {
      yes: { type: "boolean", short: "y" },
      help: { type: "boolean", short: "h" },
    },
  });

  if (values.help) {
    printHelp();
    return;
  }

  const templates = listTemplates();
  const { template, rest } = resolveTemplate({ values, positionals, templates });

  const targetDir = resolve(rest[0] ?? `railway-${template.name}`);
  const projectName = basename(targetDir);

  if (!values.yes && existsSync(targetDir) && readdirSync(targetDir).length > 0) {
    fail(`Directory ${targetDir} is not empty. Pass --yes to scaffold into it anyway.`);
  }

  scaffold({ template, targetDir, projectName });
  printNextSteps({ template, targetDir, projectName });
}

function resolveTemplate({
  values,
  positionals,
  templates,
}: {
  values: Record<string, unknown>;
  positionals: string[];
  templates: Template[];
}): { template: Template; rest: string[] } {
  // 1. a --<name> flag matching a known template (e.g. --sandbox)
  const byFlag = templates.find((t) => values[t.name] === true);
  if (byFlag) return { template: byFlag, rest: positionals };

  // 2. first positional matching a known template name
  const byPositional = positionals[0] ? findTemplate(positionals[0]) : undefined;
  if (byPositional) return { template: byPositional, rest: positionals.slice(1) };

  // 3. default
  const fallback = findTemplate(DEFAULT_TEMPLATE);
  if (!fallback) fail(`Default template "${DEFAULT_TEMPLATE}" not found.`);
  return { template: fallback, rest: positionals };
}

function printNextSteps({
  template,
  targetDir,
  projectName,
}: {
  template: Template;
  targetDir: string;
  projectName: string;
}): void {
  const rel = relativeDir(targetDir);

  console.log(
    `\n${c.green("✓")} Created ${c.bold(projectName)} ${c.dim(`(${template.title})`)} in ${c.cyan(rel)}\n`,
  );
  console.log(c.bold("Next steps:"));
  console.log(`  ${c.cyan(`cd ${rel}`)}`);
  for (const step of template.nextSteps) console.log(`  ${colorizeStep(step)}`);

  if (template.env.length > 0) {
    console.log(`\n${c.bold("Credentials")} ${c.dim("(.env)")}`);
    for (const name of template.env) console.log(`  ${c.yellow(name)}`);
    console.log(
      `\n  ${c.dim("API token:")}      ${c.cyan(c.underline("https://railway.com/account/tokens"))}`,
    );
    console.log(
      `  ${c.dim("Environment ID:")} ${c.dim("Railway project → Settings → copy the environment ID")}`,
    );
  }
  console.log();
}

function relativeDir(targetDir: string): string {
  return targetDir === process.cwd() ? "." : basename(targetDir);
}

/** Color a shell step: command in cyan, trailing `# comment` dimmed. */
function colorizeStep(step: string): string {
  const hash = step.indexOf("#");
  if (hash === -1) return c.cyan(step);
  return c.cyan(step.slice(0, hash).trimEnd()) + " " + c.dim(step.slice(hash));
}

function printHelp(): void {
  const templates = listTemplates();
  console.log(c.bold("Scaffold a new Railway project.\n"));
  console.log(`${c.dim("Usage:")} create-railway ${c.cyan("[template]")} ${c.cyan("[dir]")} [options]\n`);
  console.log(c.bold("Templates:"));
  for (const t of templates) {
    const def = t.name === DEFAULT_TEMPLATE ? c.dim("  (default)") : "";
    console.log(`  ${c.yellow(t.name.padEnd(16))}${t.description}${def}`);
  }
  console.log(`\n${c.bold("Options:")}`);
  console.log(`  ${c.cyan("--<template>")}        Select a template by name (e.g. --sandbox)`);
  console.log(`  ${c.cyan("--yes, -y")}           Scaffold into a non-empty directory`);
  console.log(`  ${c.cyan("--help, -h")}          Show this help`);
}

function fail(message: string): never {
  console.error(`${c.red("error:")} ${message}`);
  process.exit(1);
}

main(process.argv.slice(2));
