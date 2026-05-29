import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node22",
  sourcemap: true,
  splitting: false,
  treeshake: true,
  banner: { js: "#!/usr/bin/env node" },
});
