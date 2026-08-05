// Side-effect imports: load the elasticsearch barrel first to dodge the cqrs
// barrel load-order cycle (see courses/course/course.handler.spec.ts, and
// consultants/consultants.handler.spec.ts for the same guard), then the
// bussiness barrel so its CQRS/elasticsearch base classes initialise before
// this file's own CQRS handlers pull `@modules/cqrs` (same guard
// `course-enroll.e2e-spec.ts` uses).
import "@modules/elasticsearch"
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
    CourseEntity,
    EnrollmentEntity,
    Locale,
    MilestoneEntity,
    MilestoneTaskEntity,
    PricingPhase,
    PrimaryPostgreSQLModule,
    UserEntity,
    UserMilestoneTaskAttemptEntity,
    UserMilestoneTaskEntity,
} from "@modules/databases"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakOptionalAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    ElasticsearchService,
} from "@modules/elasticsearch"
import {
    ConsultantContactGateService,
    CvVerificationService,
    UserSolvedChallengesProjectionService,
} from "@modules/bussiness"
import {
    ConsultantsHandler,
} from "@features/api/core/graphql/queries/headhuntings/consultants/consultants.handler"
import {
    ConsultantsResolver,
} from "@features/api/core/graphql/queries/headhuntings/consultants/consultants.resolver"
import {
    ConsultantsService,
} from "@features/api/core/graphql/queries/headhuntings/consultants/consultants.service"
import {
    HeadhuntingCompaniesHandler,
} from "@features/api/core/graphql/queries/headhuntings/headhunting-companies/headhunting-companies.handler"
import {
    HeadhuntingCompaniesResolver,
} from "@features/api/core/graphql/queries/headhuntings/headhunting-companies/headhunting-companies.resolver"
import {
    HeadhuntingCompaniesService,
} from "@features/api/core/graphql/queries/headhuntings/headhunting-companies/headhunting-companies.service"
import {
    TalentCandidatesResolver,
} from "@features/api/core/graphql/queries/users/talent-candidates/talent-candidates.resolver"
import {
    TalentCandidatesService,
} from "@features/api/core/graphql/queries/users/talent-candidates/talent-candidates.service"
import {
    MyJobReadinessResolver,
} from "@features/api/core/graphql/queries/users/job-readiness/my-job-readiness.resolver"
import {
    JobReadinessService,
} from "@features/api/core/graphql/queries/users/job-readiness/job-readiness.service"
import {
    TestHelpersModule,
} from "@tests/helpers"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** CV score a viewer needs to unlock a consultant's direct contact fields -- mirrors `CV_SCORE_UNLOCK_THRESHOLD` in `src/modules/bussiness/headhuntings/constants/index.ts` (a passed capstone scores 100, comfortably above it). */
const CV_SCORE_UNLOCK_THRESHOLD = 70

/**
 * e2e for four previously-untested headhuntings/job-readiness READS --
 * `consultants`, `headhuntingCompanies`, `talentCandidates`, `myJobReadiness`.
 *
 * MOCKED (genuinely external -- no Elasticsearch Testcontainer wired into this
 * harness, matching how every other spec here mocks a genuinely-external SDK):
 *  - `ElasticsearchService` -- `consultants`/`headhuntingCompanies` are ES-backed
 *    reads; `client.search` is stubbed to hand back hand-built documents so the
 *    REAL, Postgres-backed logic downstream of the ES hit -- the CV-score
 *    contact gate ({@link ConsultantContactGateService} /
 *    {@link CvVerificationService}) -- runs against a real database, never a
 *    mocked one.
 *  - `KeycloakOptionalAuthGraphQLGuard` / `KeycloakAuthGraphQLGuard` -- no
 *    Keycloak server here; overridden to stamp `request.user` with whichever
 *    fake user the test "logs in" as (same technique as
 *    `progress-query.e2e-spec.ts`). The REQUIRED guard (myJobReadiness) is
 *    what makes the auth-denied non-happy case possible: it genuinely rejects
 *    when no user is "logged in", the OPTIONAL guards never do.
 *
 * REAL: Postgres (Testcontainers), the full GraphQL/Apollo wiring, the CQRS
 * query handlers for `consultants`/`headhuntingCompanies`,
 * {@link ConsultantContactGateService}, {@link CvVerificationService},
 * {@link TalentCandidatesService}, {@link JobReadinessService}, and
 * {@link UserSolvedChallengesProjectionService} -- every one of these reads real
 * capstone/challenge rows off Postgres to derive its scores/gates.
 *
 * Requires Docker (Testcontainers spins up a real Postgres in `beforeAll`).
 */
