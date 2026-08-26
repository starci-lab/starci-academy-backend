import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ElasticsearchCourseBuildService,
} from "./course.service"

describe("ElasticsearchCourseBuildService",
    () => {
        it("fans a hydrated course into localized searchable documents",
            async () => {
                const loadById = jest.fn().mockResolvedValue({
                    id: "course-1",
                    title: "Course",
                    orderIndex: 3,
                })
                const transform = jest.fn()
                const service = new ElasticsearchCourseBuildService(
                    {
                        loadById,
                    } as never,
                    {
                        transform,
                    } as never,
                    {
                        indexEntity: jest.fn(),
                    } as never,
                )

                const documents = await service.buildMultilingualByCourseId("course-1")

                expect(documents).toHaveLength(Object.values(Locale).length)
                expect(transform).toHaveBeenCalledTimes(Object.values(Locale).length)
                expect(documents.map((document) => document.locale)).toEqual(
                    Object.values(Locale),
                )
                expect(documents[0]?.entity.suggest).toEqual(expect.objectContaining({
                    input: ["Course"],
                    weight: 97,
                }))
            })

        it("indexes every localized document produced for a course",
            async () => {
                const indexEntity = jest.fn().mockResolvedValue(undefined)
                const service = new ElasticsearchCourseBuildService(
                    {
                        loadById: jest.fn().mockResolvedValue({
                            id: "course-1",
                            title: "Course",
                            orderIndex: 0,
                        }),
                    } as never,
                    {
                        transform: jest.fn(),
                    } as never,
                    {
                        indexEntity,
                    } as never,
                )

                await service.buildIndexById("course-1")

                expect(indexEntity).toHaveBeenCalledTimes(Object.values(Locale).length)
                expect(indexEntity).toHaveBeenCalledWith(expect.objectContaining({
                    locale: Locale.En,
                }))
            })
    })
