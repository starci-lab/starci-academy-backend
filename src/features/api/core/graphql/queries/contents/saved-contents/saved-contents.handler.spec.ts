// Load the bussiness barrel first so its CQRS/elasticsearch base classes are
// initialised before the handler pulls `@modules/cqrs` -- dodges a load-order
// "Class extends value undefined" cycle.
import "@modules/bussiness"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    SavedContentsHandler,
} from "./saved-contents.handler"
import {
    SavedContentsQuery,
} from "./saved-contents.query"
import {
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
} from "@modules/tests"
import type {
    UserContentEntity,
    UserEntity,
} from "@modules/databases"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** Minimal user stand-in -- only the id is read by the handler. */
const fakeUser = (
    id: string,
): UserEntity => ({
    id,
}) as unknown as UserEntity

describe("SavedContentsHandler",
    () => {
        let module: TestingModule
        let handler: SavedContentsHandler
        let entityManager: EntityManagerMock
        let findAndCount: jest.Mock

        beforeEach(async () => {
            // fresh jest-backed entity manager; findAndCount is not part of the
            // shared mock, so attach a per-test jest.fn for this handler.
            entityManager = makeEntityManagerMock()
            findAndCount = jest.fn().mockResolvedValue([
                [],
                0,
            ])
            ;(entityManager as unknown as {
                findAndCount: jest.Mock
            }).findAndCount = findAndCount

            module = await Test.createTestingModule({
                providers: [
                    SavedContentsHandler,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            handler = module.get<SavedContentsHandler>(SavedContentsHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("returns an empty page for an anonymous viewer without a DB lookup",
            async () => {
                const result = await handler.execute(
                    new SavedContentsQuery({
                        request: {
                        },
                        user: undefined,
                    }),
                )

                expect(result).toEqual({
                    contents: [],
                    count: 0,
                })
                expect(findAndCount).not.toHaveBeenCalled()
            })

        it("unwraps the joined content rows and drops any null relation",
            async () => {
                const userContents = [
                    {
                        content: {
                            id: "c1",
                        },
                    },
                    {
                        // a dangling favorite whose content was deleted
                        content: null,
                    },
                    {
                        content: {
                            id: "c2",
                        },
                    },
                ] as unknown as Array<UserContentEntity>
                findAndCount.mockResolvedValueOnce([
                    userContents,
                    3,
                ])

                const result = await handler.execute(
                    new SavedContentsQuery({
                        request: {
                            skip: 5,
                            take: 10,
                        },
                        user: fakeUser("u1"),
                    }),
                )

                // count reflects the raw join count, contents are flattened + filtered
                expect(result.count).toBe(3)
                expect(result.contents.map((c) => c.id)).toEqual([
                    "c1",
                    "c2",
                ])
                // the explicit skip/take pass straight through to the query
                expect(findAndCount).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.objectContaining({
                        skip: 5,
                        take: 10,
                    }),
                )
            })

        it("falls back to the default skip/take when none are provided",
            async () => {
                findAndCount.mockResolvedValueOnce([
                    [],
                    0,
                ])

                await handler.execute(
                    new SavedContentsQuery({
                        request: {
                        },
                        user: fakeUser("u1"),
                    }),
                )

                expect(findAndCount).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.objectContaining({
                        skip: 0,
                        take: 20,
                    }),
                )
            })
    })
