import {
    CodeExplainingEntity,
} from "../entities/code-explaining.entity"
import {
    CodeImplementationEntity,
} from "../entities/code-implementation.entity"
import {
    ContentBodyEntity,
} from "../entities/content-body.entity"
import {
    ContentNotFoundException,
} from "@modules/platform/exceptions/errors/courses/content-not-found"
import {
    ContentHydrationService,
} from "./content-hydration.service"

const entityRow = (
    values: Record<string, unknown>,
) => ({
    ...values,
    toPlain: jest.fn().mockReturnValue({
        ...values,
    }),
})

describe("ContentHydrationService",
    () => {
        it("composes the delegated complete challenge graph with every existing content child",
            async () => {
                const content = entityRow({
                    id: "content-1",
                    title: "Lesson",
                })
                const codeExplaining = entityRow({
                    id: "explaining-1",
                })
                const codeImplementation = entityRow({
                    id: "implementation-1",
                })
                const body = entityRow({
                    id: "body-1",
                })
                const challenges = [{
                    id: "challenge-1",
                    requirements: [{
                        id: "requirement-1",
                    }],
                    steps: [{
                        id: "step-1",
                    }],
                    outputs: [{
                        id: "output-1",
                    }],
                    prerequisites: [{
                        id: "prerequisite-1",
                    }],
                    submissions: [{
                        id: "submission-1",
                    }],
                }]
                const rows = new Map<unknown, Array<ReturnType<typeof entityRow>>>([
                    [CodeExplainingEntity,
                        [codeExplaining]],
                    [CodeImplementationEntity,
                        [codeImplementation]],
                    [ContentBodyEntity,
                        [body]],
                ])
                const entityManager = {
                    findOne: jest.fn().mockResolvedValue(content),
                    find: jest.fn((entity: unknown) => Promise.resolve(rows.get(entity) ?? [])),
                }
                const challengeHydrationService = {
                    loadByContentId: jest.fn().mockResolvedValue(challenges),
                }
                const service = new ContentHydrationService(
                    entityManager as never,
                    challengeHydrationService as never,
                )

                const result = await service.loadById("content-1")

                expect(result).toMatchObject({
                    id: "content-1",
                    codeExplainings: [{
                        id: "explaining-1",
                    }],
                    codeImplementations: [{
                        id: "implementation-1",
                    }],
                    bodies: [{
                        id: "body-1",
                    }],
                    challenges,
                })
                expect(challengeHydrationService.loadByContentId)
                    .toHaveBeenCalledWith("content-1")
                expect(challengeHydrationService.loadByContentId).toHaveBeenCalledTimes(1)
                expect(entityManager.find).toHaveBeenCalledTimes(3)
            })

        it("raises the domain exception before loading child collections when content is absent",
            async () => {
                const entityManager = {
                    findOne: jest.fn().mockResolvedValue(null),
                    find: jest.fn(),
                }
                const challengeHydrationService = {
                    loadByContentId: jest.fn(),
                }
                const service = new ContentHydrationService(
                    entityManager as never,
                    challengeHydrationService as never,
                )

                await expect(service.loadById("missing-content"))
                    .rejects.toBeInstanceOf(ContentNotFoundException)
                expect(entityManager.find).not.toHaveBeenCalled()
                expect(challengeHydrationService.loadByContentId).not.toHaveBeenCalled()
            })
    })
