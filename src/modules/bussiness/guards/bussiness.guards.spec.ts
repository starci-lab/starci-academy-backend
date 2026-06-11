import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    BadRequestException,
    ForbiddenException,
    UnauthorizedException,
} from "@nestjs/common"
import {
    MountStorageService,
} from "@modules/filesystem"
import {
    AdminAccessGuard,
} from "./admin-access.guard"
import {
    GraphQLMustEnrolledGuard,
} from "./graphql-must-enrolled.guard"
import {
    UserService,
} from "../user"
import type {
    ExecutionContext,
} from "@nestjs/common"

/** Admin key the mocked mount store hands back on the happy path. */
const ADMIN_API_KEY = "admin-secret-key"

/**
 * Build a REST {@link ExecutionContext} exposing `switchToHttp().getRequest()`
 * — the only surface {@link AdminAccessGuard} reads.
 */
const buildHttpContext = (
    request: Record<string, unknown>,
): ExecutionContext => ({
    switchToHttp: () => ({
        getRequest: () => request,
    }),
}) as unknown as ExecutionContext

/**
 * Build a GraphQL {@link ExecutionContext}. `GqlExecutionContext.create` reads
 * the resolver args via `getArgs()` and exposes `getContext()` as index 2 —
 * the `[root, args, ctx, info]` tuple, with `ctx.req` carrying the request.
 */
const buildGqlContext = (
    request: Record<string, unknown>,
): ExecutionContext => ({
    getArgs: () => [
        undefined,
        undefined,
        {
            req: request,
        },
        undefined,
    ],
    getClass: () => class {
    },
    getHandler: () => () => undefined,
    getType: () => "graphql",
}) as unknown as ExecutionContext

describe("AdminAccessGuard",
    () => {
        let module: TestingModule
        let guard: AdminAccessGuard
        let mountStorageService: Pick<MountStorageService, "adminApiKey">

        beforeEach(async () => {
            // expose adminApiKey as a real getter so the guard can read it
            mountStorageService = {
                get adminApiKey() {
                    return ADMIN_API_KEY
                },
            } as Pick<MountStorageService, "adminApiKey">

            module = await Test.createTestingModule({
                providers: [
                    AdminAccessGuard,
                    {
                        provide: MountStorageService,
                        useValue: mountStorageService,
                    },
                ],
            }).compile()

            guard = module.get<AdminAccessGuard>(AdminAccessGuard)
        })

        afterEach(async () => {
            await module.close()
        })

        it("allows a request carrying the correct admin key",
            () => {
                // header matches the mounted secret → access granted
                const allowed = guard.canActivate(
                    buildHttpContext({
                        headers: {
                            "x-admin-api-key": ADMIN_API_KEY,
                        },
                    }),
                )

                expect(allowed).toBe(true)
            })

        it("normalizes an array-valued header to its first element",
            () => {
                // duplicated headers arrive as an array; the first must match
                const allowed = guard.canActivate(
                    buildHttpContext({
                        headers: {
                            "x-admin-api-key": [
                                ADMIN_API_KEY,
                                "other",
                            ],
                        },
                    }),
                )

                expect(allowed).toBe(true)
            })

        it("throws Unauthorized when the header is absent",
            () => {
                // a missing key is an authentication failure (401)
                expect(() =>
                    guard.canActivate(
                        buildHttpContext({
                            headers: {
                            },
                        }),
                    )).toThrow(UnauthorizedException)
            })

        it("throws Forbidden when the header is present but wrong",
            () => {
                // a wrong key is an authorization failure (403)
                expect(() =>
                    guard.canActivate(
                        buildHttpContext({
                            headers: {
                                "x-admin-api-key": "wrong-key",
                            },
                        }),
                    )).toThrow(ForbiddenException)
            })
    })

describe("GraphQLMustEnrolledGuard",
    () => {
        let module: TestingModule
        let guard: GraphQLMustEnrolledGuard
        let userService: jest.Mocked<Pick<UserService, "checkEnrollment">>

        beforeEach(async () => {
            // enrollment lookup is programmed per-case (enrolled by default)
            userService = {
                checkEnrollment: jest.fn(async () => true),
            } as unknown as jest.Mocked<Pick<UserService, "checkEnrollment">>

            module = await Test.createTestingModule({
                providers: [
                    GraphQLMustEnrolledGuard,
                    {
                        provide: UserService,
                        useValue: userService,
                    },
                ],
            }).compile()

            guard = module.get<GraphQLMustEnrolledGuard>(GraphQLMustEnrolledGuard)
        })

        afterEach(async () => {
            await module.close()
        })

        it("allows an enrolled user for the requested course",
            async () => {
                // user is enrolled → guard passes and checks the right pair
                const allowed = await guard.canActivate(
                    buildGqlContext({
                        user: {
                            id: "user-1",
                        },
                        headers: {
                            "x-course-id": "course-1",
                        },
                    }),
                )

                expect(allowed).toBe(true)
                expect(userService.checkEnrollment).toHaveBeenCalledWith(
                    "user-1",
                    "course-1",
                )
            })

        it("throws BadRequest when the course id header is missing",
            async () => {
                // no course id → cannot evaluate enrollment (400)
                await expect(
                    guard.canActivate(
                        buildGqlContext({
                            user: {
                                id: "user-1",
                            },
                            headers: {
                            },
                        }),
                    ),
                ).rejects.toBeInstanceOf(BadRequestException)
                // enrollment is never queried without a course id
                expect(userService.checkEnrollment).not.toHaveBeenCalled()
            })

        it("throws Forbidden when the user is not enrolled",
            async () => {
                // enrollment check fails → access denied (403)
                userService.checkEnrollment.mockResolvedValueOnce(false)

                await expect(
                    guard.canActivate(
                        buildGqlContext({
                            user: {
                                id: "user-1",
                            },
                            headers: {
                                "x-course-id": "course-1",
                            },
                        }),
                    ),
                ).rejects.toBeInstanceOf(ForbiddenException)
            })

        it("normalizes an array-valued course id header to its first element",
            async () => {
                // duplicated header arrives as an array; first value is used
                const allowed = await guard.canActivate(
                    buildGqlContext({
                        user: {
                            id: "user-1",
                        },
                        headers: {
                            "x-course-id": [
                                "course-1",
                                "course-2",
                            ],
                        },
                    }),
                )

                expect(allowed).toBe(true)
                expect(userService.checkEnrollment).toHaveBeenCalledWith(
                    "user-1",
                    "course-1",
                )
            })
    })
