import {
    AiMode,
    ModelProvider,
} from "@modules/databases"
import {
    AiByokInvalidException,
} from "@modules/exceptions"
import {
    validatedLaneToAiJobSelection,
} from "./validated-lane-to-ai-job-selection"

describe("validatedLaneToAiJobSelection",
    () => {
        it("maps an Auto lane to a model-less Auto selection",
            () => {
                // Auto never pins a model — the balancer chooses at grade time
                const selection = validatedLaneToAiJobSelection({
                    mode: AiMode.Auto,
                })

                expect(selection).toEqual({
                    mode: AiMode.Auto,
                })
            })

        it("carries the resolved catalog model on a Premium lane",
            () => {
                // Premium pins the validator-resolved catalog model + provider
                const selection = validatedLaneToAiJobSelection({
                    mode: AiMode.Premium,
                    gradingModel: "gpt-4o",
                    gradingProvider: ModelProvider.OpenAI,
                })

                expect(selection).toEqual({
                    mode: AiMode.Premium,
                    model: "gpt-4o",
                    provider: ModelProvider.OpenAI,
                })
            })

        it("throws when a Premium lane is missing its resolved model",
            () => {
                // defensive guard: validator always sets these, so absence is a bug
                expect(() => validatedLaneToAiJobSelection({
                    mode: AiMode.Premium,
                    gradingProvider: ModelProvider.OpenAI,
                })).toThrow(AiByokInvalidException)
            })

        it("carries model + provider but no key when none was supplied inline",
            () => {
                // omitting the inline key tells the worker to load the stored key
                const selection = validatedLaneToAiJobSelection({
                    mode: AiMode.Byok,
                    byokModel: "gpt-4o-mini",
                    byokProvider: ModelProvider.OpenAI,
                })

                expect(selection).toEqual({
                    mode: AiMode.Byok,
                    model: "gpt-4o-mini",
                    provider: ModelProvider.OpenAI,
                })
            })

        it("threads the inline BYOK key through when present on the lane",
            () => {
                // an inline key set on the lane must ride along on the selection
                const selection = validatedLaneToAiJobSelection({
                    mode: AiMode.Byok,
                    byokModel: "gpt-4o-mini",
                    byokProvider: ModelProvider.OpenAI,
                    byokApiKey: "sk-inline",
                })

                expect(selection).toEqual({
                    mode: AiMode.Byok,
                    model: "gpt-4o-mini",
                    provider: ModelProvider.OpenAI,
                    apiKey: "sk-inline",
                })
            })

        it("throws when a BYOK lane is missing its provider",
            () => {
                // defensive guard mirrors the Premium branch for BYOK fields
                expect(() => validatedLaneToAiJobSelection({
                    mode: AiMode.Byok,
                    byokModel: "gpt-4o-mini",
                })).toThrow(AiByokInvalidException)
            })
    })
