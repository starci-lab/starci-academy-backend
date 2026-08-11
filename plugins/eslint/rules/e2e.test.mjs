import test from "node:test"
import { RuleTester } from "eslint"
import tsParser from "@typescript-eslint/parser"
import {
    e2eAssertsPersistedState,
    e2eUsesProductionTransport,
    noBranchInFlowStep,
    noModelCallInE2e,
    noSleepInFlow,
} from "./e2e.mjs"

const tester = new RuleTester({
    languageOptions: {
        parser: tsParser,
        ecmaVersion: 2022,
        sourceType: "module",
    },
})
const E2E = "D:/repo/src/tests/e2e/course-purchase.e2e-spec.ts"
const UNIT = "D:/repo/src/modules/payment/payment.spec.ts"

test("E2E action enters through a production transport", () => {
    tester.run("e2e-uses-production-transport",
        e2eUsesProductionTransport,
        {
            valid: [
                { filename: E2E, code: "await request(app.getHttpServer()).post('/graphql').send({ query })" },
                { filename: E2E, code: "import { CqrsModule } from '@nestjs/cqrs'" },
                { filename: UNIT, code: "await commandBus.execute(command)" },
            ],
            invalid: [
                {
                    filename: E2E,
                    code: "import { CommandBus } from '@nestjs/cqrs'; await commandBus.execute(command)",
                    errors: [
                        { messageId: "busImport" },
                        { messageId: "direct" },
                    ],
                },
                {
                    filename: E2E,
                    code: "await handler.execute(command); await worker.process(job)",
                    errors: [
                        { messageId: "direct" },
                        { messageId: "direct" },
                    ],
                },
                {
                    filename: E2E,
                    code: "await reconcileWorker.finalize(transaction)",
                    errors: [
                        { messageId: "internalActor" },
                    ],
                },
            ],
        })
})

test("E2E reads a consequence and never reaches a model", () => {
    tester.run("e2e-asserts-persisted-state",
        e2eAssertsPersistedState,
        {
            valid: [
                { filename: E2E, code: "await entityManager.findOne(Entity, {})" },
            ],
            invalid: [
                { filename: E2E, code: "expect(response.status).toBe(200)", errors: [{ messageId: "noState" }] },
            ],
        })
    tester.run("no-model-call-in-e2e",
        noModelCallInE2e,
        {
            valid: [
                { filename: E2E, code: "jest.mock('@modules/ai/ai-invoke.service')" },
            ],
            invalid: [
                { filename: E2E, code: "import OpenAI from 'openai'", errors: [{ messageId: "provider" }] },
            ],
        })
})

test("E2E flow steps are deterministic and state-bounded", () => {
    tester.run("no-sleep-in-flow",
        noSleepInFlow,
        {
            valid: [
                { filename: E2E, code: "await pollUntil(() => state.done)" },
            ],
            invalid: [
                { filename: E2E, code: "await sleep(500)", errors: [{ messageId: "sleep" }] },
                { filename: E2E, code: "await new Promise(resolve => setTimeout(resolve, 500))", errors: [{ messageId: "timer" }] },
            ],
        })
    tester.run("no-branch-in-flow-step",
        noBranchInFlowStep,
        {
            valid: [
                { filename: E2E, code: "it('settles', () => expect(state).toBe('paid'))" },
            ],
            invalid: [
                { filename: E2E, code: "it('settles', () => { if (order) expect(order.state).toBe('paid') })", errors: [{ messageId: "branch" }] },
            ],
        })
})
