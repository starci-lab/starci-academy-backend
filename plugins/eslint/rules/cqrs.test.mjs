import test from "node:test"
import { RuleTester } from "eslint"
import tsParser from "@typescript-eslint/parser"
import {
    handlerOverridesProcess,
    messageCarriesParamsOnly,
} from "./cqrs.mjs"

const tester = new RuleTester({
    languageOptions: {
        parser: tsParser,
        ecmaVersion: 2022,
        sourceType: "module",
        parserOptions: { legacyDecorators: true },
    },
})

test("CQRS handlers preserve the shared template",
    () => tester.run("handler-overrides-process",
        handlerOverridesProcess,
        {
            valid: [{
                filename: "D:/repo/add-to-cart/add-to-cart.handler.ts",
                code: "@CommandHandler(Add) class Handler extends Base { protected process() {} }",
            }],
            invalid: [{
                filename: "D:/repo/add-to-cart/add-to-cart.handler.ts",
                code: "@CommandHandler(Add) class Handler { execute() {} }",
                errors: [{ messageId: "execute" }],
            }],
        }))

test("CQRS messages carry one params field",
    () => tester.run("message-carries-params-only",
        messageCarriesParamsOnly,
        {
            valid: [{
                filename: "D:/repo/add-to-cart/add-to-cart.command.ts",
                code: "class Add { constructor(readonly params: Params) {} }",
            }],
            invalid: [{
                filename: "D:/repo/add-to-cart/add-to-cart.command.ts",
                code: "class Add { constructor(readonly userId: string) {} calculate() {} }",
                errors: [{ messageId: "shape" }, { messageId: "logic" }],
            }],
        }))
