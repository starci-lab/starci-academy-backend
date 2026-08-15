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
    })
