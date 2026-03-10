import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier";

const eslintConfig = defineConfig([
  // ─── Base configs ──────────────────────────────────────────────────────
  ...nextVitals,
  ...nextTs,

  // ─── Custom rules ──────────────────────────────────────────────────────
  {
    rules: {
      // TypeScript
      "@typescript-eslint/no-explicit-any": "warn",          // warn, not error (kode lama pakai any)
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" } // prefix _ = sengaja tidak dipakai
      ],
      "@typescript-eslint/no-require-imports": "warn",

      // React / Next
      "react/display-name": "off",                           // komponen arrow tidak perlu displayName
      "react-hooks/exhaustive-deps": "warn",                 // ingatkan deps yang kurang, bukan error
      "react-hooks/rules-of-hooks": "error",                 // hook order HARUS benar
      "react-hooks/set-state-in-effect": "off",              // false positive: anti-hydration pattern (setMounted)

      // Import
      "import/no-anonymous-default-export": "warn",

      // General
      "no-console": ["warn", { allow: ["warn", "error"] }],  // console.log dilarang, warn/error ok
      "prefer-const": "error",
      "no-var": "error",
      "eqeqeq": ["warn", "always", { null: "ignore" }],
    }
  },

  // ─── Prettier (harus paling akhir agar override semua formatting rules) ─
  prettierConfig,

  // ─── Ignores ───────────────────────────────────────────────────────────
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    "node_modules/**",
    "next-env.d.ts",
    "*.tsbuildinfo",
    "prisma/migrations/**",
  ]),
]);

export default eslintConfig;
