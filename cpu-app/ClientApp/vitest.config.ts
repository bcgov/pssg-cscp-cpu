/// <reference types="vitest" />
import angular from "@analogjs/vite-plugin-angular";
import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [angular({ jit: true, tsconfig: "./src/tsconfig.spec.json" })],
  resolve: {
    alias: {
      "@almothafar/angular-signature-pad": resolve(
        __dirname,
        "src/__mocks__/@almothafar/angular-signature-pad.ts",
      ),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: [
      "@analogjs/vite-plugin-angular/setup-vitest",
      "src/test-setup.ts",
    ],
    include: ["src/**/*.spec.ts"],
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
