import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ModelProvider,
} from "@modules/databases/postgresql/primary/enums/model-provider"
import {
    CvBlocksEmptyException,
} from "@modules/platform/exceptions/errors/cv/cv-blocks-empty"
import {
    CvModelOutputParseException,
} from "@modules/platform/exceptions/errors/cv/cv-model-output-parse"
import {
    CvModelOutputShapeException,
} from "@modules/platform/exceptions/errors/cv/cv-model-output-shape"
import {
    CvTailorMissingJobDescriptionException,
} from "@modules/platform/exceptions/errors/cv/cv-tailor-missing-job-description"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import {
    TailorCvBlocksCommand,
} from "./tailor-cv-blocks.command"
import {
    TailorCvBlocksHandler,
} from "./tailor-cv-blocks.handler"

const blocks = [
    {
        id: "block-1",
        type: "experience",
        title: "Backend",
        items: [{
            id: "item-1",
            fields: {
                text: "Built APIs" 
            },
        }],
    },
    {
        id: "block-2",
        type: "education",
        title: "Education",
        items: [],
    },
]

const makeHandler = (raw = JSON.stringify([{
    id: "block-1",
    type: "model-type",
    title: "Platform engineer",
    items: [{
        id: "item-1",
        fields: {
            text: "Built scalable APIs" 
        },
    }],
}])) => {
    const aiInvokeService = {
        run: jest.fn().mockResolvedValue({
            text: raw 
        }),
    }
    const gradingLaneValidationService = {
        validate: jest.fn().mockResolvedValue({
            gradingModel: "gpt-test",
            gradingProvider: ModelProvider.OpenAI,
        }),
    }
    return {
        handler: new TailorCvBlocksHandler(
            aiInvokeService as never,
            gradingLaneValidationService as never,
        ),
        aiInvokeService,
        gradingLaneValidationService,
    }
}

describe("TailorCvBlocksHandler",
    () => {
        it("tailors matching blocks while preserving the original block set and identity",
            async () => {
                const harness = makeHandler("```json\n"
            + JSON.stringify([{
                id: "block-1",
                type: "model-type",
                title: "Platform engineer",
                items: [{
                    id: "item-1",
                    fields: {
                        text: "Built scalable APIs" 
                    },
                }],
            },
            null,
            {
                id: 42,
            }])
            + "\n```")

                const result = await harness.handler.execute(new TailorCvBlocksCommand({
                    request: {
                        blocks,
                        jobDescription: "  Build resilient platform services.  ",
                        selectedModel: "gpt-test",
                        selectedModelProvider: ModelProvider.OpenAI,
                    },
                    user: {
                        id: "user-1" 
                    } as never,
                    locale: Locale.Vi,
                }))

                expect(result.blocks).toEqual([
                    {
                        ...blocks[0],
                        type: "experience",
                        title: "Platform engineer",
                        items: [{
                            id: "item-1",
                            fields: {
                                text: "Built scalable APIs" 
                            },
                        }],
                    },
                    blocks[1],
                ])
                expect(harness.gradingLaneValidationService.validate).toHaveBeenCalledWith({
                    userId: "user-1",
                    model: "gpt-test",
                    provider: ModelProvider.OpenAI,
                })
                const messages = harness.aiInvokeService.run.mock.calls[0][0].messages as Array<{ content: string }>
                expect(messages[0].content).toContain("Vietnamese (Tiếng Việt)")
                expect(messages[1].content).toContain("Build resilient platform services.")
            })

        it("rejects missing user, empty blocks, and blank job descriptions before AI invocation",
            async () => {
                const harness = makeHandler()
                await expect(harness.handler.execute(new TailorCvBlocksCommand({
                    request: {
                        blocks, jobDescription: "job" 
                    },
                }))).rejects.toThrow(UserNotFoundException)
                await expect(harness.handler.execute(new TailorCvBlocksCommand({
                    request: {
                        blocks: [], jobDescription: "job" 
                    },
                    user: {
                        id: "user-1" 
                    } as never,
                }))).rejects.toThrow(CvBlocksEmptyException)
                await expect(harness.handler.execute(new TailorCvBlocksCommand({
                    request: {
                        blocks, jobDescription: "   " 
                    },
                    user: {
                        id: "user-1" 
                    } as never,
                }))).rejects.toThrow(CvTailorMissingJobDescriptionException)
                expect(harness.aiInvokeService.run).not.toHaveBeenCalled()
            })

        it("rejects malformed JSON and a non-array model response",
            async () => {
                const badJson = makeHandler("not json")
                await expect(badJson.handler.execute(new TailorCvBlocksCommand({
                    request: {
                        blocks, jobDescription: "job" 
                    },
                    user: {
                        id: "user-1" 
                    } as never,
                }))).rejects.toThrow(CvModelOutputParseException)
                const badShape = makeHandler(JSON.stringify({
                    id: "not-an-array" 
                }))
                await expect(badShape.handler.execute(new TailorCvBlocksCommand({
                    request: {
                        blocks, jobDescription: "job" 
                    },
                    user: {
                        id: "user-1" 
                    } as never,
                }))).rejects.toThrow(CvModelOutputShapeException)
            })
    })
