import "@modules/bussiness"
import request from "supertest"
import {
    Test,
} from "@nestjs/testing"
import type {
    INestApplication,
    CanActivate,
    ExecutionContext,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    GqlExecutionContext,
} from "@nestjs/graphql"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    EntityManager,
} from "typeorm"
import {
    ApolloServerModule,
    ApolloServerType,
} from "@modules/api"
import {
    CvBlocksEntity,
    PrimaryPostgreSQLModule,
    UserEntity,
} from "@modules/databases"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    PingResolver,
} from "../helpers/ping-resolver"
import {
    CreateCvBlocksHandler,
} from "@features/api/core/graphql/mutations/cv-submissions/create-cv-blocks/create-cv-blocks.handler"
import {
    CreateCvBlocksResolver,
} from "@features/api/core/graphql/mutations/cv-submissions/create-cv-blocks/create-cv-blocks.resolver"
import {
    CreateCvBlocksService,
} from "@features/api/core/graphql/mutations/cv-submissions/create-cv-blocks/create-cv-blocks.service"
import {
    UpdateCvBlocksHandler,
} from "@features/api/core/graphql/mutations/cv-submissions/update-cv-blocks/update-cv-blocks.handler"
import {
    UpdateCvBlocksResolver,
} from "@features/api/core/graphql/mutations/cv-submissions/update-cv-blocks/update-cv-blocks.resolver"
import {
    UpdateCvBlocksService,
} from "@features/api/core/graphql/mutations/cv-submissions/update-cv-blocks/update-cv-blocks.service"
import {
    DeleteCvBlocksHandler,
} from "@features/api/core/graphql/mutations/cv-submissions/delete-cv-blocks/delete-cv-blocks.handler"
import {
    DeleteCvBlocksResolver,
} from "@features/api/core/graphql/mutations/cv-submissions/delete-cv-blocks/delete-cv-blocks.resolver"
import {
    DeleteCvBlocksService,
} from "@features/api/core/graphql/mutations/cv-submissions/delete-cv-blocks/delete-cv-blocks.service"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * e2e for the CV block-editor document lifecycle -- `cv_blocks` rows, the
 * "draft" half of the CV-submission state machine. The "submitted"/"generated"
 * half (a `cv_generations` row moving Pending -> ...) is covered separately in
 * `cv-submission-generation.e2e-spec.ts` (generate/upload/revise), since that
 * half touches the AI-job queue and this half never does.
 *
 * REAL: Postgres (Testcontainers), the full GraphQL/Apollo wiring (same
 * pattern as `content-ai-entitlement.e2e-spec.ts`), and every resolver/
 * service/handler in the create/update/delete chain -- nothing needs mocking
 * here, these three mutations touch only Postgres (no AI, no queue, no S3).
 *
 * Covers: create (empty + pre-filled defaults), update (partial-write
 * semantics + `pdfCdnKey` invalidation on ANY edit), delete, and ownership on
 * update/delete -- a row scoped to a different user 404s as
 * `CV_DOCUMENT_NOT_FOUND_EXCEPTION` (collapsed with genuinely-missing so
 * ownership is never leaked to the caller) and the row is left untouched.
 *
 * Requires Docker (Testcontainers spins up a real Postgres in `beforeAll`).
 */
