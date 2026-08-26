import type {
    EntityManager,
} from "typeorm"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import type {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    CoursesResolver,
} from "./courses.resolver"
import type {
    CoursesService,
} from "./courses.service"
import {
    SortBy,
} from "./graphql-types/request"
import {
    SortOrder,
} from "@modules/api/apollo/server/graphql-types/inputs/sort"

describe("CoursesResolver",
    () => {
        it("drops stale Elasticsearch rows before course field resolvers run",
            async () => {
                const coursesService = {
                    execute: jest.fn().mockResolvedValue({
                        count: 2,
                        data: [
                            {
                                id: "existing-course",
                            },
                            {
                                id: "deleted-course",
                            },
                        ],
                    }),
                }
                const entityManager = {
                    find: jest.fn().mockResolvedValue([
                        {
                            id: "existing-course",
                        },
                    ]),
                }
                const resolver = new CoursesResolver(
                    coursesService as unknown as CoursesService,
                    entityManager as unknown as EntityManager,
                )

                const result = await resolver.execute(
                    undefined as unknown as UserEntity,
                    {
                        filters: {
                            sorts: [
                                {
                                    by: SortBy.Title,
                                    order: SortOrder.Asc,
                                },
                            ],
                        },
                    },
                    Locale.Vi,
                )

                expect(result.count).toBe(1)
                expect(result.data).toEqual([
                    {
                        id: "existing-course",
                    },
                ])
            })

        it("looks up authenticated enrollments once and defaults missing matches to false",
            async () => {
                const coursesService = {
                    execute: jest.fn().mockResolvedValue({
                        count: 2,
                        data: [{
                            id: "enrolled-course",
                        },
                        {
                            id: "not-enrolled-course",
                        }],
                    }),
                }
                const entityManager = {
                    find: jest.fn()
                        .mockResolvedValueOnce([{
                            id: "enrolled-course",
                        },
                        {
                            id: "not-enrolled-course",
                        }])
                        .mockResolvedValueOnce([{
                            courseId: "enrolled-course", isEnrolled: true,
                        }]),
                }
                const resolver = new CoursesResolver(
                    coursesService as unknown as CoursesService,
                    entityManager as unknown as EntityManager,
                )
                const result = await resolver.execute(
                    {
                        id: "user-1",
                    } as unknown as UserEntity,
                    {
                    } as never,
                    Locale.En,
                )

                expect(result.data).toEqual([{
                    id: "enrolled-course", isEnrolled: true,
                },
                {
                    id: "not-enrolled-course", isEnrolled: false,
                }])
                expect(entityManager.find).toHaveBeenCalledTimes(2)
            })

        it("does not query enrollments when the filtered page is empty",
            async () => {
                const coursesService = {
                    execute: jest.fn().mockResolvedValue({
                        count: 0, data: [],
                    }),
                }
                const entityManager = {
                    find: jest.fn().mockResolvedValue([]),
                }
                const resolver = new CoursesResolver(
                    coursesService as unknown as CoursesService,
                    entityManager as unknown as EntityManager,
                )
                await expect(resolver.execute(
                    {
                        id: "user-1",
                    } as unknown as UserEntity,
                    {
                    } as never,
                    Locale.En,
                )).resolves.toEqual({
                    count: 0, data: [],
                })
                expect(entityManager.find).not.toHaveBeenCalled()
            })
    })
