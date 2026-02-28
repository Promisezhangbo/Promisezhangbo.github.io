export default {
  tabWidth: 2,
  endOfLine: "auto",
  overrides: [
    {
      files: ["*.json5"],
      options: {
        quoteProps: "preserve",
        singleQuote: true
      }
    }
  ],
  // plugins: ["prettier-plugin-tailwindcss"],
  printWidth: 120,
  proseWrap: "never",
  semi: true,
  singleQuote: true,
  trailingComma: "all"
};
