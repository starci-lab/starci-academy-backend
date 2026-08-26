import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    CdnCourseBuildService,
} from "./course.service"

describe("CdnCourseBuildService",
    () => {
        it("creates an isolated localized document for every supported locale",
            async () => {
                const transform = jest.fn((entity: { title: string }, locale: Locale) => {
                    entity.title = `${locale}-course`
                })
                const service = new CdnCourseBuildService(
                    {
                        loadById: jest.fn().mockResolvedValue({
                            id: "course-1",
                            title: "Course",
                            displayId: "course",
                            modules: [],
                        }),
                    } as never,
                    {
                        transform,
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                )

                const documents = await service.buildMultilingualByCourseId("course-1")

                expect(documents.map((document) => document.locale)).toEqual(
                    Object.values(Locale),
                )
                expect(transform).toHaveBeenCalledTimes(Object.values(Locale).length)
                const entities = documents as unknown as Array<{ entity: { title: string } }>
                expect(entities.map((document) => document.entity.title)).toEqual([
                    `${Locale.Vi}-course`,
                    `${Locale.En}-course`,
                ])
            })

        it("materializes every locale and resolves the course CDN key",
            async () => {
                let resolveKey: ((id: string, locale: Locale) => string) | undefined
                const process = jest.fn(async (...args: unknown[]) => {
                    resolveKey = args[1] as (id: string, locale: Locale) => string
                })
                const log = jest.fn()
                const service = new CdnCourseBuildService(
                    {
                        loadById: jest.fn().mockResolvedValue({
                            id: "course-2",
                            displayId: "course-two",
                            modules: [{
                                id: "module-1",
                            }],
                        }),
                    } as never,
                    {
                        transform: jest.fn(),
                    } as never,
                    {
                        course: jest.fn((id: string, locale: Locale) => `${id}/${locale}`),
                    } as never,
                    {
                        process,
                    } as never,
                    {
                        log,
                    } as never,
                )

                await service.materializeAndUpload("course-2")

                expect(process).toHaveBeenCalledTimes(1)
                expect(resolveKey?.("course-2",
                    Locale.En)).toBe("course-2/en")
                expect(log).toHaveBeenCalledTimes(2)
                expect(log).toHaveBeenLastCalledWith(
                    expect.anything(),
                    expect.objectContaining({
                        step: "hydrate-done",
                        moduleCount: 1,
                    }),
                )
            })

        it("propagates hydration failures without uploading a partial document",
            async () => {
                const failure = new Error("course unavailable")
                const process = jest.fn()
                const service = new CdnCourseBuildService(
                    {
                        loadById: jest.fn().mockRejectedValue(failure),
                    } as never,
                    {
                    } as never,
                    {
                    } as never,
                    {
                        process,
                    } as never,
                    {
                        log: jest.fn(),
                    } as never,
                )

                await expect(service.materializeAndUpload("missing-course"))
                    .rejects.toBe(failure)
                expect(process).not.toHaveBeenCalled()
            })
    })
