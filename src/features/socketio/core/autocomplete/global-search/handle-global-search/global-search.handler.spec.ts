import {
    ChallengeEntity 
} from "@modules/databases/postgresql/primary/entities/challenge.entity"
import {
    ContentEntity 
} from "@modules/databases/postgresql/primary/entities/content.entity"
import {
    CourseEntity 
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    ModuleEntity 
} from "@modules/databases/postgresql/primary/entities/module.entity"
import {
    GlobalSearchHandler 
} from "./global-search.handler"
import {
    GlobalSearchQuery 
} from "./global-search.query"

describe("GlobalSearchHandler",
    () => {
        const searches = [
            "courseSearch",
            "moduleSearch",
            "challengeSearch",
            "contentSearch",
        ]
        const services = Object.fromEntries(
            searches.map((name) => [name,
                {
                    execute: jest.fn() 
                }]),
        ) as Record<string, { execute: jest.Mock }>
        let handler: GlobalSearchHandler

        beforeEach(() => {
            jest.clearAllMocks()
            Object.values(services).forEach((service) =>
                service.execute.mockResolvedValue([]),
            )
            handler = new GlobalSearchHandler(
      services.courseSearch as never,
      services.moduleSearch as never,
      services.challengeSearch as never,
      services.contentSearch as never,
            )
        })

        it("returns empty groups without querying for blank terms",
            async () => {
                await expect(
                    handler.execute(
                        new GlobalSearchQuery({
                            payload: {
                                data: {
                                    query: "  " 
                                }, locale: "en" 
                            },
                        } as never),
                    ),
                ).resolves.toEqual({
                    courses: [],
                    modules: [],
                    challenges: [],
                    contents: [],
                })
                expect(services.courseSearch.execute).not.toHaveBeenCalled()
            })

        it("queries all default entities, trims the term, and deduplicates by best text match",
            async () => {
                services.courseSearch.execute.mockResolvedValue([
                    {
                        id: "1", displayId: "course", title: "short", texts: ["x"] 
                    },
                    {
                        id: "1", displayId: "course", title: "better", texts: ["x",
                            "y"] 
                    },
                ])
                const query = new GlobalSearchQuery({
                    payload: {
                        data: {
                            query: "  nest  ", size: 4 
                        }, locale: "vi" 
                    },
                } as never)
                const result = await handler.execute(query)
                expect(services.courseSearch.execute).toHaveBeenCalledWith({
                    term: "nest",
                    size: 4,
                    locale: "vi",
                })
                expect(result.courses).toEqual([
                    {
                        id: "1", displayId: "course", title: "better", texts: ["x",
                            "y"] 
                    },
                ])
                expect(services.moduleSearch.execute).toHaveBeenCalled()
            })

        it("only queries selected entity names and uses the default size",
            async () => {
                const entities = [CourseEntity.name,
                    ContentEntity.name]
                await handler.execute(
                    new GlobalSearchQuery({
                        payload: {
                            data: {
                                query: "api", entities 
                            }, locale: "en" 
                        },
                    } as never),
                )
                expect(services.courseSearch.execute).toHaveBeenCalledWith({
                    term: "api",
                    size: 5,
                    locale: "en",
                })
                expect(services.contentSearch.execute).toHaveBeenCalled()
                expect(services.moduleSearch.execute).not.toHaveBeenCalled()
                expect(services.challengeSearch.execute).not.toHaveBeenCalled()
                expect([ModuleEntity.name,
                    ChallengeEntity.name]).not.toContain(
                    entities[0],
                )
            })
    })
