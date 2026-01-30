import js from "@eslint/js"
import { defineConfig } from "eslint/config"
import importPlugin from "eslint-plugin-import"
import jsdoc from "eslint-plugin-jsdoc"
import react from "eslint-plugin-react"
import globals from "globals"
import tseslint from "typescript-eslint"

export default defineConfig([
  // base JS/TS files
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: { 
      js,
      import: importPlugin, // 👈 ,
      jsdoc,
      react,
      "react-hooks": require("eslint-plugin-react-hooks"),
    },
    extends: ["js/recommended"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },

  // recommended TS config (from typescript-eslint)
  tseslint.configs.recommended,

  // Strict, opinionated ruleset applied across the codebase
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    // rely on previously loaded parsers/plugins (typescript-eslint, etc.)
    rules: {
      // JavaScript hygiene
      eqeqeq: "error",
      curly: ["error", "multi-line"],
      "no-var": "error",
      "prefer-const": ["error", { destructuring: "all" }],
      "no-debugger": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "consistent-return": "error",
      "no-implicit-coercion": "error",

      // complexity / maintainability
      complexity: ["warn", 10],
      "max-params": ["warn", 4],
      "max-depth": ["warn", 4],
      "max-lines": ["warn", { max: 400, skipBlankLines: true, skipComments: true }],

      // import/order (requires eslint-plugin-import)
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index", "type"],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],

      // encourage clear async/await and promise handling
      "no-return-await": "error",
      "require-atomic-updates": "error",

      // jsdoc (requires eslint-plugin-jsdoc) — keep docs enforced
      "jsdoc/check-alignment": "warn",
      "jsdoc/require-jsdoc": [
        "warn",
        {
          require: {
            FunctionDeclaration: true,
            MethodDefinition: true,
            ClassDeclaration: true,
            ArrowFunctionExpression: false,
            FunctionExpression: false,
          },
        },
      ],
      "jsdoc/require-param": "error",
      "jsdoc/require-returns": "error",
    },
    settings: {
      react: { version: "detect" },
      // import resolver for TypeScript projects (if installed)
      "import/parsers": { "@typescript-eslint/parser": [".ts", ".tsx"] },
      "import/resolver": {
        typescript: {
          // Use default tsconfig lookup. Override if monorepo packages have own tsconfigs.
        },
      },
    },
  },

  // React / Next / Hooks specific rules
  {
    files: ["**/*.{jsx,tsx}"],
    rules: {
      "react/prop-types": "off", // TS covers prop types
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
      "react/jsx-boolean-value": ["error", "always"],
      "react/jsx-curly-brace-presence": ["error", { props: "always", children: "never" }],
      "react/jsx-no-useless-fragment": "error",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": ["warn", { additionalHooks: "(useRecoilCallback)" }],
    },
    // ensure react plugin is available in projects using JSX
    // (no explicit plugin import here plugin must be installed)
  },

  // Node-only package override for packages/logic (no browser globals, no React)
  {
    files: ["packages/logic/**/*.{ts,js}"],
    languageOptions: {
      globals: { ...globals.node },
      sourceType: "module",
    },
    rules: {
      // logic package should be pure and side-effect free where possible
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.name='fetch']",
          message: "Avoid fetch in logic package inject HTTP clients from caller.",
        },
      ],
      "import/no-extraneous-dependencies": ["error", { devDependencies: false, optionalDependencies: false }],
      // allow fewer UI-related rules
      "react/no-unknown-property": "off",
    },
  },

  // GraphQL linting placeholder (if @graphql-eslint installed + .graphqlrc present)
  {
    files: ["**/*.graphql", "**/*.gql", "**/*.{ts,tsx,js,jsx}"],
    rules: {
      // keep GraphQL checks opt-in via plugin these are examples you can enable
      // '@graphql-eslint/no-deprecated-fields': 'warn',
      // '@graphql-eslint/known-type-names': 'error',
    },
  },

  // Strictness for commit-time / CI (can be toggled by CI pipeline)
  {
    files: ["**/*.{js,ts,tsx}"],
    // treat some warnings as errors in CI — consumer can override in CI env
    rules: {
      // This is intentionally conservative in local dev CI pipeline can set env to escalate
      "no-warning-comments": ["warn", { terms: ["todo", "fixme", "xxx"], location: "start" }],
    },
  },
])
