// Side-effect import: load the elasticsearch barrel first to dodge the cqrs
// barrel load-order cycle (see course.handler.spec.ts for the full rationale).
import "@modules/integrations/elasticsearch/elasticsearch.module"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    LivestreamSessionsHandler,
} from "./livestream-sessions.handler"
import {
    LivestreamSessionsQuery,
} from "./livestream-sessions.query"
import {
    LivestreamSessionsSortBy,
} from "./graphql-types/request"
import {
    SortOrder,
} from "@modules/api/apollo/server/graphql-types/inputs/sort"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    LivestreamSessionResolverService,
} from "@modules/databases/postgresql/primary/resolvers/livestream-session-resolver.service"
import {
    makeEntityManagerMock,
} from "@modules/tests/utils/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@modules/tests/utils/mocks/entity-manager.mock"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

describe("LivestreamSessionsHandler",
    () => {
        let module: TestingModule
        let handler: LivestreamSessionsHandler
        let entityManager: EntityManagerMock
        let livestreamSessionResolver: jest.Mocked<Pick<LivestreamSessionResolverService, "transform">>

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()
            // findAndCount is not on the shared mock -- add it per spec (no util edit)
            entityManager.findAndCount = jest.fn().mockResolvedValue([
                [],
                0,
            ])

            // resolver mutates the entity in place; a no-op spy is enough to assert calls
            livestreamSessionResolver = {
                transform: jest.fn(),
            } as unknown as jest.Mocked<Pick<LivestreamSessionResolverService, "transform">>

            module = await Test.createTestingModule({
                providers: [
                    LivestreamSessionsHandler,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                    {
                        provide: LivestreamSessionResolverService,
                        useValue: livestreamSessionResolver,
                    },
                ],
            }).compile()

            handler = module.get<LivestreamSessionsHandler>(LivestreamSessionsHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("returns rows + count and localizes each session via the resolver",
            async () => {
                const sessions = [
                    {
                        id: "s1",
                        course: {
                            defaultLocale: Locale.En,
                        },
                    },
                    {
                        id: "s2",
                        // no course -> resolver should be handed the En fallback
                        course: undefined,
                    },
                ]
                ;(entityManager.findAndCount as jest.Mock).mockResolvedValueOnce([
                    sessions,
                    2,
                ])

                const result = await handler.execute(
                    new LivestreamSessionsQuery({
                        request: {
                            courseId: "course-1",
                            filters: {
                                sorts: [
                                    {
                                        by: LivestreamSessionsSortBy.SortIndex,
                                        order: SortOrder.Asc,
                                    },
                                ],
                                limit: 10,
                                pageNumber: 0,
                            },
                        },
                        locale: Locale.Vi,
                    }),
                )

                expect(result.count).toBe(2)
                expect(result.data).toBe(sessions)
                // every session is localized -- once per row
                expect(livestreamSessionResolver.transform).toHaveBeenCalledTimes(2)
                // second row has no course -> falls back to En
                expect(livestreamSessionResolver.transform).toHaveBeenNthCalledWith(
                    2,
                    sessions[1],
                    Locale.Vi,
                    Locale.En,
                )
            })

        it("builds the order map and the take/skip window from pagination",
            async () => {
                await handler.execute(
                    new LivestreamSessionsQuery({
                        request: {
                            courseId: "course-1",
                            filters: {
                                sorts: [
                                    {
                                        by: LivestreamSessionsSortBy.StartTime,
                                        order: SortOrder.Desc,
                                    },
                                ],
                                limit: 4,
                                pageNumber: 2,
                            },
                        },
                    }),
                )

                const findArgs = (entityManager.findAndCount as jest.Mock).mock.calls[0][1]
                // page 2 with size 4 -> skip 8, take 4
                expect(findArgs.take).toBe(4)
                expect(findArgs.skip).toBe(8)
                // the sort field maps to the requested order
                expect(findArgs.order).toEqual({
                    startTime: SortOrder.Desc,
                })
                // scoped to the requested course
                expect(findArgs.where.course.id).toBe("course-1")
            })
    })
