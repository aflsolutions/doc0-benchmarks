import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["results/", "node_modules/"] },
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
    },
  },
);