describe("CV block-editor documents — create/update/delete (e2e)",
    () => {
        let app: INestApplication
        let entityManager: EntityManager

        /** The "logged in" user the overridden Keycloak guard stamps onto the request. */
        let currentUser: UserEntity | null = null

        /** Overrides the real Keycloak JWT verification -- no Keycloak server here. */
        const fakeAuthGuard: CanActivate = {
            canActivate: (context: ExecutionContext): boolean => {
                if (!currentUser) {
                    return false
                }
                const gqlContext = GqlExecutionContext.create(context)
                    .getContext<{ req: { user?: UserEntity } }>()
                gqlContext.req.user = currentUser
                return true
            },
        }

        const GRAPHQL_ENDPOINT = "/graphql"

        const CREATE_CV_BLOCKS_MUTATION = `
            mutation CreateCvBlocks($request: CreateCvBlocksRequest!) {
                createCvBlocks(request: $request) {
                    success
                    message
                    error
                    data {
                        id
                        label
                        blocks
                        style
                        pdfCdnKey
                    }
                }
            }
        `
        const UPDATE_CV_BLOCKS_MUTATION = `
            mutation UpdateCvBlocks($request: UpdateCvBlocksRequest!) {
                updateCvBlocks(request: $request) {
                    success
                    message
                    error
                    data {
                        id
                        label
                        blocks
                        style
                        pdfCdnKey
                    }
                }
            }
        `
        const DELETE_CV_BLOCKS_MUTATION = `
            mutation DeleteCvBlocks($request: DeleteCvBlocksRequest!) {
                deleteCvBlocks(request: $request) {
                    success
                    message
                    error
                    data {
                        id
                    }
                }
            }
        `

        const createCvBlocks = (input: Record<string, unknown>) =>
            request(app.getHttpServer())
                .post(GRAPHQL_ENDPOINT)
                .send({
                    query: CREATE_CV_BLOCKS_MUTATION,
                    variables: {
                        request: input,
                    },
                })

        const updateCvBlocks = (input: Record<string, unknown>) =>
            request(app.getHttpServer())
                .post(GRAPHQL_ENDPOINT)
                .send({
                    query: UPDATE_CV_BLOCKS_MUTATION,
                    variables: {
                        request: input,
                    },
                })

        const deleteCvBlocks = (input: Record<string, unknown>) =>
            request(app.getHttpServer())
                .post(GRAPHQL_ENDPOINT)
                .send({
                    query: DELETE_CV_BLOCKS_MUTATION,
                    variables: {
                        request: input,
                    },
                })

        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    // same GraphQL/Apollo wiring as production
                    ApolloServerModule.register({
                        type: ApolloServerType.Monolithic,
                        useServices: false,
                    }),
                    // real Postgres against the Testcontainers DB -- no hydration/
                    // resolvers/seeders, this focused app doesn't need them
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                    // CommandBus + @CommandHandler discovery
                    CqrsModule,
                ],
                providers: [
                    PingResolver,
                    CreateCvBlocksResolver,
                    CreateCvBlocksService,
                    CreateCvBlocksHandler,
                    UpdateCvBlocksResolver,
                    UpdateCvBlocksService,
                    UpdateCvBlocksHandler,
                    DeleteCvBlocksResolver,
                    DeleteCvBlocksService,
                    DeleteCvBlocksHandler,
                ],
            })
                .overrideGuard(KeycloakAuthGraphQLGuard)
                .useValue(fakeAuthGuard)
                .compile()

            app = moduleRef.createNestApplication()
            await app.init()

            entityManager = app.get<EntityManager>(
                getEntityManagerToken(POSTGRESQL_PRIMARY),
            )
        })

        afterAll(async () => {
            await app.close().catch(() => undefined)
        })

        afterEach(async () => {
            await entityManager.query(
                "TRUNCATE TABLE \"cv_blocks\", \"users\" RESTART IDENTITY CASCADE",
            )
            currentUser = null
        })

        /** Seed a bare user (only keycloakId is required). */
        const seedUser = async (keycloakId: string): Promise<UserEntity> =>
            entityManager.save(
                entityManager.create(UserEntity,
                    {
                        keycloakId,
                    }),
            )

        describe("createCvBlocks",
            () => {
                it("empty create → owned row, blocks/style default to empty, pdfCdnKey null",
                    async () => {
                        currentUser = await seedUser("kc-cv-blocks-create-empty")

                        const response = await createCvBlocks({
                        })

                        expect(response.status).toBe(200)
                        const body = response.body.data.createCvBlocks
                        expect(body.success).toBe(true)
                        expect(body.data.label).toBeNull()
                        expect(body.data.blocks).toEqual([])
                        expect(body.data.style).toEqual({
                        })
                        expect(body.data.pdfCdnKey).toBeNull()

                        // the row is REALLY there, owned by the caller
                        const row = await entityManager.findOneOrFail(CvBlocksEntity,
                            {
                                where: {
                                    id: body.data.id,
                                },
                            })
                        expect(row.userId).toBe(currentUser.id)
                        expect(row.blocks).toEqual([])
                        expect(row.style).toEqual({
                        })
                    })

                it("pre-filled create → label/blocks/style persist verbatim, owned by the caller",
                    async () => {
                        currentUser = await seedUser("kc-cv-blocks-create-filled")

                        const response = await createCvBlocks({
                            label: "Backend — Java",
                            blocks: [
                                {
                                    id: "b1",
                                    type: "summary",
                                    order: 0,
                                    items: [
                                        "Senior engineer",
                                    ],
                                },
                            ],
                            style: {
                                font: "Inter",
                                accent: "#000",
                            },
                        })

                        const body = response.body.data.createCvBlocks
                        expect(body.success).toBe(true)
                        expect(body.data.label).toBe("Backend — Java")
                        expect(body.data.blocks).toEqual([
                            {
                                id: "b1",
                                type: "summary",
                                order: 0,
                                items: [
                                    "Senior engineer",
                                ],
                            },
                        ])
                        expect(body.data.style).toEqual({
                            font: "Inter",
                            accent: "#000",
                        })

                        const row = await entityManager.findOneOrFail(CvBlocksEntity,
                            {
                                where: {
                                    id: body.data.id,
                                },
                            })
                        expect(row.userId).toBe(currentUser.id)
                        expect(row.label).toBe("Backend — Java")
                    })
            })

        describe("updateCvBlocks",
            () => {
                it("partial autosave → only provided fields change, pdfCdnKey is invalidated on ANY edit",
                    async () => {
                        currentUser = await seedUser("kc-cv-blocks-update-owner")
                        const seeded = await entityManager.save(
                            entityManager.create(CvBlocksEntity,
                                {
                                    user: {
                                        id: currentUser.id,
                                    },
                                    label: "Original name",
                                    blocks: [
                                        {
                                            id: "b1",
                                            type: "summary",
                                            order: 0,
                                            items: [
                                            ],
                                        },
                                    ],
                                    style: {
                                        font: "Inter",
                                    },
                                    // a previous export exists -- proves the update path nulls it
                                    pdfCdnKey: "cv-blocks/prev-export.pdf",
                                }),
                        )

                        const response = await updateCvBlocks({
                            id: seeded.id,
                            label: "Renamed CV",
                        })

                        const body = response.body.data.updateCvBlocks
                        expect(body.success).toBe(true)
                        expect(body.data.label).toBe("Renamed CV")
                        // untouched fields survive the partial write (label was the ONLY
                        // field sent)
                        expect(body.data.blocks).toEqual([
                            {
                                id: "b1",
                                type: "summary",
                                order: 0,
                                items: [
                                ],
                            },
                        ])
                        expect(body.data.style).toEqual({
                            font: "Inter",
                        })
                        // ANY edit invalidates the last compiled PDF
                        expect(body.data.pdfCdnKey).toBeNull()

                        const row = await entityManager.findOneOrFail(CvBlocksEntity,
                            {
                                where: {
                                    id: seeded.id,
                                },
                            })
                        expect(row.label).toBe("Renamed CV")
                        expect(row.pdfCdnKey).toBeNull()
                    })

                it("ownership: another user's document 404s as CV_DOCUMENT_NOT_FOUND_EXCEPTION — the row is left untouched",
                    async () => {
                        const owner = await seedUser("kc-cv-blocks-update-target-owner")
                        const seeded = await entityManager.save(
                            entityManager.create(CvBlocksEntity,
                                {
                                    user: {
                                        id: owner.id,
                                    },
                                    label: "Owner's CV",
                                    blocks: [
                                    ],
                                    style: {
                                    },
                                }),
                        )
                        // a DIFFERENT user is logged in and tries to edit it
                        currentUser = await seedUser("kc-cv-blocks-update-outsider")

                        const response = await updateCvBlocks({
                            id: seeded.id,
                            label: "Hijacked",
                        })

                        expect(response.status).toBe(200)
                        const body = response.body.data.updateCvBlocks
                        expect(body.success).toBe(false)
                        expect(body.error).toBe("CV_DOCUMENT_NOT_FOUND_EXCEPTION")
                        expect(body.data).toBeNull()

                        // the owner's row was never touched
                        const row = await entityManager.findOneOrFail(CvBlocksEntity,
                            {
                                where: {
                                    id: seeded.id,
                                },
                            })
                        expect(row.label).toBe("Owner's CV")
                    })
            })

        describe("deleteCvBlocks",
            () => {
                it("owner can delete — the row is actually gone",
                    async () => {
                        currentUser = await seedUser("kc-cv-blocks-delete-owner")
                        const seeded = await entityManager.save(
                            entityManager.create(CvBlocksEntity,
                                {
                                    user: {
                                        id: currentUser.id,
                                    },
                                    label: "To delete",
                                    blocks: [
                                    ],
                                    style: {
                                    },
                                }),
                        )

                        const response = await deleteCvBlocks({
                            id: seeded.id,
                        })

                        const body = response.body.data.deleteCvBlocks
                        expect(body.success).toBe(true)
                        expect(body.data.id).toBe(seeded.id)

                        const row = await entityManager.findOne(CvBlocksEntity,
                            {
                                where: {
                                    id: seeded.id,
                                },
                            })
                        expect(row).toBeNull()
                    })

                it("ownership: another user's document 404s as CV_DOCUMENT_NOT_FOUND_EXCEPTION — the row survives",
                    async () => {
                        const owner = await seedUser("kc-cv-blocks-delete-target-owner")
                        const seeded = await entityManager.save(
                            entityManager.create(CvBlocksEntity,
                                {
                                    user: {
                                        id: owner.id,
                                    },
                                    label: "Protected",
                                    blocks: [
                                    ],
                                    style: {
                                    },
                                }),
                        )
                        currentUser = await seedUser("kc-cv-blocks-delete-outsider")

                        const response = await deleteCvBlocks({
                            id: seeded.id,
                        })

                        const body = response.body.data.deleteCvBlocks
                        expect(body.success).toBe(false)
                        expect(body.error).toBe("CV_DOCUMENT_NOT_FOUND_EXCEPTION")

                        const count = await entityManager.count(CvBlocksEntity,
                            {
                                where: {
                                    id: seeded.id,
                                },
                            })
                        expect(count).toBe(1)
                    })
            })
    })
