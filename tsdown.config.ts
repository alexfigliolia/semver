import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/CLI.ts"],
  dts: true,
  shims: true,
  clean: true,
  unbundle: true,
  format: ["cjs", "esm", "module"],
  tsconfig: "./tsconfig.json",
});
