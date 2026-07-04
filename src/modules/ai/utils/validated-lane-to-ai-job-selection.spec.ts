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
    })
