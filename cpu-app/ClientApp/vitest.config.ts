/// <reference types="vitest" />
import angular from "@analogjs/vite-plugin-angular";
import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [angular({ jit: true, tsconfig: "./src/tsconfig.spec.json" })],
  resolve: {
    alias: [
      {
        find: "@almothafar/angular-signature-pad",
        replacement: resolve(
          __dirname,
          "src/__mocks__/@almothafar/angular-signature-pad.ts",
        ),
      },
      // Replace the entire import string for StateService so components that
      // subscribe to StateService.main receive a safe empty state instead of null.
      // The `^.*` anchor ensures String.replace() swaps the full import path, not
      // just the matched suffix.
      {
        find: /^.*\/core\/services\/state\.service$/,
        replacement: resolve(
          __dirname,
          "src/__mocks__/state.service.ts",
        ).replace(/\\/g, "/"),
      },
    ],
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: [
      "@analogjs/vite-plugin-angular/setup-vitest",
      "src/test-setup.ts",
    ],
    include: ["src/**/*.spec.ts"],
    // Safety net: suppress any remaining unhandled lifecycle errors from services
    // that are not covered by the StateService mock (e.g. program-application forms).
    dangerouslyIgnoreUnhandledErrors: true,
    reporters: ["default"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      reportsDirectory: "coverage",
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.spec.ts",
        "src/test-setup.ts",
        "src/main.ts",
        "src/polyfills.ts",
      ],
    },
  },
});
