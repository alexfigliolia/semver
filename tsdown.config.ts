import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  dts: true,
  shims: true,
  clean: true,
  unbundle: true,
  tsconfig: "./tsconfig.json",
});
