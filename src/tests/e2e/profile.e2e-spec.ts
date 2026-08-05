// Load the bussiness barrel first so its CQRS/elasticsearch base classes are
// initialised before ConnectGithubAccountHandler pulls `@modules/cqrs` -- dodges
// a load-order "Class extends value undefined" cycle (same gotcha documented in
// connect-github-account.handler.spec.ts).
import "@modules/bussiness"
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
    KpiKey,
    KpiWeeklyRewardFloorEntity,
    PrimaryPostgreSQLModule,
    UserEntity,
    WorkMode,
} from "@modules/databases"
import {
    GithubUserNotFoundException,
} from "@modules/exceptions"
import {
    MountStorageService,
} from "@modules/filesystem"
import {
    KpiRewardService,
    UserService,
    UserStatsProjectionService,
} from "@modules/bussiness"
import {
    KPI_TARGET_MAX,
} from "@modules/bussiness"
import {
    KeycloakJwksService,
} from "@modules/keycloak"
import {
    SessionService,
} from "@modules/session"
import {
    CookieService,
} from "@modules/cookie"
import {
    UpdateProfileResolver,
} from "@features/api/core/graphql/mutations/profile/update-profile/update-profile.resolver"
import {
    SetKpiTargetResolver,
} from "@features/api/core/graphql/mutations/profile/set-kpi-target/set-kpi-target.resolver"
import {
    ConnectGithubAccountCommand,
} from "@features/api/core/graphql/mutations/authentication/connect-github-account/connect-github-account.command"
import {
    ConnectGithubAccountHandler,
} from "@features/api/core/graphql/mutations/authentication/connect-github-account/connect-github-account.handler"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** Shared GitHub `getByUsername` mock the faked Octokit instance exposes. */
const getByUsernameMock = jest.fn()

// Replace the Octokit client with a stub whose REST surface is the shared mock
// -- the only genuinely external dependency `connectGithubAccount` has (the
// handler does `new Octokit(...).rest.users.getByUsername(...)` directly, no
// DI seam). Mirrors `connect-github-account.handler.spec.ts`'s own stub.
jest.mock("octokit",
    () => ({
        Octokit: jest.fn().mockImplementation(() => ({
            rest: {
                users: {
                    getByUsername: getByUsernameMock,
                },
            },
        })),
    }))

/**
 * e2e for the profile-write mutations -- `.claude/canon/be/enforce/authoring/testing.md`
 * §2 coverage rule: every mutation that commits a row a user later sees earns
 * an e2e. Covers `updateProfile`, `setKpiTarget` (round-3a: delegates to
 * {@link KpiRewardService.setTarget}), and `connectGithubAccount` -- the one
 * state-committing mutation in the "connect/disconnect integrations" family
 * (there is no synchronous `disconnectGithubAccount` mutation to pair it with;
 * disconnect only exists as the async `revoke-github` BullMQ worker -- see
 * "uncovered" in the handoff).
 *
 * Runs the resolvers' `execute()` directly (bypassing GraphQL/HTTP -- same
 * service-level style as `rewards-redeem.e2e-spec.ts`) against REAL Postgres
 * (Testcontainers), so the partial-update semantics, the atomic `jsonb_set`
 * clamp+floor write, and the GitHub-verified persist are all exercised against
 * the real schema, not a mocked `EntityManager`.
 *
 * MOCKED (external / side-effect-only, not what this spec asserts on):
 *  - `UserService` -- only `invalidateProfileLocked` is called by
 *    `updateProfile`; the real implementation needs a live Redis-backed
 *    `CacheService`, which is out of scope here. Stubbed to a spy so the call
 *    itself is still asserted.
 *  - `MountStorageService` -- real class reads mounted secrets on
 *    `onModuleInit`; stubbed to hand back a fixed `githubAccessToken`, the
 *    only field `ConnectGithubAccountHandler` reads off it.
 *  - the `octokit` SDK -- never hits the real GitHub API.
 *
 * REAL: Postgres (Testcontainers), `UpdateProfileResolver`, `SetKpiTargetResolver`
 * (and the `KpiRewardService` it delegates to), `UserStatsProjectionService`
 * (a KpiRewardService constructor dependency, unused by the `setTarget` path
 * itself but real since it costs nothing -- only needs the entity manager),
 * and `ConnectGithubAccountHandler`.
 *
 * Requires Docker (Testcontainers spins up a real Postgres in `beforeAll`).
 */
