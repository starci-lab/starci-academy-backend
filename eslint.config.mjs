import js from "@eslint/js"
import globals from "globals"
import tseslint from "typescript-eslint"
import {
    defineConfig
} from "eslint/config"

export default defineConfig([
    {
        ignores: [
            "**/node_modules/**",
            "**/dist/**",
            ".repo/**",
            "scratch/**",
        ],
    },
    {
        files: ["src/**/*.ts", "apps/**/*.ts", "libs/**/*.ts", "test/**/*.ts", "tests/**/*.ts"],
        plugins: {
            js
        },
        extends: ["js/recommended"],
        languageOptions: {
            globals: globals.node
        }
    },
    ...tseslint.configs.recommended.map((config) => ({
        ...config,
        files: ["src/**/*.ts", "apps/**/*.ts", "libs/**/*.ts", "test/**/*.ts", "tests/**/*.ts"],
    })),
    {
        files: ["src/**/*.ts", "apps/**/*.ts", "libs/**/*.ts", "test/**/*.ts", "tests/**/*.ts"],
        rules: {
            '@typescript-eslint/no-empty-object-type': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            "array-element-newline": ["error",
                "always"],
            "object-curly-newline": [
                "error",
                {
                    "ObjectExpression": "always",
                    "ImportDeclaration": "always",
                }
            ],
            "function-call-argument-newline": ["error",
                "always"],
            indent: ["error",
                4],
            "linebreak-style": "off",
            quotes: ["error",
                "double"],
            semi: ["error",
                "never"],
        },
    },
])