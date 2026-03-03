import eslintConfig from "@packages/eslint-config";
import { defineConfig } from "eslint/config";

export default defineConfig([
  ...eslintConfig,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
        allowDefaultProject: ["public/*.js"]
      }
    },
    rules: {
      // "@typescript-eslint/no-unused-vars": "error", // 这种是插件中的规则，不能覆盖
      // 这里的配置可以覆盖公共包的配置--但是只能覆盖非插件中的规则
      // "no-unused-vars": "warn"
    }
  }
]);
