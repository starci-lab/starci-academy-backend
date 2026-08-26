import {
    ChallengeGlobalSearchService
} from "./challenge.service"
import {
    ContentGlobalSearchService
} from "./content.service"
import {
    FlashcardDeckGlobalSearchService
} from "./flashcard-deck.service"
import {
    FoundationGlobalSearchService
} from "./foundation.service"
import {
    MilestoneTaskGlobalSearchService
} from "./milestone-task.service"
import {
    MilestoneGlobalSearchService
} from "./milestone.service"
import type {
    EntitySearchParams
} from "../types/entity-search"

type SearchableService = {
    execute(params: EntitySearchParams): Promise<Array<{
        id: string
        displayId: string
        title: string
        texts?: Array<string>
    }>>
}

describe("global-search entity services",
    () => {
        it("builds an indexed query and maps highlights for every entity service",
            async () => {
                const services: Array<SearchableService> = [
                    ChallengeGlobalSearchService,
                    ContentGlobalSearchService,
                    FlashcardDeckGlobalSearchService,
                    FoundationGlobalSearchService,
                    MilestoneTaskGlobalSearchService,
                    MilestoneGlobalSearchService,
                ].map((Service) => {
                    const search = jest.fn().mockResolvedValue({
                        hits: {
                            hits: [{
                                _id: "fallback-id",
                                _source: {
                                    id: "source-id",
                                    displayId: "display",
                                    title: "Title",
                                },
                                highlight: {
                                    title: ["one"],
                                    description: ["two"],
                                    body: ["three"],
                                    prerequisites: ["four"],
                                },
                            }],
                        },
                    })
                    return new Service({
                        indicateName: jest.fn().mockReturnValue("entity-en"),
                        client: {
                            search
                        },
                    } as never)
                })

                for (const service of services) {
                    const result = await service.execute({
                        term: "nest",
                        size: 8,
                        locale: "en" as never,
                    })
                    expect(result[0]).toEqual(expect.objectContaining({
                        id: "source-id",
                        displayId: "display",
                        title: "Title",
                    }))
                    expect(result[0].texts?.length).toBeGreaterThan(0)
                    expect(result[0].texts?.length).toBeLessThanOrEqual(3)
                    expect(result[0].texts?.every((text) => text.includes("one")
                        || text.includes("two")
                        || text.includes("three")
                        || text.includes("four"))).toBe(true)
                }
            })

        it("falls back to source text and empty identifiers when highlights/source are absent",
            async () => {
                const search = jest.fn().mockResolvedValue({
                    hits: {
                        hits: [{
                            _id: "fallback-id",
                            _source: {
                                description: "A useful description",
                            },
                        }],
                    },
                })
                const service = new FoundationGlobalSearchService({
                    indicateName: jest.fn().mockReturnValue("foundations-en"),
                    client: {
                        search
                    },
                } as never)

                await expect(service.execute({
                    term: "missing",
                    size: 3,
                    locale: "en" as never,
                })).resolves.toEqual([{
                    id: "fallback-id",
                    displayId: "",
                    title: "",
                    texts: ["... A useful description ..."],
                }])
                expect(search).toHaveBeenCalledWith(expect.objectContaining({
                    index: "foundations-en",
                    size: 3,
                }))
            })

        it("uses each entity's best available source field when Elasticsearch has no highlights",
            async () => {
                const cases: Array<{
                    Service: new (elasticsearch: never) => SearchableService
                    source: Record<string, string>
                    expected: string
                }> = [
                    {
                        Service: ChallengeGlobalSearchService,
                        source: {
                            title: "Challenge fallback",
                        },
                        expected: "Challenge fallback",
                    },
                    {
                        Service: ContentGlobalSearchService,
                        source: {
                            body: "Content fallback",
                        },
                        expected: "Content fallback",
                    },
                    {
                        Service: FlashcardDeckGlobalSearchService,
                        source: {
                            description: "Deck fallback",
                        },
                        expected: "Deck fallback",
                    },
                    {
                        Service: MilestoneTaskGlobalSearchService,
                        source: {
                            title: "Task fallback",
                        },
                        expected: "Task fallback",
                    },
                    {
                        Service: MilestoneGlobalSearchService,
                        source: {
                            title: "Milestone fallback",
                        },
                        expected: "Milestone fallback",
                    },
                ]

                for (const { Service, source, expected } of cases) {
                    const service = new Service({
                        indicateName: jest.fn().mockReturnValue("entity-en"),
                        client: {
                            search: jest.fn().mockResolvedValue({
                                hits: {
                                    hits: [{
                                        _source: source,
                                    }],
                                },
                            }),
                        },
                    } as never)

                    await expect(service.execute({
                        term: "fallback",
                        size: 1,
                        locale: "en" as never,
                    })).resolves.toEqual([
                        expect.objectContaining({
                            title: source.title ?? "",
                            texts: [expect.stringContaining(expected)],
                        }),
                    ])
                }
            })
    })
