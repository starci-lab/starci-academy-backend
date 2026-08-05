import {
    Test,
} from "@nestjs/testing"
import type {
    INestApplication,
} from "@nestjs/common"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    EntityManager,
} from "typeorm"
import {
    HeadhuntingCompanyEntity,
} from "@modules/databases/postgresql/primary/entities/headhunting-company.entity"
import {
    JobPostingEntity,
} from "@modules/databases/postgresql/primary/entities/job-posting.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    JobApplyMethod,
} from "@modules/databases/postgresql/primary/enums/job-apply-method"
import {
    JobPostingSource,
} from "@modules/databases/postgresql/primary/enums/job-posting-source"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    PrimaryPostgreSQLModule,
} from "@modules/databases/postgresql/primary/primary.module"
import {
    HeadhuntingCompanyNotFoundException,
} from "@modules/platform/exceptions/errors/courses/headhunting-company-not-found"
import {
    JobPostingInvalidRequestException,
    JobPostingInvalidRequestReason,
} from "@modules/platform/exceptions/errors/job-postings/job-posting-invalid-request"
import {
    KeycloakJwksService,
} from "@modules/integrations/keycloak/jwks.service"
import {
    SessionService,
} from "@modules/platform/session/session.service"
import {
    CookieService,
} from "@modules/platform/cookie/cookie.service"
import {
    SubmitJobPostingResolver,
} from "@features/api/core/graphql/mutations/job-postings/submit-job-posting/submit-job-posting.resolver"
import type {
    SubmitJobPostingRequest,
} from "@features/api/core/graphql/mutations/job-postings/submit-job-posting/graphql-types/request"
import {
    TestHelpersModule,
} from "@tests/helpers/test-helpers.module"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** Minimal valid request body, spread + overridden per test. */
const baseRequest: SubmitJobPostingRequest = {
    title: "Senior Backend Engineer",
    description: "Build the core platform.",
    applyMethod: JobApplyMethod.ExternalUrl,
    applyUrl: "https://example.com/apply",
} as SubmitJobPostingRequest

/**
 * e2e for the public `submitJobPosting` mutation -- `.claude/canon/be/enforce/
 * authoring/testing.md` §2 names every write flow that commits state as
 * required e2e coverage; `SubmitJobPostingResolver` (the resolver IS the
 * write logic here -- there is no separate domain service) had zero coverage
 * above `submit-job-posting.resolver` unit-level mocks. Runs the real
 * transactional company-resolve-or-create + posting insert + unique-slug
 * generation against REAL Postgres (Testcontainers).
 *
 * REAL: Postgres (Testcontainers), `SubmitJobPostingResolver` (the mutation
 * under test) -- the resolver has no other dependencies (no event fan-out, no
 * external SDK, no other service), so nothing needs stubbing. The resolver's
 * `@UseGuards(KeycloakAuthGraphQLGuard)` HTTP-level auth is out of scope here
 * (covered by calling `execute` directly with an already-resolved user, same
 * as `rewards-redeem.e2e-spec.ts` / `flashcard-review.e2e-spec.ts` call their
 * services directly rather than going through HTTP).
 *
 * Requires Docker (Testcontainers spins up a real Postgres in `beforeAll`).
 */
