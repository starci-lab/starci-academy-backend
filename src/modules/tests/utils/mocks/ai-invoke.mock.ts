import type {
    AiRunResult,
} from "@modules/ai"
import {
    ModelProvider,
} from "@modules/databases"

/**
 * A jest-backed stand-in for {@link AiInvokeService}.
 *
 * `run` / `invoke` / `stream` all resolve the same {@link AiRunResult} shape
 * -- a superset of `AiInvokeResult` / `AiStreamResult` -- so one default result
 * satisfies whichever entry point the SUT happens to call.
 */
export interface AiInvokeMock {
    /** Mocks {@link AiInvokeService.run}. */
    run: jest.Mock
    /** Mocks {@link AiInvokeService.invoke}. */
    invoke: jest.Mock
    /** Mocks {@link AiInvokeService.stream}. */
    stream: jest.Mock
}

/**
 * Build a fresh {@link AiInvokeMock} for a service unit test. Use it as the
 * value for the `AiInvokeService` provider so the SUT never calls a real model.
 *
 * @param text - The response text every method resolves with (default `"{}"`,
 * matching grading-style call-sites that `JSON.parse` the response).
 * @param overrides - Partial {@link AiRunResult} fields layered over the defaults.
 * @returns a standalone AI-invoke mock with happy-path defaults
 *
 * @example
 * const aiInvokeService = makeAiInvokeMock(JSON.stringify({ score: 80 }))
 * // ...
 * { provide: AiInvokeService, useValue: aiInvokeService }
 */
export const makeAiInvokeMock = (
    text = "{}",
    overrides: Partial<AiRunResult> = {
    },
): AiInvokeMock => {
    // happy-path defaults: one attempt, zero cost/usage, a placeholder served model
    const result: AiRunResult = {
        text,
        model: "gpt-4o-mini",
        provider: ModelProvider.OpenAI,
        attempts: 1,
        cost: 0,
        promptTokens: 0,
        completionTokens: 0,
        ...overrides,
    }

    return {
        run: jest.fn().mockResolvedValue(result),
        invoke: jest.fn().mockResolvedValue(result),
        stream: jest.fn().mockResolvedValue(result),
    }
}