describe("Headhuntings + job-readiness query reads (e2e)",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let elasticsearchSearch: jest.Mock

        /** The "logged in" user the overridden Keycloak guards stamp onto the request; `null` = anonymous. */
        let currentUser: UserEntity | null = null

        const stampUser = (context: ExecutionContext): void => {
            const gqlContext = GqlExecutionContext.create(context)
                .getContext<{ req: { user?: UserEntity } }>()
            if (currentUser) {
                gqlContext.req.user = currentUser
            }
        }

        /** Optional auth: never blocks -- anonymous viewers still get the (gated) data. */
        const fakeOptionalAuthGuard: CanActivate = {
            canActivate: (context: ExecutionContext): boolean => {
                stampUser(context)
                return true
            },
        }

        /** Required auth: blocks when nobody is "logged in" -- the auth-denied non-happy case. */
        const fakeRequiredAuthGuard: CanActivate = {
            canActivate: (context: ExecutionContext): boolean => {
                if (!currentUser) {
                    return false
                }
                stampUser(context)
                return true
            },
        }

        /** Read-only fixtures, seeded once in `beforeAll`. */
        let course: CourseEntity
        let capstoneTask: MilestoneTaskEntity

        const GRAPHQL_ENDPOINT = "/graphql"

        const CONSULTANTS_QUERY = `
            query Consultants($request: ConsultantsRequest!) {
                consultants(request: $request) {
                    success
                    data {
                        count
                        data {
                            id
                            fullName
                            contactUnlocked
                            cvScoreUnlockThreshold
                            email
                            phoneNumber
                            zaloNumber
                            linkedinUrl
                        }
                    }
                }
            }
        `
        const HEADHUNTING_COMPANIES_QUERY = `
            query HeadhuntingCompanies {
                headhuntingCompanies {
                    success
                    data {
                        id
                        title
                        consultants {
                            id
                            fullName
                            contactUnlocked
                            email
                        }
                    }
                }
            }
        `
        const TALENT_CANDIDATES_QUERY = `
            query TalentCandidates($courseId: ID!) {
                talentCandidates(courseId: $courseId) {
                    success
                    data {
                        user {
                            id
                        }
                        track {
                            courseId
                            depthScore
                            band
                            isQualified
                            capstoneScore
                        }
                        verificationLevel
                    }
                }
            }
        `
        const MY_JOB_READINESS_QUERY = `
            query MyJobReadiness {
                myJobReadiness {
                    success
                    data {
                        foundation {
                            codingPercentile
                            cvScore
                        }
                        tracks {
                            courseId
                            depthScore
                            band
                            isQualified
                            capstoneScore
                        }
                    }
                }
            }
        `

        beforeAll(async () => {
            const elasticsearchServiceMock = {
                indicateName: jest.fn(() => "mock-index"),
                client: {
                    search: jest.fn(),
                },
            }
            elasticsearchSearch = elasticsearchServiceMock.client.search

            const moduleRef = await Test.createTestingModule({
                imports: [
                    TestHelpersModule,
                    ApolloServerModule.register({
                        type: ApolloServerType.Monolithic,
                        useServices: false,
                    }),
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                    // QueryBus + @QueryHandler discovery for the ES-backed handlers
                    CqrsModule,
                ],
                providers: [
                    // consultants
                    ConsultantsResolver,
                    ConsultantsService,
                    ConsultantsHandler,
                    // headhuntingCompanies
                    HeadhuntingCompaniesResolver,
                    HeadhuntingCompaniesService,
                    HeadhuntingCompaniesHandler,
                    // talentCandidates
                    TalentCandidatesResolver,
                    TalentCandidatesService,
                    // myJobReadiness
                    MyJobReadinessResolver,
                    JobReadinessService,
                    // REAL -- Postgres-backed logic shared by every flow above
                    ConsultantContactGateService,
                    CvVerificationService,
                    UserSolvedChallengesProjectionService,
                    // mocked -- no Elasticsearch Testcontainer in this harness
                    {
                        provide: ElasticsearchService,
                        useValue: elasticsearchServiceMock,
                    },
                ],
            })
                .overrideGuard(KeycloakOptionalAuthGraphQLGuard)
                .useValue(fakeOptionalAuthGuard)
                .overrideGuard(KeycloakAuthGraphQLGuard)
                .useValue(fakeRequiredAuthGuard)
                .compile()

            app = moduleRef.createNestApplication()
            await app.init()

            entityManager = app.get<EntityManager>(
                getEntityManagerToken(POSTGRESQL_PRIMARY),
            )

            // --- read-only course/milestone fixture, seeded ONCE ---
            course = await entityManager.save(
                entityManager.create(CourseEntity,
                    {
                        title: "Fullstack Mastery",
                        displayId: "fullstack-mastery-headhuntings-e2e",
                        description: "e2e fixture course",
                        originalPrice: 999_000,
                        defaultLocale: Locale.En,
                    }),
            )
            const milestone = await entityManager.save(
                entityManager.create(MilestoneEntity,
                    {
                        defaultLocale: Locale.En,
                        course,
                    }),
            )
            capstoneTask = await entityManager.save(
                entityManager.create(MilestoneTaskEntity,
                    {
                        displayId: "capstone-task-headhuntings-e2e",
                        title: "Capstone task",
                        maxScore: 100,
                        sortIndex: 0,
                        defaultLocale: Locale.En,
                        milestone,
                    }),
            )
        })

        afterAll(async () => {
            await app.close().catch(() => undefined)
        })

        afterEach(async () => {
            await entityManager.query(
                "TRUNCATE TABLE \"users\", \"enrollments\" RESTART IDENTITY CASCADE",
            )
            currentUser = null
            jest.clearAllMocks()
        })

        /** Seed a bare user (only keycloakId is required). */
        const seedUser = async (keycloakId: string): Promise<UserEntity> =>
            entityManager.save(
                entityManager.create(UserEntity,
                    {
                        keycloakId,
                    }),
            )

        /** Seed a PAID enrollment for a user in the fixture course. */
        const seedPaidEnrollment = async (user: UserEntity): Promise<EnrollmentEntity> =>
            entityManager.save(
                entityManager.create(EnrollmentEntity,
                    {
                        user,
                        course,
                        pricingPhase: PricingPhase.Regular,
                        isEnrolled: true,
                    }),
            )

        /** Grant a user a PASSED capstone attempt -- the only signal that scores > 0 in `CvVerificationService`. */
        const grantPassedCapstone = async (enrollment: EnrollmentEntity): Promise<void> => {
            const userMilestoneTask = await entityManager.save(
                entityManager.create(UserMilestoneTaskEntity,
                    {
                        enrollment,
                        milestoneTask: capstoneTask,
                    }),
            )
            await entityManager.save(
                entityManager.create(UserMilestoneTaskAttemptEntity,
                    {
                        attemptNumber: 1,
                        passed: true,
                        score: 95,
                        shortFeedback: "great job",
                        defaultLocale: Locale.En,
                        userMilestoneTask,
                    }),
            )
        }

        const buildEsResponse = (rows: Array<Record<string, unknown>>): unknown => ({
            hits: {
                total: rows.length,
                hits: rows.map((row) => ({
                    _source: row,
                })),
            },
        })

        describe("consultants",
            () => {
                it("a viewer with a passed capstone (CV score 100) sees UNLOCKED contact fields",
                    async () => {
                        currentUser = await seedUser("kc-consultants-unlocked")
                        const enrollment = await seedPaidEnrollment(currentUser)
                        await grantPassedCapstone(enrollment)

                        elasticsearchSearch.mockResolvedValueOnce(
                            buildEsResponse([
                                {
                                    id: "con-1",
                                    fullName: "Alice Recruiter",
                                    companyId: "co-1",
                                    email: "alice@example.com",
                                    phoneNumber: "0900000001",
                                    zaloNumber: "0900000001",
                                    linkedinUrl: "https://linkedin.com/in/alice",
                                },
                            ]),
                        )

                        const response = await request(app.getHttpServer())
                            .post(GRAPHQL_ENDPOINT)
                            .send({
                                query: CONSULTANTS_QUERY,
                                variables: {
                                    request: {
                                        companyId: "co-1",
                                    },
                                },
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.consultants
                        expect(body.success).toBe(true)
                        expect(body.data.count).toBe(1)
                        const consultant = body.data.data[0]
                        expect(consultant.contactUnlocked).toBe(true)
                        expect(consultant.cvScoreUnlockThreshold).toBe(CV_SCORE_UNLOCK_THRESHOLD)
                        expect(consultant.email).toBe("alice@example.com")
                        expect(consultant.phoneNumber).toBe("0900000001")
                    })

                it("insufficient-entitlement: a viewer with NO passed capstone (CV score 0) gets contact fields nulled server-side",
                    async () => {
                        currentUser = await seedUser("kc-consultants-locked")
                        // enrolled, but never passed a capstone task -- CV score stays 0
                        await seedPaidEnrollment(currentUser)

                        elasticsearchSearch.mockResolvedValueOnce(
                            buildEsResponse([
                                {
                                    id: "con-2",
                                    fullName: "Bob Recruiter",
                                    companyId: "co-1",
                                    email: "bob@example.com",
                                    phoneNumber: "0900000002",
                                    zaloNumber: "0900000002",
                                    linkedinUrl: "https://linkedin.com/in/bob",
                                },
                            ]),
                        )

                        const response = await request(app.getHttpServer())
                            .post(GRAPHQL_ENDPOINT)
                            .send({
                                query: CONSULTANTS_QUERY,
                                variables: {
                                    request: {
                                        companyId: "co-1",
                                    },
                                },
                            })

                        const consultant = response.body.data.consultants.data.data[0]
                        expect(consultant.contactUnlocked).toBe(false)
                        // stripped server-side -- never sent over the wire, not merely hidden client-side
                        expect(consultant.email).toBeNull()
                        expect(consultant.phoneNumber).toBeNull()
                        expect(consultant.zaloNumber).toBeNull()
                        expect(consultant.linkedinUrl).toBeNull()
                    })
            })

        describe("headhuntingCompanies",
            () => {
                it("an anonymous viewer still gets the company list, with any embedded consultants gated LOCKED",
                    async () => {
                        // no currentUser set at all -- anonymous viewer, optional guard allows it through
                        elasticsearchSearch.mockResolvedValueOnce(
                            buildEsResponse([
                                {
                                    id: "co-1",
                                    title: "Pegasi",
                                    consultants: [
                                        {
                                            id: "con-embedded-1",
                                            fullName: "Carol Recruiter",
                                            companyId: "co-1",
                                            email: "carol@example.com",
                                        },
                                    ],
                                },
                            ]),
                        )

                        const response = await request(app.getHttpServer())
                            .post(GRAPHQL_ENDPOINT)
                            .send({
                                query: HEADHUNTING_COMPANIES_QUERY,
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.headhuntingCompanies
                        expect(body.success).toBe(true)
                        expect(body.data).toHaveLength(1)
                        expect(body.data[0].title).toBe("Pegasi")
                        const embeddedConsultant = body.data[0].consultants[0]
                        // anonymous viewer -> best CV score 0 -> gate applies to the embedded list too
                        expect(embeddedConsultant.contactUnlocked).toBe(false)
                        expect(embeddedConsultant.email).toBeNull()
                    })

                it("insufficient-entitlement: a low-scoring LOGGED-IN viewer still sees embedded consultants gated LOCKED",
                    async () => {
                        currentUser = await seedUser("kc-companies-locked")
                        await seedPaidEnrollment(currentUser)
                        // enrolled but no passed capstone -> CV score 0, same as anonymous

                        elasticsearchSearch.mockResolvedValueOnce(
                            buildEsResponse([
                                {
                                    id: "co-2",
                                    title: "Orion Talent",
                                    consultants: [
                                        {
                                            id: "con-embedded-2",
                                            fullName: "Dave Recruiter",
                                            companyId: "co-2",
                                            email: "dave@example.com",
                                        },
                                    ],
                                },
                            ]),
                        )

                        const response = await request(app.getHttpServer())
                            .post(GRAPHQL_ENDPOINT)
                            .send({
                                query: HEADHUNTING_COMPANIES_QUERY,
                            })

                        const embeddedConsultant = response.body.data.headhuntingCompanies
                            .data[0].consultants[0]
                        expect(embeddedConsultant.contactUnlocked).toBe(false)
                        expect(embeddedConsultant.email).toBeNull()
                    })
            })

        describe("talentCandidates",
            () => {
                it("ranks open-to-work candidates for ONE track by that track's REAL depthScore DESC",
                    async () => {
                        const strong = await seedUser("kc-talent-strong")
                        strong.openToWork = true
                        await entityManager.save(strong)
                        const strongEnrollment = await seedPaidEnrollment(strong)
                        await grantPassedCapstone(strongEnrollment)

                        const weak = await seedUser("kc-talent-weak")
                        weak.openToWork = true
                        await entityManager.save(weak)
                        // enrolled, open-to-work, but never touched the capstone
                        await seedPaidEnrollment(weak)

                        // a THIRD user is enrolled but NOT open-to-work -- must be excluded entirely
                        const hidden = await seedUser("kc-talent-hidden")
                        await seedPaidEnrollment(hidden)

                        const response = await request(app.getHttpServer())
                            .post(GRAPHQL_ENDPOINT)
                            .send({
                                query: TALENT_CANDIDATES_QUERY,
                                variables: {
                                    courseId: course.id,
                                },
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.talentCandidates
                        expect(body.success).toBe(true)
                        const candidates = body.data as Array<{
                            user: { id: string }
                            track: { depthScore: number | null, band: string, isQualified: boolean, capstoneScore: number | null }
                        }>
                        // exactly the two open-to-work candidates, never the hidden one
                        expect(candidates).toHaveLength(2)
                        expect(candidates.map((c) => c.user.id)).not.toContain(hidden.id)
                        // strongest depth (the capstone-passed candidate) ranks FIRST
                        expect(candidates[0].user.id).toBe(strong.id)
                        expect(candidates[0].track.capstoneScore).toBe(100)
                        expect(candidates[0].track.band).toBe("jobReady")
                        expect(candidates[0].track.isQualified).toBe(true)
                        expect(candidates[1].user.id).toBe(weak.id)
                        expect(candidates[1].track.capstoneScore).toBe(0)
                    })

                it("a track with zero open-to-work candidates returns an empty list, never throws",
                    async () => {
                        const notOpen = await seedUser("kc-talent-not-open")
                        // enrolled but openToWork stays false (the default)
                        await seedPaidEnrollment(notOpen)

                        const response = await request(app.getHttpServer())
                            .post(GRAPHQL_ENDPOINT)
                            .send({
                                query: TALENT_CANDIDATES_QUERY,
                                variables: {
                                    courseId: course.id,
                                },
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.talentCandidates
                        expect(body.success).toBe(true)
                        expect(body.data).toEqual([])
                    })
            })

        describe("myJobReadiness",
            () => {
                it("computes the viewer's portfolio from a REAL paid enrollment + passed capstone",
                    async () => {
                        currentUser = await seedUser("kc-job-readiness-happy")
                        const enrollment = await seedPaidEnrollment(currentUser)
                        await grantPassedCapstone(enrollment)

                        const response = await request(app.getHttpServer())
                            .post(GRAPHQL_ENDPOINT)
                            .send({
                                query: MY_JOB_READINESS_QUERY,
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.myJobReadiness
                        expect(body.success).toBe(true)
                        expect(body.data.tracks).toHaveLength(1)
                        const track = body.data.tracks[0]
                        expect(track.courseId).toBe(course.id)
                        // ONLY the capstone pillar is present (no interview/CV-per-course
                        // signal seeded) -> depth equals the capstone score itself
                        expect(track.capstoneScore).toBe(100)
                        expect(track.depthScore).toBe(100)
                        expect(track.band).toBe("jobReady")
                        expect(track.isQualified).toBe(true)
                        // global foundation: capstone-verified anywhere -> CV score 100
                        expect(body.data.foundation.cvScore).toBe(100)
                    })

                it("auth denied: an unauthenticated caller is rejected, no readiness data leaks",
                    async () => {
                        // currentUser stays null -- fakeRequiredAuthGuard denies the request
                        const response = await request(app.getHttpServer())
                            .post(GRAPHQL_ENDPOINT)
                            .send({
                                query: MY_JOB_READINESS_QUERY,
                            })

                        expect(response.body.errors).toBeDefined()
                        expect(response.body.data?.myJobReadiness ?? null).toBeNull()
                    })
            })
    })
