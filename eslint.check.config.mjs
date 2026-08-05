import tseslint from "typescript-eslint"
import starciBe from "./plugins/eslint/index.mjs"

export default [
    {
        files: ["**/*.ts"],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                sourceType: "module",
            },
        },
        plugins: {
            "starci-be": starciBe,
        },
        rules: {
            "starci-be/no-inline-param-type": "warn",
        },
    },
]
