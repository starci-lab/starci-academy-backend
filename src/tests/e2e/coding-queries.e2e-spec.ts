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
    CodingDifficulty,
    CodingDomain,
    CodingLanguage,
    CodingProblemEntity,
    CodingSolutionRevealEntity,
    CodingSubmissionEntity,
    CodingVerdict,
    Locale,
    PrimaryPostgreSQLModule,
    UserEntity,
} from "@modules/databases"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    CodingProblemService,
    CodingProgressService,
    CodingSubmissionService,
    DeviceService,
    EnqueueJudgeCodingSubmissionJobService,
    UserCodingProjectionService,
} from "@modules/bussiness"
import {
    CacheService,
} from "@modules/cache"
import {
    ElasticsearchService,
} from "@modules/elasticsearch"
import {
    CodingProblemsResolver,
} from "@features/api/core/graphql/queries/coding/coding-problems/coding-problems.resolver"
import {
    CodingProblemResolver,
} from "@features/api/core/graphql/queries/coding/coding-problem/coding-problem.resolver"
import {
    CodingProblemHintResolver,
} from "@features/api/core/graphql/queries/coding/coding-problem-hint/coding-problem-hint.resolver"
import {
    CodingProblemSuggestionsResolver,
} from "@features/api/core/graphql/queries/coding/coding-problem-suggestions/coding-problem-suggestions.resolver"
import {
    CodingProblemSuggestionsService,
} from "@features/api/core/graphql/queries/coding/coding-problem-suggestions/coding-problem-suggestions.service"
import {
    CodingProblemSuggestionsHandler,
} from "@features/api/core/graphql/queries/coding/coding-problem-suggestions/coding-problem-suggestions.handler"
import {
    MyCodingProgressResolver,
} from "@features/api/core/graphql/queries/coding/my-coding-progress/my-coding-progress.resolver"
import {
    MyCodingSubmissionsResolver,
} from "@features/api/core/graphql/queries/coding/my-coding-submissions/my-coding-submissions.resolver"
import {
    CodingLeaderboardResolver,
} from "@features/api/core/graphql/queries/coding/coding-leaderboard/coding-leaderboard.resolver"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * e2e for the coding-practice READ surface -- `codingProblems`, `codingProblem`,
 * `codingProblemHint`, `codingProblemSuggestions`, `myCodingProgress`,
 * `myCodingSubmissions`, `codingLeaderboard`. None of these queries had e2e
 * coverage before this file (the sibling `coding-submission.e2e-spec.ts` only
 * covers the `submitCodingSolution` / `revealCodingSolution` MUTATIONS).
 *
 * MOCKED (no external infra in this harness):
 *  - `ElasticsearchService` -- no ES container available; `codingProblems` /
 *    `codingProblem` / `codingProblemHint` / `codingProblemSuggestions` all read
 *    from ES exclusively (never Postgres), so the client is stubbed at the exact
 *    surface (`client.search` / `client.get` / `indicateName`) the unit specs
 *    (`coding-problem.service.spec.ts`) already program -- the real GraphQL +
 *    CQRS + service wiring around it is what's under test here, not ES itself.
 *  - `CacheService` -- real class talks to Redis; stubbed to always MISS so
 *    `myCodingProgress` always exercises the real Postgres compute path.
 *  - `EnqueueJudgeCodingSubmissionJobService` / `DeviceService` -- required by
 *    `CodingSubmissionService`'s constructor but never invoked by `listMine`
 *    (the read path `myCodingSubmissions` uses); stubbed only to satisfy DI.
 *  - `KeycloakAuthGraphQLGuard` -- no Keycloak server here; overridden to stamp
 *    `request.user` with whichever fake user the test "logs in" as.
 *
 * REAL: Postgres (Testcontainers), the full GraphQL/Apollo wiring, the CQRS
 * query bus + `CodingProblemSuggestionsHandler` discovery, `CodingProblemService`
 * / `CodingProgressService` / `CodingSubmissionService.listMine` /
 * `UserCodingProjectionService` (their SQL runs for real against the seeded rows).
 *
 * Requires Docker (Testcontainers spins up a real Postgres in `beforeAll`).
 */
