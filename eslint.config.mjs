// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config({
 
  files: ['src/**/*.ts', 'test/**/*.ts'],

  extends: [ 
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
  ],
  rules: {
    indent: ["error", 2, {
      SwitchCase: 1,
    }],

    "linebreak-style": ["error", "unix"],

    "no-constant-condition": ["error", {
      checkLoops: false,
    }],

    quotes: ["error", "single", {
      allowTemplateLiterals: false,
      avoidEscape: true,
    }],

    semi: ["error", "always"],

    "no-console": ["error", {
      allow: ["warn", "error", "info", "debug"],
    }],

    "no-trailing-spaces": "error",
    "eol-last": "error",

    "@typescript-eslint/ban-ts-comment": ["error", {
      "ts-expect-error": "allow-with-description",
      "ts-nocheck": "allow-with-description",
    }],

    "@typescript-eslint/ban-tslint-comment": "error",

    "@typescript-eslint/consistent-type-assertions": ["error", {
      assertionStyle: "as",
      objectLiteralTypeAssertions: "never",
    }],

    "@typescript-eslint/no-inferrable-types": "off",
    "@typescript-eslint/no-explicit-any": 0,
    "@typescript-eslint/no-for-in-array": "error",
    "@typescript-eslint/no-invalid-void-type": "error",
    "@typescript-eslint/no-namespace": "error",
    "@typescript-eslint/no-non-null-asserted-optional-chain": "error",

    "@typescript-eslint/no-unused-vars": ["error", {
      ignoreRestSiblings: true,
      args: "none",
    }],

    "@typescript-eslint/prefer-for-of": ["error"],
    "@typescript-eslint/prefer-ts-expect-error": ["error"],
  },
});
