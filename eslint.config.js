// @ts-check

import eslint from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import * as eslintPluginImport from "eslint-plugin-import";
import eslintJsxA11y from "eslint-plugin-jsx-a11y";
import eslintPluginReact from "eslint-plugin-react";
import * as eslintPluginReactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

const dirname = import.meta.dirname;

export default tseslint.config(
  eslint.configs.recommended,
  eslintPluginImport.flatConfigs?.recommended,
  // @ts-ignore
  eslintPluginImport.flatConfigs?.typescript,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: dirname,
        projectService: true,
      },
    },
  },
  {
    files: ["**/*.js"],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    rules: {
      "@typescript-eslint/prefer-promise-reject-errors": ["off"],
      "@typescript-eslint/require-await": ["off"],
      "@typescript-eslint/no-explicit-any": ["off"],
      "@typescript-eslint/no-empty-function": ["off"],
      "@typescript-eslint/consistent-type-definitions": ["off"],
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        {
          allowNumber: true,
          allowBoolean: true,
          allowNullish: true,
          allowArray: true,
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  {
    settings: {
      "import/resolver": {
        typescript: {},
      },
    },
    rules: {
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            // src/repositories/ 以外から src/generated/sqlc/ 以下を呼べないように
            {
              target: "./src/!(repositories)/**", /** import文を書く場所 */
              from: "./src/generated/sqlc/**", /** importされるもの */
            },
          ],
        },
      ],
    },
  },
  {
    ignores: ["./eslint.config.js", "node_modules/*"],
  },
  {
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: dirname,
        EXPERIMENTAL_useProjectService: true,
        sourceType: "module",
        ecmaVersion: "latest",
      },
    },
  },
  {
    "settings": {
      "react": {
        "version": "detect",
      },
    },
  },
  eslintPluginReact.configs.flat.recommended,
  eslintPluginReact.configs.flat["jsx-runtime"],
  eslintJsxA11y.flatConfigs.recommended,
  eslintPluginReactHooks.configs["recommended-latest"],
  {
    files: ["**/*.{js,jsx,mjs,cjs,ts,tsx}"],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      "react/prop-types": "off",
    },
  },
  {
    files: ["src/**/*.{js,jsx,mjs,cjs,ts,tsx}"],
    rules: {
      "no-console": "error",
    },
  },
  // NOTE: test関連のコード
  {
    files: ["__tests__/**/*.ts", "__tests__/**/*.tsx"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off", // expect.anyやexpect.anythingなどを利用するため
    },
  },
  {
    files: ["**/*.{js,jsx,mjs,cjs,ts,tsx}"],
    ignores: ["**/src/config.ts"],
    rules: {
      "no-process-env": "error",
    },
  },
  {
    ignores: [
      "./eslint.config.js",
      "next.config.mjs",
      "dist/*",
    ],
  },
  eslintConfigPrettier,
);
