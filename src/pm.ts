const KNOWN = new Set(["npm", "pnpm", "yarn", "bun"]);

/**
 * The package manager that invoked us, from `npm_config_user_agent` (set by npm/pnpm/yarn/bun
 * when running a `create`/bin package). Defaults to `npm` for direct/unknown invocations.
 */
export function detectPackageManager(): string {
  const name = (process.env.npm_config_user_agent ?? "").split("/")[0] ?? "";
  return KNOWN.has(name) ? name : "npm";
}
