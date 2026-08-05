import {
    ModelProvider,
} from "@modules/databases/postgresql/primary/enums/model-provider"
import {
    AiByokInvalidException,
} from "@modules/platform/exceptions/errors/ai/ai-byok-invalid"
import type {
    FlatAiSelectionFields,
} from "./flat-fields-to-ai-job-selection"
import {
    flatFieldsToAiJobSelection,
} from "./flat-fields-to-ai-job-selection"

describe("flatFieldsToAiJobSelection",
    () => {
        it("returns undefined when neither field is set — caller applies the balancer default",
            () => {
                const fields: FlatAiSelectionFields = {
                }

                expect(flatFieldsToAiJobSelection(fields)).toBeUndefined()
            })

        it("pins the model + provider together when both are supplied",
            () => {
                const fields: FlatAiSelectionFields = {
                    selectedModel: "gpt-4o",
                    selectedModelProvider: ModelProvider.OpenAI,
                }

                expect(flatFieldsToAiJobSelection(fields)).toStrictEqual({
                    model: "gpt-4o",
                    provider: ModelProvider.OpenAI,
                })
            })

        it("throws AiByokInvalidException when a model is supplied without its provider",
            () => {
                const fields: FlatAiSelectionFields = {
                    selectedModel: "gpt-4o",
                }

                expect(() => flatFieldsToAiJobSelection(fields)).toThrow(AiByokInvalidException)
            })

        it("throws AiByokInvalidException when a provider is supplied without its model",
            () => {
                const fields: FlatAiSelectionFields = {
                    selectedModelProvider: ModelProvider.Anthropic,
                }

                expect(() => flatFieldsToAiJobSelection(fields)).toThrow(AiByokInvalidException)
            })

        it("carries the mismatch reason on the exception metadata",
            () => {
                const fields: FlatAiSelectionFields = {
                    selectedModel: "gpt-4o",
                }

                // asserted first so a non-throwing regression fails here, not by
                // falling through the catch block below with nothing to inspect
                expect(() => flatFieldsToAiJobSelection(fields)).toThrow(AiByokInvalidException)

                try {
                    flatFieldsToAiJobSelection(fields)
                } catch (error) {
                    const byokError = error as AiByokInvalidException
                    expect(byokError.metadata?.reason).toBe(
                        "a pinned model requires both a model and a provider",
                    )
                }
            })
    })