describe("Profile-write mutations (e2e)",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let updateProfileResolver: UpdateProfileResolver
        let setKpiTargetResolver: SetKpiTargetResolver
        let connectGithubAccountHandler: ConnectGithubAccountHandler
        let invalidateProfileLocked: jest.Mock

        beforeAll(async () => {
            invalidateProfileLocked = jest.fn()

            const moduleRef = await Test.createTestingModule({
                imports: [
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                ],
                providers: [
                    // REAL -- the resolvers under test
                    UpdateProfileResolver,
                    SetKpiTargetResolver,
                    // REAL -- setKpiTarget's delegate + its own (unused-by-setTarget) dependency
                    KpiRewardService,
                    UserStatsProjectionService,
                    // REAL -- the CQRS handler connectGithubAccount ultimately runs
                    ConnectGithubAccountHandler,
                    // mocked -- only invalidateProfileLocked is exercised; the real
                    // implementation needs a live CacheService (Redis)
                    {
                        provide: UserService,
                        useValue: {
                            invalidateProfileLocked,
                        },
                    },
                    // mocked -- only the access-token field the handler reads
                    {
                        provide: MountStorageService,
                        useValue: {
                            githubAccessToken: "ghp_test_token",
                        },
                    },
                    // guard deps -- `UpdateProfileResolver` / `SetKpiTargetResolver`
                    // carry `@UseGuards(KeycloakAuthGraphQLGuard)`, so Nest constructs
                    // the guard as an enhancer at `app.init()` even though these tests
                    // invoke `execute()` directly; its constructor deps must resolve
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
            updateProfileResolver = app.get(UpdateProfileResolver)
            setKpiTargetResolver = app.get(SetKpiTargetResolver)
            connectGithubAccountHandler = app.get(ConnectGithubAccountHandler)
        })

        afterAll(async () => {
            await app.close().catch(() => undefined)
        })

        afterEach(async () => {
            await entityManager.query(
                "TRUNCATE TABLE \"kpi_weekly_reward_floors\", \"users\" RESTART IDENTITY CASCADE",
            )
            jest.clearAllMocks()
        })

        /** Seed a minimal user row. */
        const seedUser = async (
            keycloakId: string,
            overrides: Partial<UserEntity> = {
            },
        ): Promise<UserEntity> =>
            entityManager.save(
                entityManager.create(UserEntity,
                    {
                        keycloakId,
                        username: keycloakId,
                        ...overrides,
                    }),
            )

        describe("updateProfile",
            () => {
                it("writes only the fields present in the request (partial update)",
                    async () => {
                        const user = await seedUser("kc-update-partial",
                            {
                                displayName: "Old Name",
                                bio: "Old bio",
                            })

                        const updated = await updateProfileResolver.execute(
                            {
                                displayName: "  New Name  ",
                            },
                            user,
                        )

                        // trimmed on write
                        expect(updated.displayName).toBe("New Name")
                        // bio was never sent -> untouched
                        expect(updated.bio).toBe("Old bio")

                        const reloaded = await entityManager.findOneByOrFail(UserEntity,
                            {
                                id: user.id,
                            })
                        expect(reloaded.displayName).toBe("New Name")
                        expect(reloaded.bio).toBe("Old bio")
                    })

                it("an explicit null clears a field the client previously set",
                    async () => {
                        const user = await seedUser("kc-update-clear",
                            {
                                roleTitle: "Backend Engineer",
                            })

                        const updated = await updateProfileResolver.execute(
                            {
                                roleTitle: null,
                            },
                            user,
                        )

                        expect(updated.roleTitle).toBeNull()

                        const reloaded = await entityManager.findOneByOrFail(UserEntity,
                            {
                                id: user.id,
                            })
                        expect(reloaded.roleTitle).toBeNull()
                    })

                it("toggling profileLocked persists the column and invalidates the Redis-cached flag",
                    async () => {
                        const user = await seedUser("kc-update-lock",
                            {
                                profileLocked: false,
                            })

                        await updateProfileResolver.execute(
                            {
                                profileLocked: true,
                            },
                            user,
                        )

                        const reloaded = await entityManager.findOneByOrFail(UserEntity,
                            {
                                id: user.id,
                            })
                        expect(reloaded.profileLocked).toBe(true)
                        // del-on-write: the guard's cached flag must be dropped immediately
                        expect(invalidateProfileLocked).toHaveBeenCalledWith(user.id)
                    })

                it("skips the invalidation call when profileLocked was not part of the request",
                    async () => {
                        const user = await seedUser("kc-update-no-lock-touch")

                        await updateProfileResolver.execute(
                            {
                                workMode: WorkMode.Remote,
                            },
                            user,
                        )

                        expect(invalidateProfileLocked).not.toHaveBeenCalled()

                        const reloaded = await entityManager.findOneByOrFail(UserEntity,
                            {
                                id: user.id,
                            })
                        expect(reloaded.workMode).toBe(WorkMode.Remote)
                    })
            })

        describe("setKpiTarget",
            () => {
                it("persists the clamped target into the weekly_kpi_targets jsonb map",
                    async () => {
                        const user = await seedUser("kc-kpi-clamp")

                        // StudyDays caps at 7 -- a wildly over-large request must clamp down
                        await setKpiTargetResolver.execute(
                            {
                                key: KpiKey.StudyDays,
                                target: 100,
                            },
                            user,
                        )

                        const reloaded = await entityManager.findOneByOrFail(UserEntity,
                            {
                                id: user.id,
                            })
                        expect(Number(reloaded.weeklyKpiTargets[KpiKey.StudyDays]))
                            .toBe(KPI_TARGET_MAX[KpiKey.StudyDays])
                    })

                it("truncates + clamps a negative target down to 0 and does not touch other KPI keys",
                    async () => {
                        const user = await seedUser("kc-kpi-negative")
                        await setKpiTargetResolver.execute(
                            {
                                key: KpiKey.Lessons,
                                target: 20,
                            },
                            user,
                        )

                        await setKpiTargetResolver.execute(
                            {
                                key: KpiKey.Challenges,
                                target: -5,
                            },
                            user,
                        )

                        const reloaded = await entityManager.findOneByOrFail(UserEntity,
                            {
                                id: user.id,
                            })
                        expect(Number(reloaded.weeklyKpiTargets[KpiKey.Challenges])).toBe(0)
                        // the earlier jsonb_set for a DIFFERENT key must survive (atomic merge,
                        // not a clobbering overwrite of the whole column)
                        expect(Number(reloaded.weeklyKpiTargets[KpiKey.Lessons])).toBe(20)
                    })

                it("lowers this week's anti-gaming floor row to the newly clamped target",
                    async () => {
                        const user = await seedUser("kc-kpi-floor")

                        await setKpiTargetResolver.execute(
                            {
                                key: KpiKey.Coding,
                                target: 50,
                            },
                            user,
                        )

                        const floor = await entityManager.findOneOrFail(
                            KpiWeeklyRewardFloorEntity,
                            {
                                where: {
                                    userId: user.id,
                                    kpiKey: KpiKey.Coding,
                                },
                            },
                        )
                        expect(floor.floorTarget).toBe(50)

                        // a SECOND, lower target this same week must pull the floor DOWN...
                        await setKpiTargetResolver.execute(
                            {
                                key: KpiKey.Coding,
                                target: 10,
                            },
                            user,
                        )
                        const loweredFloor = await entityManager.findOneOrFail(
                            KpiWeeklyRewardFloorEntity,
                            {
                                where: {
                                    userId: user.id,
                                    kpiKey: KpiKey.Coding,
                                },
                            },
                        )
                        expect(loweredFloor.floorTarget).toBe(10)

                        // ...but a THIRD, HIGHER target must never raise it back up
                        // (LEAST-only -- the anti-gaming guarantee)
                        await setKpiTargetResolver.execute(
                            {
                                key: KpiKey.Coding,
                                target: 80,
                            },
                            user,
                        )
                        const stillLowered = await entityManager.findOneOrFail(
                            KpiWeeklyRewardFloorEntity,
                            {
                                where: {
                                    userId: user.id,
                                    kpiKey: KpiKey.Coding,
                                },
                            },
                        )
                        expect(stillLowered.floorTarget).toBe(10)
                    })

                it("clearing a target to 0 skips the floor write entirely (no row created)",
                    async () => {
                        const user = await seedUser("kc-kpi-clear-no-floor")

                        await setKpiTargetResolver.execute(
                            {
                                key: KpiKey.Milestones,
                                target: 0,
                            },
                            user,
                        )

                        const floor = await entityManager.findOne(
                            KpiWeeklyRewardFloorEntity,
                            {
                                where: {
                                    userId: user.id,
                                    kpiKey: KpiKey.Milestones,
                                },
                            },
                        )
                        expect(floor).toBeNull()

                        const reloaded = await entityManager.findOneByOrFail(UserEntity,
                            {
                                id: user.id,
                            })
                        expect(Number(reloaded.weeklyKpiTargets[KpiKey.Milestones])).toBe(0)
                    })
            })

        describe("connectGithubAccount",
            () => {
                afterEach(() => {
                    getByUsernameMock.mockReset()
                })

                it("verifies the username against GitHub and persists it on the real user row",
                    async () => {
                        const user = await seedUser("kc-github-connect",
                            {
                                githubUsername: null,
                            })
                        getByUsernameMock.mockResolvedValueOnce({
                            data: {
                                login: "octocat",
                            },
                        })

                        const result = await connectGithubAccountHandler.execute(
                            new ConnectGithubAccountCommand({
                                user,
                                input: {
                                    githubUsername: "octocat",
                                },
                            }),
                        )

                        expect(getByUsernameMock).toHaveBeenCalledWith({
                            username: "octocat",
                        })
                        expect(result.githubUsername).toBe("octocat")

                        const reloaded = await entityManager.findOneByOrFail(UserEntity,
                            {
                                id: user.id,
                            })
                        expect(reloaded.githubUsername).toBe("octocat")
                    })

                it("a 404 from GitHub rejects and leaves the real row untouched",
                    async () => {
                        const user = await seedUser("kc-github-404",
                            {
                                githubUsername: null,
                            })
                        getByUsernameMock.mockRejectedValueOnce(
                            new Error("HttpError: 404 Not Found"),
                        )

                        await expect(
                            connectGithubAccountHandler.execute(
                                new ConnectGithubAccountCommand({
                                    user,
                                    input: {
                                        githubUsername: "ghost-user",
                                    },
                                }),
                            ),
                        ).rejects.toBeInstanceOf(GithubUserNotFoundException)

                        const reloaded = await entityManager.findOneByOrFail(UserEntity,
                            {
                                id: user.id,
                            })
                        expect(reloaded.githubUsername).toBeNull()
                    })
            })
    })
