import {
    CourseMindMapService 
} from "./course-mind-map.service"
import {
    Locale 
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    MindMapNodeEntityType 
} from "@modules/databases/postgresql/primary/enums/mind-map-node-entity-type"

describe("CourseMindMapService",
    () => {
        type MindMapFixture = { children?: Array<{ id: string; label: { en: string; vi?: string }; desc?: { en: string; vi?: string }; children?: MindMapFixture["children"] }> }
        const course = (mindMap: MindMapFixture | null) => ({
            id: "course-id",
            displayId: "course-slug",
            title: "Course",
            mindMap,
        })
        it("loads UUIDs by id/displayId and lays out localized authored nodes",
            async () => {
                const manager = {
                    findOne: jest
                        .fn()
                        .mockResolvedValue(
                            course({
                                children: [
                                    {
                                        id: "root",
                                        label: {
                                            en: "Root", vi: "Root" 
                                        },
                                        desc: {
                                            en: "Description", vi: "Description" 
                                        },
                                        children: [
                                            {
                                                id: "leaf",
                                                label: {
                                                    en: "A long enough label to wrap", vi: "Label" 
                                                },
                                            },
                                        ],
                                    },
                                ],
                            }),
                        ),
                }
                const service = new CourseMindMapService(manager as never)
                const result = await service.execute({
                    courseId: "123e4567-e89b-12d3-a456-426614174000",
                    locale: Locale.Vi,
                })
                expect(manager.findOne).toHaveBeenCalledWith(expect.anything(),
                    {
                        where: [
                            {
                                id: "123e4567-e89b-12d3-a456-426614174000" 
                            },
                            {
                                displayId: "123e4567-e89b-12d3-a456-426614174000" 
                            },
                        ],
                    })
                expect(result.nodes[0]).toMatchObject({
                    id: "course-course-id",
                    data: {
                        kind: MindMapNodeEntityType.Course, label: "Course" 
                    },
                })
                expect(result.nodes).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({
                            id: "concept-root",
                            data: expect.objectContaining({
                                label: "Root" 
                            }),
                        }),
                    ]),
                )
                expect(result.edges).toHaveLength(2)
            })
        it("looks up slugs, returns empty graphs, and reports missing courses",
            async () => {
                const manager = {
                    findOne: jest
                        .fn()
                        .mockResolvedValueOnce(course(null))
                        .mockResolvedValueOnce(null),
                }
                const service = new CourseMindMapService(manager as never)
                await expect(
                    service.execute({
                        courseId: "course-slug", locale: Locale.En 
                    }),
                ).resolves.toEqual({
                    nodes: [], edges: [] 
                })
                await expect(
                    service.execute({
                        courseId: "missing", locale: Locale.En 
                    }),
                ).rejects.toThrow()
                expect(manager.findOne).toHaveBeenNthCalledWith(1,
                    expect.anything(),
                    {
                        where: {
                            displayId: "course-slug" 
                        },
                    })
            })
    })
