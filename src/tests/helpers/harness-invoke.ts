import type {
    BaseMessage,
} from "@langchain/core/messages"
import {
    ModelProvider,
} from "@modules/databases/postgresql/primary/enums/model-provider"
import {
    AiInvokeService,
} from "@modules/ai/ai-invoke.service"
import type {
    AiRunParams,
    AiRunResult,
} from "@modules/ai/types/ai-invoke"
import {
    askModel,
} from "./models"
import type {
    Effort,
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

/** Which model a harness run answers with. Named by the spec, resolved per call. */
export interface HarnessModel {
    /** The provider's model id. */
    model: string
    /** Optional reasoning effort; omitted for models that take no effort knob. */
    effort?: Effort
}

/**
 * Build a harness-backed {@link AiInvokeService} stand-in: it keeps the app's real `run(...)`
 * CONTRACT (every AI flow injects `AiInvokeService` and calls `.run`) but swaps the balancer and
 * key pool for a direct provider call. So the prompt the real grade/chat service built is answered
 * by a REAL model, and the artifact under judgement (`result.text`, which each flow then parses) is
 * a real answer rather than a canned fixture.
 *
 * THE SPEC NAMES THE MODEL. This used to take a tier name and look the model up in a house table,
 * which is one layer of choosing between the harness and the provider -- and a layer that chooses
 * can make the harness green about a model nobody ships. `getModel` returns the id itself, so the
 * file states what it is testing.
 *
 * Provide it in a test module as
 * `{ provide: AiInvokeService, useValue: createHarnessInvoke(() => ({ model: "..." })) }`.
 *
 * @param getModel - resolves the model for the CURRENT call, read per `run` so one instance can
 *   serve different models across cases.
 * @returns an object with the one `run` method every flow uses.
 */
export const createHarnessInvoke = (
    getModel: () => HarnessModel,
): Pick<AiInvokeService, "run"> => ({
    run: async (
        {
            messages,
        }: AiRunParams,
    ): Promise<AiRunResult> => {
        const target = getModel()
        const {
            system,
            prompt,
        } = messagesToPrompt(messages)

        const text = await askModel({
            model: target.model,
            prompt,
            ...(target.effort
                ? {
                    effort: target.effort,
                }
                : {
                }),
            ...(system
                ? {
                    system,
                }
                : {
                }),
        })

        return {
            text,
            model: target.model,
            provider: ModelProvider.Anthropic,
            attempts: 1,
            cost: 0,
            promptTokens: 0,
            completionTokens: 0,
        }
    },
})
