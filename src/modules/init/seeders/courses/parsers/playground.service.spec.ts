import {
    CoerceMdScalarService,
} from "../../shared/extracts/coerce-md-scalar.service"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    PlaygroundEntity,
} from "@modules/databases/postgresql/primary/entities/playground.entity"
import {
    PlaygroundParserService,
} from "./playground.service"
describe("PlaygroundParserService",
    () => {
        it("returns no playgrounds when its path index is empty",
            async () => {
                const service = new PlaygroundParserService(
                    {
                        paths: jest.fn().mockResolvedValue([]),
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                    {
                        log: jest.fn(),
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                )

                await expect(service.parseMany({
                    courseRelativePath: "1-course",
                    courseIndex: 1,
                    courseId: "c1",
                })).resolves.toEqual([])
            })

        it("parses localized fields, delegates steps, and falls back for invalid sortIndex",
            async () => {
                const transform = jest.fn()
                const parseManySteps = jest.fn().mockResolvedValue([{
                    id: "step-1"
                }])
                const service = new PlaygroundParserService(
                    {
                        paths: jest.fn(),
                    } as never,
                    {
                        parseMany: parseManySteps,
                    } as never,
                    {
                        load: jest.fn().mockResolvedValue("markdown"),
                    } as never,
                    {
                        extract: jest.fn((value: string) => value === "markdown"
                            ? {
                                slug: "playground",
                                title: "Playground",
                                description: "Description",
                                icon: "terminal",
                                kind: "terminal",
                                sortIndex: "invalid",
                            }
                            : {
                            }),
                    } as never,
                    new CoerceMdScalarService(),
                    {
                        merge: jest.fn().mockReturnValue({
                            slug: "playground",
                            title: "Playground",
                            description: "Description",
                            icon: "terminal",
                            kind: "terminal",
                            sortIndex: "invalid",
                            translations: [{
                                locale: Locale.Vi,
                                field: "title",
                                value: "Thực hành", // vn-ok: vi-locale parser fixture assertion
                            }],
                        }),
                    } as never,
                    {
                        generate: jest.fn().mockReturnValue("playground-id"),
                    } as never,
                    {
                        log: jest.fn(),
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                )

                const result = await service.parse({
                    paths: [{
                        relativePath: "course/playgrounds/4-demo",
                        orderIndex: 4,
                        displayId: "demo",
                    }],
                    courseIndex: 2,
                    courseId: "course-id",
                    playgroundIndex: 4,
                })

                expect(result).toEqual(expect.objectContaining({
                    id: "playground-id",
                    courseId: "course-id",
                    slug: "playground",
                    sortIndex: 4,
                    steps: [{
                        id: "step-1"
                    }],
                    translations: [{
                        playgroundId: "playground-id",
                        locale: Locale.Vi,
                        field: "title",
                        value: "Thực hành", // vn-ok: vi-locale parser fixture assertion
                    }],
                }))
                expect(parseManySteps).toHaveBeenCalledWith({
                    playgroundRelativePath: "course/playgrounds/4-demo",
                    courseIndex: 2,
                    playgroundIndex: 4,
                    playgroundId: "playground-id",
                })
                expect(transform).not.toHaveBeenCalled()
            })

        it("rejects an unmounted playground ordinal",
            async () => {
                const service = new PlaygroundParserService(
                    {
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                )

                await expect(service.parse({
                    paths: [],
                    courseIndex: 0,
                    courseId: "course-id",
                    playgroundIndex: 9,
                })).rejects.toMatchObject({
                    code: "PLAYGROUND_PATH_NOT_FOUND_EXCEPTION",
                })
            })
        it("loads persisted playgrounds by the deterministic course id",
            async () => {
                const rows = [{
                    id: "playground-1"
                }] as never
                const find = jest.fn().mockResolvedValue(rows)
                const service = new PlaygroundParserService(
                    {
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                    new CoerceMdScalarService(),
                    {
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                    {
                        generate: jest.fn().mockReturnValue("course-id")
                    } as never,
                    {
                        find
                    } as never,
                )

                await expect(service.playgroundsFromDatabase({
                    courseIndex: 3,
                })).resolves.toBe(rows)
                expect(find).toHaveBeenCalledWith(
                    PlaygroundEntity,
                    {
                        where: {
                            course: {
                                id: "course-id",
                            },
                        },
                    },
                )
            })

        it("keeps readable playgrounds when one mounted folder fails to parse",
            async () => {
                const parse = jest.fn()
                    .mockResolvedValueOnce({
                        id: "playground-0"
                    })
                    .mockRejectedValueOnce(new Error("invalid playground"))
                const log = jest.fn()
                const service = new PlaygroundParserService(
                    {
                        paths: jest.fn().mockResolvedValue([
                            {
                                relativePath: "course/0-good", orderIndex: 0, displayId: "good"
                            },
                            {
                                relativePath: "course/1-bad", orderIndex: 1, displayId: "bad"
                            },
                        ]),
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                    new CoerceMdScalarService(),
                    {
                    } as never,
                    {
                    } as never,
                    {
                        log
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                )
                jest.spyOn(service,
                    "parse").mockImplementation(parse)

                await expect(service.parseMany({
                    courseRelativePath: "course",
                    courseIndex: 0,
                    courseId: "course-id",
                })).resolves.toEqual([
                    expect.objectContaining({
                        index: 0,
                        relativePath: "course/0-good",
                    }),
                ])
                expect(log).toHaveBeenCalledTimes(1)
            })
    })
