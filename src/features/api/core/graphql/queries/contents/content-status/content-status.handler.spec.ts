// Load the bussiness barrel first so its CQRS/elasticsearch base classes are
// initialised before the handler pulls `@modules/cqrs` -- dodges a load-order
// "Class extends value undefined" cycle.
import "@modules/bussiness/bussiness.module"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    ContentStatusHandler,
} from "./content-status.handler"
import {
    ContentStatusQuery,
} from "./content-status.query"
import {
    makeEntityManagerMock,
} from "@modules/tests/utils/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@modules/tests/utils/mocks/entity-manager.mock"
import type {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** Minimal user stand-in -- only the id is read by the handler. */
const fakeUser = (
    id: string,
): UserEntity => ({
    id,
}) as unknown as UserEntity

describe("ContentStatusHandler",
    () => {
        let module: TestingModule
        let handler: ContentStatusHandler
        let entityManager: EntityManagerMock

        beforeEach(async () => {
            // fresh jest-backed entity manager (findOne resolves null by default)
            entityManager = makeEntityManagerMock()

            module = await Test.createTestingModule({
                providers: [
                    ContentStatusHandler,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            handler = module.get<ContentStatusHandler>(ContentStatusHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("returns a false status for an anonymous viewer without a DB lookup",
            async () => {
                const result = await handler.execute(
                    new ContentStatusQuery({
                        request: {
                            contentId: "content-1",
                        },
                        user: undefined,
                    }),
                )

                expect(result).toEqual({
                    isRead: false,
                    isFavorite: false,
                })
                expect(entityManager.findOne).not.toHaveBeenCalled()
            })

        it("maps the user-content row flags onto the status payload",
            async () => {
                entityManager.findOne.mockResolvedValueOnce({
                    isRead: true,
                    isFavorite: true,
                })

                const result = await handler.execute(
                    new ContentStatusQuery({
                        request: {
                            contentId: "content-1",
                        },
                        user: fakeUser("u1"),
                    }),
                )

                expect(result).toEqual({
                    isRead: true,
                    isFavorite: true,
                })
            })

        it("defaults both flags to false when no user-content row exists",
            async () => {
                entityManager.findOne.mockResolvedValueOnce(null)

                const result = await handler.execute(
                    new ContentStatusQuery({
                        request: {
                            contentId: "content-1",
                        },
                        user: fakeUser("u1"),
                    }),
                )

                expect(result).toEqual({
                    isRead: false,
                    isFavorite: false,
                })
            })
    })
