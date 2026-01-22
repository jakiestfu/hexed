import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import turboPlugin from "eslint-plugin-turbo";
import tseslint from "typescript-eslint";
import onlyWarn from "eslint-plugin-only-warn";

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config}
 * */
const config = [
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      "turbo/no-undeclared-env-vars": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_[^_].*$|^_$",
          varsIgnorePattern: "^_[^_].*$|^_$",
          caughtErrorsIgnorePattern: "^_[^_].*$|^_$",
        },
      ],
      // "no-restricted-imports": [
      //   "error",
      //   {
      //     patterns: [
      //       {
      //         group: [
      //           "./use-resolve-handle",
      //           "../use-resolve-handle",
      //           "use-resolve-handle",
      //         ],
      //         message:
      //           "Do not import useResolveHandle directly. Import it from the public hooks entry instead.",
      //       },
      //     ],
      //   },
      // ],
    },
  },
  {
    plugins: {
      onlyWarn,
    },
  },
  {
    ignores: [
      ".turbo/**",
      ".cache/**",
      ".content-collections/**",
      ".next/**",
      "dist/**",
      "node_modules/**",
    ],
  },
];

export default config;