describe("Coding-practice read queries (e2e)",
    () => {
        let app: INestApplication
        let entityManager: EntityManager

        /** The "logged in" user the overridden Keycloak guard stamps onto the request. */
        let currentUser: UserEntity | null = null

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

        /** Minimal stand-in for the ES client surface these queries use. */
        const elasticsearchClientMock = {
            search: jest.fn(),
            get: jest.fn(),
        }
        const elasticsearchServiceMock = {
            indicateName: jest.fn(() => "coding-problems-en"),
            client: elasticsearchClientMock,
        }
        // CodingProgressService's only cache layer -- always miss, so myCodingProgress
        // always exercises the real Postgres compute path
        const cacheServiceMock = {
            get: jest.fn().mockResolvedValue(undefined),
            set: jest.fn().mockResolvedValue(undefined),
            del: jest.fn().mockResolvedValue(undefined),
        }
        const enqueueJudgeCodingSubmissionJobMock = {
            enqueue: jest.fn(),
        }
        const deviceServiceMock = {
            recordDevice: jest.fn(),
        }

        /** Read-only problem fixtures, seeded once in `beforeAll`. */
        let problemTwoSum: CodingProblemEntity
        let problemReverse: CodingProblemEntity
        let problemBinary: CodingProblemEntity
        let problemGraph: CodingProblemEntity

        const GRAPHQL_ENDPOINT = "/graphql"

        const post = (query: string, variables: Record<string, unknown> = {
        }) =>
            request(app.getHttpServer())
                .post(GRAPHQL_ENDPOINT)
                .send({
                    query,
                    variables,
                })

        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    ApolloServerModule.register({
                        type: ApolloServerType.Monolithic,
                        useServices: false,
                    }),
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                    // QueryBus + @QueryHandler discovery for CodingProblemSuggestionsHandler
                    CqrsModule,
                ],
                providers: [
                    CodingProblemsResolver,
                    CodingProblemResolver,
                    CodingProblemHintResolver,
                    CodingProblemSuggestionsResolver,
                    CodingProblemSuggestionsService,
                    CodingProblemSuggestionsHandler,
                    MyCodingProgressResolver,
                    MyCodingSubmissionsResolver,
                    CodingLeaderboardResolver,
                    // REAL -- the services under test
                    CodingProblemService,
                    CodingProgressService,
                    CodingSubmissionService,
                    UserCodingProjectionService,
                    {
                        provide: ElasticsearchService,
                        useValue: elasticsearchServiceMock,
                    },
                    {
                        provide: CacheService,
                        useValue: cacheServiceMock,
                    },
                    {
                        provide: EnqueueJudgeCodingSubmissionJobService,
                        useValue: enqueueJudgeCodingSubmissionJobMock,
                    },
                    {
                        provide: DeviceService,
                        useValue: deviceServiceMock,
                    },
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

            // seed a small read-only pool of REAL coding problems (Postgres side --
            // ES is mocked for the catalog reads, but myCodingProgress/
            // myCodingSubmissions/codingLeaderboard all join against real
            // coding_problems rows via coding_submissions.coding_problem_id)
            const makeProblem = (slug: string, difficulty: CodingDifficulty): Promise<CodingProblemEntity> =>
                entityManager.save(
                    entityManager.create(CodingProblemEntity,
                        {
                            slug,
                            difficulty,
                            domain: CodingDomain.Arrays,
                            title: `Problem ${slug}`,
                            statement: "e2e fixture statement",
                            enabled: true,
                        }),
                )
            problemTwoSum = await makeProblem("two-sum",
                CodingDifficulty.Easy)
            problemReverse = await makeProblem("reverse-string",
                CodingDifficulty.Easy)
            problemBinary = await makeProblem("binary-search",
                CodingDifficulty.Medium)
            problemGraph = await makeProblem("graph-bfs",
                CodingDifficulty.Hard)
        })

        afterAll(async () => {
            // the "two-sum"/"reverse-string"/... fixtures are read-only WITHIN this
            // suite, but the Testcontainers Postgres is shared across the whole e2e
            // run (see e2e/setup.ts) -- leaving them behind collides with
            // coding-submission.e2e-spec.ts's own same-slug "two-sum" fixture
            // (duplicate-key on the unique slug) whenever that file runs after this
            // one. CASCADE also clears coding_problem_solutions.
            await entityManager.query(
                "TRUNCATE TABLE \"coding_problems\" RESTART IDENTITY CASCADE",
            ).catch(() => undefined)
            await app.close().catch(() => undefined)
        })

        afterEach(async () => {
            // problems (seeded in beforeAll) are read-only across the whole suite --
            // only per-test user/submission/reveal/projection state is reset
            await entityManager.query(
                "TRUNCATE TABLE \"users\", \"coding_submissions\", \"coding_solution_reveals\", "
                + "\"user_coding_projections\" RESTART IDENTITY CASCADE",
            )
            currentUser = null
            jest.clearAllMocks()
            cacheServiceMock.get.mockResolvedValue(undefined)
            cacheServiceMock.set.mockResolvedValue(undefined)
            cacheServiceMock.del.mockResolvedValue(undefined)
        })

        /** Seed a bare user (only keycloakId is required). */
        const seedUser = async (
            keycloakId: string,
            overrides: Partial<UserEntity> = {
            },
        ): Promise<UserEntity> =>
            entityManager.save(
                entityManager.create(UserEntity,
                    {
                        keycloakId,
                        ...overrides,
                    }),
            )

        describe("codingProblems",
            () => {
                const QUERY = `
                    query CodingProblems($request: CodingProblemsRequest!) {
                        codingProblems(request: $request) {
                            success
                            message
                            error
                            data {
                                problems { id slug title }
                                total
                            }
                        }
                    }
                `

                it("returns the page + total straight from the (mocked) ES catalog index",
                    async () => {
                        currentUser = await seedUser("kc-coding-problems-list")
                        elasticsearchClientMock.search.mockResolvedValueOnce({
                            hits: {
                                hits: [
                                    {
                                        _source: {
                                            id: problemTwoSum.id,
                                            slug: problemTwoSum.slug,
                                            title: problemTwoSum.title,
                                        },
                                    },
                                    {
                                        _source: {
                                            id: problemReverse.id,
                                            slug: problemReverse.slug,
                                            title: problemReverse.title,
                                        },
                                    },
                                ],
                                total: {
                                    value: 2,
                                },
                            },
                        })

                        const response = await post(QUERY,
                            {
                                request: {
                                },
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.codingProblems
                        expect(body.success).toBe(true)
                        expect(body.data.problems).toHaveLength(2)
                        expect(body.data.total).toBe(2)
                        expect(elasticsearchServiceMock.indicateName).toHaveBeenCalledWith({
                            entity: CodingProblemEntity.name,
                            locale: Locale.En,
                        })
                    })

                it("unauthenticated caller is BLOCKED before the (mocked) ES client is ever touched",
                    async () => {
                        // currentUser stays null -- the overridden guard denies
                        const response = await post(QUERY,
                            {
                                request: {
                                },
                            })

                        expect(response.body.data).toBeNull()
                        expect(response.body.errors).toBeDefined()
                        expect(elasticsearchClientMock.search).not.toHaveBeenCalled()
                    })
            })

        describe("codingProblem",
            () => {
                const QUERY = `
                    query CodingProblem($request: CodingProblemRequest!) {
                        codingProblem(request: $request) {
                            success
                            message
                            error
                            data { id slug title difficulty }
                        }
                    }
                `

                it("returns the pre-localized ES document for an enabled slug",
                    async () => {
                        currentUser = await seedUser("kc-coding-problem-detail")
                        elasticsearchClientMock.search.mockResolvedValueOnce({
                            hits: {
                                hits: [
                                    {
                                        _source: {
                                            id: problemTwoSum.id,
                                            slug: problemTwoSum.slug,
                                            title: problemTwoSum.title,
                                            difficulty: problemTwoSum.difficulty,
                                        },
                                    },
                                ],
                            },
                        })

                        const response = await post(QUERY,
                            {
                                request: {
                                    slug: problemTwoSum.slug,
                                },
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.codingProblem
                        expect(body.success).toBe(true)
                        expect(body.data.slug).toBe(problemTwoSum.slug)
                        expect(body.data.title).toBe(problemTwoSum.title)
                    })

                it("unknown/disabled slug (no ES hit) → CodingProblemNotFoundException",
                    async () => {
                        currentUser = await seedUser("kc-coding-problem-missing")
                        elasticsearchClientMock.search.mockResolvedValueOnce({
                            hits: {
                                hits: [],
                            },
                        })

                        const response = await post(QUERY,
                            {
                                request: {
                                    slug: "does-not-exist",
                                },
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.codingProblem
                        expect(body.success).toBe(false)
                        expect(body.error).toBe("CODING_PROBLEM_NOT_FOUND_EXCEPTION")
                        expect(body.data).toBeNull()
                    })
            })

        describe("codingProblemHint",
            () => {
                const QUERY = `
                    query CodingProblemHint($request: CodingProblemHintRequest!) {
                        codingProblemHint(request: $request) {
                            success
                            message
                            error
                            data { slug hint }
                        }
                    }
                `

                it("returns the localized hint document from (mocked) ES",
                    async () => {
                        currentUser = await seedUser("kc-coding-hint")
                        elasticsearchClientMock.get.mockResolvedValueOnce({
                            _source: {
                                slug: problemTwoSum.slug,
                                hint: "use a hash map for O(n)",
                            },
                        })

                        const response = await post(QUERY,
                            {
                                request: {
                                    slug: problemTwoSum.slug,
                                },
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.codingProblemHint
                        expect(body.success).toBe(true)
                        expect(body.data).toEqual({
                            slug: problemTwoSum.slug,
                            hint: "use a hash map for O(n)",
                        })
                    })

                it("unauthenticated caller is BLOCKED before the (mocked) ES client is ever touched",
                    async () => {
                        const response = await post(QUERY,
                            {
                                request: {
                                    slug: problemTwoSum.slug,
                                },
                            })

                        expect(response.body.data).toBeNull()
                        expect(response.body.errors).toBeDefined()
                        expect(elasticsearchClientMock.get).not.toHaveBeenCalled()
                    })
            })

        describe("codingProblemSuggestions",
            () => {
                const QUERY = `
                    query CodingProblemSuggestions($request: SuggestionsRequest!) {
                        codingProblemSuggestions(request: $request) {
                            success
                            message
                            error
                            data { data { id label } }
                        }
                    }
                `

                it("runs the ES completion suggester and maps options to { id, label }",
                    async () => {
                        elasticsearchClientMock.search.mockResolvedValueOnce({
                            suggest: {
                                items: [
                                    {
                                        options: [
                                            {
                                                text: "Two Sum",
                                                _id: problemTwoSum.id,
                                            },
                                        ],
                                    },
                                ],
                            },
                        })

                        const response = await post(QUERY,
                            {
                                request: {
                                    query: "tw",
                                },
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.codingProblemSuggestions
                        expect(body.success).toBe(true)
                        expect(body.data.data).toEqual([
                            {
                                id: problemTwoSum.id,
                                label: "Two Sum",
                            },
                        ])
                    })

                it("a blank prefix short-circuits to an empty list — ES is never called",
                    async () => {
                        const response = await post(QUERY,
                            {
                                request: {
                                    query: "   ",
                                },
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.codingProblemSuggestions
                        expect(body.success).toBe(true)
                        expect(body.data.data).toEqual([])
                        expect(elasticsearchClientMock.search).not.toHaveBeenCalled()
                    })
            })

        describe("myCodingProgress",
            () => {
                const QUERY = `
                    query MyCodingProgress {
                        myCodingProgress {
                            success
                            message
                            error
                            data {
                                solvedProblemIds
                                attemptedProblemIds
                                revealedProblemIds
                                totalPoints
                            }
                        }
                    }
                `

                it("computes solved/attempted/revealed + points from REAL Postgres rows (cache always misses)",
                    async () => {
                        currentUser = await seedUser("kc-coding-progress",
                            {
                                coinBalance: 42,
                            })
                        // solved: one Accepted submission for two-sum
                        await entityManager.save(
                            entityManager.create(CodingSubmissionEntity,
                                {
                                    user: currentUser,
                                    problem: problemTwoSum,
                                    language: CodingLanguage.Python,
                                    sourceCode: "def two_sum(): ...",
                                    verdict: CodingVerdict.Accepted,
                                }),
                        )
                        // attempted (not solved): a Pending submission for reverse-string
                        await entityManager.save(
                            entityManager.create(CodingSubmissionEntity,
                                {
                                    user: currentUser,
                                    problem: problemReverse,
                                    language: CodingLanguage.Python,
                                    sourceCode: "def reverse(): ...",
                                    verdict: CodingVerdict.Pending,
                                }),
                        )
                        // revealed: the reference solution for binary-search was peeked
                        await entityManager.save(
                            entityManager.create(CodingSolutionRevealEntity,
                                {
                                    user: currentUser,
                                    problem: problemBinary,
                                }),
                        )

                        const response = await post(QUERY)

                        expect(response.status).toBe(200)
                        const body = response.body.data.myCodingProgress
                        expect(body.success).toBe(true)
                        expect(body.data.solvedProblemIds).toEqual([
                            problemTwoSum.id,
                        ])
                        expect(body.data.attemptedProblemIds.sort()).toEqual(
                            [
                                problemTwoSum.id,
                                problemReverse.id,
                            ].sort(),
                        )
                        expect(body.data.revealedProblemIds).toEqual([
                            problemBinary.id,
                        ])
                        expect(body.data.totalPoints).toBe(42)
                        // proves the real compute path ran (cache miss then write-back)
                        expect(cacheServiceMock.set).toHaveBeenCalled()
                    })

                it("unauthenticated caller is BLOCKED — no Postgres query for progress ever runs",
                    async () => {
                        const response = await post(QUERY)

                        expect(response.body.data).toBeNull()
                        expect(response.body.errors).toBeDefined()
                    })
            })

        describe("myCodingSubmissions",
            () => {
                const QUERY = `
                    query MyCodingSubmissions($request: MyCodingSubmissionsRequest!) {
                        myCodingSubmissions(request: $request) {
                            success
                            message
                            error
                            data {
                                submissions { id verdict language }
                                total
                            }
                        }
                    }
                `

                it("pages the caller's own submissions for one problem, newest first, from REAL Postgres",
                    async () => {
                        currentUser = await seedUser("kc-coding-my-submissions")
                        const first = await entityManager.save(
                            entityManager.create(CodingSubmissionEntity,
                                {
                                    user: currentUser,
                                    problem: problemTwoSum,
                                    language: CodingLanguage.Python,
                                    sourceCode: "attempt 1",
                                    verdict: CodingVerdict.WrongAnswer,
                                }),
                        )
                        const second = await entityManager.save(
                            entityManager.create(CodingSubmissionEntity,
                                {
                                    user: currentUser,
                                    problem: problemTwoSum,
                                    language: CodingLanguage.Python,
                                    sourceCode: "attempt 2",
                                    verdict: CodingVerdict.Accepted,
                                }),
                        )

                        const response = await post(QUERY,
                            {
                                request: {
                                    slug: problemTwoSum.slug,
                                },
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.myCodingSubmissions
                        expect(body.success).toBe(true)
                        expect(body.data.total).toBe(2)
                        expect(body.data.submissions).toHaveLength(2)
                        // newest first
                        expect(body.data.submissions[0].id).toBe(second.id)
                        expect(body.data.submissions[1].id).toBe(first.id)
                    })

                it("unknown/disabled problem slug → CodingProblemNotFoundException",
                    async () => {
                        currentUser = await seedUser("kc-coding-my-submissions-missing")

                        const response = await post(QUERY,
                            {
                                request: {
                                    slug: "does-not-exist",
                                },
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.myCodingSubmissions
                        expect(body.success).toBe(false)
                        expect(body.error).toBe("CODING_PROBLEM_NOT_FOUND_EXCEPTION")
                    })
            })

        describe("codingLeaderboard",
            () => {
                const QUERY = `
                    query CodingLeaderboard($request: CodingLeaderboardRequest!) {
                        codingLeaderboard(request: $request) {
                            success
                            message
                            error
                            data { userId username solvedCount }
                        }
                    }
                `

                it("ranks users by distinct solved-problem count off the REAL projection table",
                    async () => {
                        currentUser = await seedUser("kc-coding-leaderboard-viewer")
                        const userA = await seedUser("kc-coding-leaderboard-a",
                            {
                                username: "top-solver",
                            })
                        const userB = await seedUser("kc-coding-leaderboard-b",
                            {
                                username: "runner-up",
                            })
                        // userA solves 3 distinct problems, userB solves 1
                        const solveAll = async (user: UserEntity, problems: Array<CodingProblemEntity>) => {
                            for (const problem of problems) {
                                await entityManager.save(
                                    entityManager.create(CodingSubmissionEntity,
                                        {
                                            user,
                                            problem,
                                            language: CodingLanguage.Python,
                                            sourceCode: "solved",
                                            verdict: CodingVerdict.Accepted,
                                        }),
                                )
                            }
                        }
                        await solveAll(userA,
                            [
                                problemTwoSum,
                                problemReverse,
                                problemBinary,
                            ])
                        await solveAll(userB,
                            [
                                problemGraph,
                            ])
                        const userCodingProjectionService = app.get(UserCodingProjectionService)
                        await userCodingProjectionService.recompute({
                            userId: userA.id,
                        })
                        await userCodingProjectionService.recompute({
                            userId: userB.id,
                        })

                        const response = await post(QUERY,
                            {
                                request: {
                                },
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.codingLeaderboard
                        expect(body.success).toBe(true)
                        expect(body.data).toEqual([
                            {
                                userId: userA.id,
                                username: "top-solver",
                                solvedCount: 3,
                            },
                            {
                                userId: userB.id,
                                username: "runner-up",
                                solvedCount: 1,
                            },
                        ])
                        // the exact-length array already proves the viewer (0 solves) and
                        // any zero-solvedCount projection row are filtered out, not just
                        // sorted last
                        expect(body.data).toHaveLength(2)
                    })

                it("unauthenticated caller is BLOCKED — the ranked read never runs",
                    async () => {
                        const response = await post(QUERY,
                            {
                                request: {
                                },
                            })

                        expect(response.body.data).toBeNull()
                        expect(response.body.errors).toBeDefined()
                    })
            })
    })
