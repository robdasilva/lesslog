module.exports = {
  env: {
    es6: true,
    jest: true,
    node: true
  },
  extends: [
    "eslint:recommended",
    "plugin:jest/all",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
    "prettier/@typescript-eslint"
  ],
  overrides: [
    {
      files: ["**/*.js"],
      rules: {
        "@typescript-eslint/no-var-requires": "off"
      }
    }
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "jest", "prettier"],
  rules: {
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/interface-name-prefix": [
      "error",
      { prefixWithI: "always" }
    ],
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    camelcase: "error",
    curly: "error",
    eqeqeq: "error",
    "func-style": ["error", "declaration", { allowArrowFunctions: true }],
    "jest/lowercase-name": ["off", { ignore: ["describe"] }],
    "jest/no-expect-resolves": "off",
    "jest/no-hooks": "off",
    "jest/prefer-expect-assertions": "off",
    "new-cap": "error",
    "no-shadow": "error",
    "prefer-arrow-callback": "error",
    "prefer-const": "error",
    "sort-keys": "error",
    "spaced-comment": "error"
  }
};
