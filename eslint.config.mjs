import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Allow unused variables that start with underscore
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
          "caughtErrorsIgnorePattern": "^_"
        }
      ]
    }
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Test files and utilities (non-production code):
    "**/*.test.ts",
    "**/*.test.tsx",
    "test-*.ts",
    "crawl-*.ts",
    "trigger-*.ts",
    "run-*.ts",
    "*-crawler*.ts",
    "check-*.ts",
    "count-*.ts",
    "update-*.ts",
    "fix-*.ts",
    "seed-*.ts",
    "enable-*.ts",
    "verify-*.ts",
    "sample-*.ts",
    "batch-*.ts",
    "improved-extraction.ts",
    // Maintenance scripts directory:
    "scripts/maintenance/**",
    "scripts/master-crawler.ts",
    "scripts/robust-crawler.ts",
    // Supabase functions (deployed separately):
    "supabase/functions/**",
  ]),
]);

export default eslintConfig;
