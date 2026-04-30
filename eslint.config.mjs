/**
 * BEGINNER NOTES
 * File: eslint.config.mjs
 * Purpose: ESLint configuration for code quality checks.
 * Data sources: Next.js ESLint presets from `eslint-config-next`.
 * Why this exists: Lets `npm run lint` catch common React/Next.js mistakes.
 */

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Compose Next.js recommended rules with this project's ignore list.
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

// Exported config is consumed by the `eslint` command.
export default eslintConfig;
