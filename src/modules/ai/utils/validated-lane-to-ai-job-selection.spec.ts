import {
    ModelProvider,
} from "@modules/databases"
import {
    validatedLaneToAiJobSelection,
} from "./validated-lane-to-ai-job-selection"

describe("validatedLaneToAiJobSelection",
    () => {
        it("maps an empty lane to a model-less selection",
            () => {
                // no pinned model -- the balancer chooses at grade time
                const selection = validatedLaneToAiJobSelection({
                })

                expect(selection).toEqual({
                    model: undefined,
                    provider: undefined,
                })
            })

        it("carries the resolved catalog model when one was pinned",
            () => {
                // a pinned lane carries the validator-resolved catalog model + provider
                const selection = validatedLaneToAiJobSelection({
                    gradingModel: "gpt-4o",
                    gradingProvider: ModelProvider.OpenAI,
                })

                expect(selection).toEqual({
                    model: "gpt-4o",
                    provider: ModelProvider.OpenAI,
                })
            })
    })