describe("Public job-posting submission (e2e)",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let resolver: SubmitJobPostingResolver

        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    TestHelpersModule,
                    // real Postgres against the Testcontainers DB -- no hydration/
                    // resolvers/seeders, this focused app doesn't need them
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                ],
                providers: [
                    // REAL -- the transactional insert logic under test; the class
                    // is a plain `@Resolver()` provider, resolvable by Nest DI the
                    // same as any other injectable outside a GraphQLModule context
                    SubmitJobPostingResolver,
                    // guard deps -- the resolver's class-level
                    // `@UseGuards(KeycloakAuthGraphQLGuard)` makes Nest construct
                    // the guard at compile time, so its constructor deps must
                    // resolve. The guard never runs here (tests call `execute`
                    // directly with an already-resolved user), so bare no-op
                    // stubs suffice.
                    {
                        provide: KeycloakJwksService,
                        useValue: {
                        },
                    },
                    {
                        provide: SessionService,
                        useValue: {
                        },
                    },
                    {
                        provide: CookieService,
                        useValue: {
                        },
                    },
                ],
            }).compile()

            app = moduleRef.createNestApplication()
            await app.init()

            entityManager = app.get<EntityManager>(
                getEntityManagerToken(POSTGRESQL_PRIMARY),
            )
            resolver = app.get(SubmitJobPostingResolver)
        })

        afterAll(async () => {
            await app.close().catch(() => undefined)
        })

        afterEach(async () => {
            await entityManager.query(
                "TRUNCATE TABLE \"users\", \"job_postings\", \"headhunting_companies\" RESTART IDENTITY CASCADE",
            )
        })

        /** Seed a bare user (only keycloakId is required) to attribute a submission to. */
        const seedUser = async (keycloakId: string): Promise<UserEntity> =>
            entityManager.save(
                entityManager.create(UserEntity,
                    {
                        keycloakId,
                    }),
            )

        /** Seed a bare existing employer company. */
        const seedCompany = async (title: string): Promise<HeadhuntingCompanyEntity> =>
            entityManager.save(
                entityManager.create(HeadhuntingCompanyEntity,
                    {
                        title,
                        displayId: title.toLowerCase().replace(/\s+/g,
                            "-"),
                        orderIndex: 0,
                        sortIndex: 0,
                        defaultLocale: Locale.En,
                    }),
            )

        it("existing companyId → a REAL job_postings row is committed, source=Submitted, attributed to the caller",
            async () => {
                const user = await seedUser("kc-job-existing-company")
                const company = await seedCompany("Pegasi")

                // `execute` returns the new posting's UUID primary key
                // (`saved.id`), which the interceptor wraps as `data`.
                const postingId = await resolver.execute(
                    {
                        ...baseRequest,
                        companyId: company.id,
                    },
                    user,
                )

                const posting = await entityManager.findOneOrFail(JobPostingEntity,
                    {
                        where: {
                            id: postingId,
                        },
                    })
                expect(posting.title).toBe(baseRequest.title)
                expect(posting.source).toBe(JobPostingSource.Submitted)
                expect(posting.companyId).toBe(company.id)
                expect(posting.postedByUserId).toBe(user.id)
                expect(posting.displayId).toBe("senior-backend-engineer")
            })

        it("inline newCompany → a REAL headhunting_companies row is created (defaultLocale=Vi) alongside the posting",
            async () => {
                const user = await seedUser("kc-job-new-company")

                // `execute` returns the posting's UUID id (interceptor wraps it as `data`).
                const postingId = await resolver.execute(
                    {
                        ...baseRequest,
                        newCompany: {
                            title: "Fresh Startup Co",
                        },
                    },
                    user,
                )

                const posting = await entityManager.findOneOrFail(JobPostingEntity,
                    {
                        where: {
                            id: postingId,
                        },
                        relations: {
                            company: true,
                        },
                    })
                expect(posting.company.title).toBe("Fresh Startup Co")
                expect(posting.company.defaultLocale).toBe(Locale.Vi)

                const companyCount = await entityManager.count(HeadhuntingCompanyEntity)
                expect(companyCount).toBe(1)
            })

        it("neither companyId nor newCompany → throws MissingCompany and writes NOTHING (transactional rollback)",
            async () => {
                const user = await seedUser("kc-job-missing-company")

                await expect(
                    resolver.execute(
                        {
                            ...baseRequest,
                        },
                        user,
                    ),
                ).rejects.toMatchObject({
                    metadata: {
                        reason: JobPostingInvalidRequestReason.MissingCompany,
                    },
                })
                await expect(
                    resolver.execute(
                        {
                            ...baseRequest,
                        },
                        user,
                    ),
                ).rejects.toBeInstanceOf(JobPostingInvalidRequestException)

                expect(await entityManager.count(JobPostingEntity)).toBe(0)
                expect(await entityManager.count(HeadhuntingCompanyEntity)).toBe(0)
            })

        it("BOTH companyId and newCompany → throws AmbiguousCompany and writes NOTHING",
            async () => {
                const user = await seedUser("kc-job-ambiguous-company")
                const company = await seedCompany("Existing Co")

                await expect(
                    resolver.execute(
                        {
                            ...baseRequest,
                            companyId: company.id,
                            newCompany: {
                                title: "Also New Co",
                            },
                        },
                        user,
                    ),
                ).rejects.toMatchObject({
                    metadata: {
                        reason: JobPostingInvalidRequestReason.AmbiguousCompany,
                    },
                })

                expect(await entityManager.count(JobPostingEntity)).toBe(0)
                // the pre-existing seeded company must be the only row -- no orphan
                // extra company was created by the rejected attempt
                expect(await entityManager.count(HeadhuntingCompanyEntity)).toBe(1)
            })

        it("a companyId that does not exist throws HeadhuntingCompanyNotFoundException and writes NOTHING",
            async () => {
                const user = await seedUser("kc-job-company-not-found")

                await expect(
                    resolver.execute(
                        {
                            ...baseRequest,
                            companyId: "11111111-1111-4111-8111-111111111111",
                        },
                        user,
                    ),
                ).rejects.toBeInstanceOf(HeadhuntingCompanyNotFoundException)

                expect(await entityManager.count(JobPostingEntity)).toBe(0)
            })

        it("applyMethod=ExternalUrl without applyUrl throws MissingApplyUrl and writes NOTHING",
            async () => {
                const user = await seedUser("kc-job-missing-apply-url")
                const company = await seedCompany("Needs Url Co")

                await expect(
                    resolver.execute(
                        {
                            ...baseRequest,
                            companyId: company.id,
                            applyMethod: JobApplyMethod.ExternalUrl,
                            applyUrl: undefined,
                        },
                        user,
                    ),
                ).rejects.toMatchObject({
                    metadata: {
                        reason: JobPostingInvalidRequestReason.MissingApplyUrl,
                    },
                })

                expect(await entityManager.count(JobPostingEntity)).toBe(0)
            })

        it("applyMethod=Email without applyEmail throws MissingApplyEmail and writes NOTHING",
            async () => {
                const user = await seedUser("kc-job-missing-apply-email")
                const company = await seedCompany("Needs Email Co")

                await expect(
                    resolver.execute(
                        {
                            title: baseRequest.title,
                            description: baseRequest.description,
                            applyMethod: JobApplyMethod.Email,
                            companyId: company.id,
                        } as SubmitJobPostingRequest,
                        user,
                    ),
                ).rejects.toMatchObject({
                    metadata: {
                        reason: JobPostingInvalidRequestReason.MissingApplyEmail,
                    },
                })

                expect(await entityManager.count(JobPostingEntity)).toBe(0)
            })

        it("a title collision generates a DIFFERENT unique slug for the second posting rather than failing",
            async () => {
                const user = await seedUser("kc-job-slug-collision")
                const company = await seedCompany("Slug Co")

                // `execute` returns each posting's UUID id, not its slug.
                const firstId = await resolver.execute(
                    {
                        ...baseRequest,
                        companyId: company.id,
                    },
                    user,
                )
                const secondId = await resolver.execute(
                    {
                        ...baseRequest,
                        companyId: company.id,
                    },
                    user,
                )

                const first = await entityManager.findOneOrFail(JobPostingEntity,
                    {
                        where: {
                            id: firstId,
                        },
                    })
                const second = await entityManager.findOneOrFail(JobPostingEntity,
                    {
                        where: {
                            id: secondId,
                        },
                    })
                expect(first.displayId).toBe("senior-backend-engineer")
                expect(second.displayId).not.toBe(first.displayId)
                expect(second.displayId.startsWith("senior-backend-engineer-")).toBe(true)

                expect(await entityManager.count(JobPostingEntity)).toBe(2)
            })
    })
