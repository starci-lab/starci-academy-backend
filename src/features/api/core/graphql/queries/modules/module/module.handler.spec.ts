// Side-effect import: load the elasticsearch barrel first to dodge the cqrs
// barrel load-order cycle (see courses/course/course.handler.spec.ts for details).
import "@modules/elasticsearch"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    ModuleHandler,
} from "./module.handler"
import {
    ModuleQuery,
} from "./module.query"
import {
    ModuleNotFoundException,
} from "@modules/exceptions"
import {
    Locale,
    ModuleResolverService,
} from "@modules/databases"
import {
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
} from "@modules/tests"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

describe("ModuleHandler",
    () => {
        let module: TestingModule
        let handler: ModuleHandler
        let entityManager: EntityManagerMock
        let moduleResolver: jest.Mocked<Pick<ModuleResolverService, "transform">>

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()

            // resolver echoes the localized entity back so the handler return is observable
            moduleResolver = {
                transform: jest.fn((entity) => entity),
            } as unknown as jest.Mocked<Pick<ModuleResolverService, "transform">>

            module = await Test.createTestingModule({
                providers: [
                    ModuleHandler,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                    {
                        provide: ModuleResolverService,
                        useValue: moduleResolver,
                    },
                ],
            }).compile()

            handler = module.get<ModuleHandler>(ModuleHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("loads the module by id and returns it localized via the resolver",
            async () => {
                const moduleEntity = {
                    id: "m1",
                }
                entityManager.findOne.mockResolvedValueOnce(moduleEntity)

                const result = await handler.execute(
                    new ModuleQuery({
                        request: {
                            id: "m1",
                        },
                        locale: Locale.Vi,
                    }),
                )

                // the where clause carries the supplied id (displayId branch stays absent)
                const findArgs = entityManager.findOne.mock.calls[0][1]
                expect(findArgs.where.id).toBe("m1")
                expect(findArgs.where.displayId).toBeUndefined()
                // result flows through the localizer
                expect(moduleResolver.transform).toHaveBeenCalledWith(
                    moduleEntity,
                    Locale.Vi,
                )
                expect(result).toBe(moduleEntity)
            })

        it("loads the module by displayId when no id is supplied",
            async () => {
                entityManager.findOne.mockResolvedValueOnce({
                    id: "m2",
                })

                await handler.execute(
                    new ModuleQuery({
                        request: {
                            displayId: "database-fundamentals",
                        },
                    }),
                )

                const findArgs = entityManager.findOne.mock.calls[0][1]
                expect(findArgs.where.displayId).toBe("database-fundamentals")
                expect(findArgs.where.id).toBeUndefined()
            })

        it("throws when no module matches",
            async () => {
                // default findOne resolves null → nothing found
                await expect(
                    handler.execute(
                        new ModuleQuery({
                            request: {
                                id: "missing",
                            },
                        }),
                    ),
                ).rejects.toBeInstanceOf(ModuleNotFoundException)

                expect(moduleResolver.transform).not.toHaveBeenCalled()
            })
    })
