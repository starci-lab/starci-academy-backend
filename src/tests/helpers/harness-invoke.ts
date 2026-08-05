import type {
    BaseMessage,
} from "@langchain/core/messages"
import {
    ModelProvider,
} from "@modules/databases"
import {
    AiInvokeService,
} from "@modules/ai/ai-invoke.service"
import type {
    AiRunParams,
    AiRunResult,
} from "@modules/ai/types/ai-invoke"
import {
    generate,
} from "./models"
import type {
    HarnessTierName,
} from "./models"

/**
 * Flatten the `system`+`human` LangChain messages a flow's prompt builder
 * produced into a `{ system, prompt }` pair for {@link generate}. The grounding
 * context is carried verbatim -- only the transport changes, so the business
 * prompt under test is exactly what production builds.
 */
export const messagesToPrompt = (
    messages: Array<BaseMessage>,
): {
    system: string
    prompt: string
} => {
    const roleOf = (message: BaseMessage): string =>
        (message as unknown as {
            _getType?: () => string
        })._getType?.() ?? "human"

    const text = (message: BaseMessage): string =>
        typeof message.content === "string"
            ? message.content
            : String(message.content)

    const system = messages
        .filter((message) => roleOf(message) === "system")
        .map(text)
        .join("\n\n")
    const prompt = messages
        .filter((message) => roleOf(message) !== "system")
        .map(text)
        .join("\n\n")

    return {
        system,
        prompt,
    }
}

/**
 * Build a harness-backed {@link AiInvokeService} stand-in: it keeps the app's
 * real `run(...)` CONTRACT (every AI flow injects `AiInvokeService` and calls
 * `.run`) but swaps the balancer/key-pool transport for the harness's tiered
 * Anthropic client (authenticated from `.secrets`). So the prompt the real
 * grade/chat service built is answered by a REAL Claude model at `getTier()`,
 * and the artifact under judgement (`result.text`, which each flow then parses)
 * is a real model answer, not a canned fixture.
 *
 * Provide it in a test module as
 * `{ provide: AiInvokeService, useValue: createHarnessInvoke(() => tier) }`.
 *
 * @param getTier - resolves the tier for the CURRENT call (read per-`run` so a
 *   single instance can serve rotating tiers across `it` cases).
 * @returns an object with the one `run` method every flow uses.
 */
export const createHarnessInvoke = (
    getTier: () => HarnessTierName,
): Pick<AiInvokeService, "run"> => ({
    run: async (
        {
            messages,
        }: AiRunParams,
    ): Promise<AiRunResult> => {
        const tier = getTier()
        const {
            system,
            prompt,
        } = messagesToPrompt(messages)

        const text = await generate(tier,
            {
                prompt,
                ...(system
                    ? {
                        system,
                    }
                    : {
                    }),
            })

        return {
            text,
            model: `harness:${tier}`,
            provider: ModelProvider.Anthropic,
            attempts: 1,
            cost: 0,
            promptTokens: 0,
            completionTokens: 0,
        }
    },
})
