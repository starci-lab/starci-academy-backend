import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    createIoRedisKey,
} from "@modules/lib/native/ioredis/constants"
import {
    IoRedisInstanceKey,
} from "@modules/lib/native/ioredis/enums/instance-key"
import {
    CookieService,
} from "@modules/platform/cookie/cookie.service"
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness/jobs/enqueue/send-mail.service"
import {
    LoginSessionNotFoundException,
} from "@modules/platform/exceptions/errors/session/session-not-found"
import {
    SessionSupersededException,
} from "@modules/platform/exceptions/errors/session/session-superseded"
import {
    SessionService,
} from "./session.service"
import {
    parseUserAgent,
} from "./utils/parse-device-info"
import type {
    Redis,
} from "ioredis"
import type {
    EntityManager,
} from "typeorm"
import type {
    Request,
    Response,
} from "express"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * Builds a decode-only JWT (no signature) whose payload carries the given
 * subject, mirroring what the service decodes off real Keycloak tokens.
 */
const makeToken = (sub: string): string => {
    const encode = (obj: Record<string, unknown>): string =>
        Buffer.from(JSON.stringify(obj)).toString("base64url")
    return `${encode({
        alg: "none", typ: "JWT"
    })}.${encode({
        sub
    })}.sig`
}

describe("SessionService",
    () => {
        let module: TestingModule
        let service: SessionService
        let redis: jest.Mocked<Pick<Redis, "hgetall" | "hset" | "hdel" | "hlen" | "hexists" | "hkeys" | "pexpire" | "del">>
        let entityManager: jest.Mocked<Pick<EntityManager, "find" | "findOne" | "create" | "save" | "update">>
        let cookieService: jest.Mocked<Pick<CookieService, "attachHttpOnlyCookie" | "clearCookie" | "getCookie">>
        let enqueueSendMailJobService: jest.Mocked<Pick<EnqueueSendMailJobService, "enqueue">>

        beforeEach(async () => {
            redis = {
                hgetall: jest.fn(),
                hset: jest.fn(),
                hdel: jest.fn(),
                hlen: jest.fn(),
                hexists: jest.fn(),
                hkeys: jest.fn(),
                pexpire: jest.fn(),
                del: jest.fn(),
            } as unknown as jest.Mocked<typeof redis>

            entityManager = {
                find: jest.fn(),
                findOne: jest.fn(),
                // create echoes the provided partial back as the row
                create: jest.fn((_entity, data) => data),
                save: jest.fn(),
                update: jest.fn(),
            } as unknown as jest.Mocked<typeof entityManager>

            cookieService = {
                attachHttpOnlyCookie: jest.fn(),
                clearCookie: jest.fn(),
                getCookie: jest.fn(),
            } as unknown as jest.Mocked<typeof cookieService>

            enqueueSendMailJobService = {
                enqueue: jest.fn(),
            } as unknown as jest.Mocked<typeof enqueueSendMailJobService>

            module = await Test.createTestingModule({
                providers: [
                    SessionService,
                    {
                        provide: createIoRedisKey(IoRedisInstanceKey.Cache),
                        useValue: redis,
                    },
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                    {
                        provide: CookieService,
                        useValue: cookieService,
                    },
                    {
                        provide: EnqueueSendMailJobService,
                        useValue: enqueueSendMailJobService,
                    },
                ],
            }).compile()

            service = module.get<SessionService>(SessionService)
        })

        afterEach(async () => {
            await module.close()
        })

        /** Minimal Express request stub carrying a user-agent + client IP. */
        const buildRequest = (): Request =>
        ({
            headers: {
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
            },
            ip: "8.8.8.8",
            socket: {
                remoteAddress: "8.8.8.8",
            },
        }) as unknown as Request

        describe("startSession",
            () => {
                it("does nothing when the access token has no subject",
                    async () => {
                        await service.startSession({
                            res: {
                            } as Response,
                            req: buildRequest(),
                            accessToken: makeToken(""),
                        })

                        expect(redis.hgetall).not.toHaveBeenCalled()
                        expect(cookieService.attachHttpOnlyCookie).not.toHaveBeenCalled()
                    })

                it("evicts the oldest session when the account is already at the device limit",
                    async () => {
                        // the account already has two devices (limit is 2)
                        redis.hgetall.mockResolvedValue({
                            "old-session": JSON.stringify({
                                sessionId: "old-session",
                                createdAt: 1000,
                            }),
                            "newer-session": JSON.stringify({
                                sessionId: "newer-session",
                                createdAt: 2000,
                            }),
                        })

                        const res = {
                        } as Response
                        await service.startSession({
                            res,
                            req: buildRequest(),
                            accessToken: makeToken("user-1"),
                        })

                        // the oldest device must be dropped from the enforcement hash...
                        expect(redis.hdel).toHaveBeenCalledWith("session:user-1",
                            "old-session")
                        // ...and its persisted row marked revoked
                        expect(entityManager.update).toHaveBeenCalledWith(
                            expect.anything(),
                            expect.objectContaining({
                                keycloakId: "user-1",
                                sessionId: "old-session",
                            }),
                            expect.objectContaining({
                                revokedAt: expect.any(Date),
                            }),
                        )
                        // a new session is written + TTL slid + cookie attached + row persisted
                        expect(redis.hset).toHaveBeenCalledTimes(1)
                        expect(redis.pexpire).toHaveBeenCalledWith("session:user-1",
                            expect.any(Number))
                        expect(cookieService.attachHttpOnlyCookie).toHaveBeenCalledTimes(1)
                        expect(entityManager.save).toHaveBeenCalledTimes(1)
                    })

                it("adds without eviction when below the device limit",
                    async () => {
                        // only one existing device -> still room for one more
                        redis.hgetall.mockResolvedValue({
                            "only-session": JSON.stringify({
                                sessionId: "only-session",
                                createdAt: 1000,
                            }),
                        })

                        await service.startSession({
                            res: {
                            } as Response,
                            req: buildRequest(),
                            accessToken: makeToken("user-1"),
                        })

                        // nothing evicted; the new session is simply added
                        expect(redis.hdel).not.toHaveBeenCalled()
                        expect(redis.hset).toHaveBeenCalledTimes(1)
                    })

                it("captures device + location facts on the persisted row",
                    async () => {
                        redis.hgetall.mockResolvedValue({
                        })

                        await service.startSession({
                            res: {
                            } as Response,
                            req: buildRequest(),
                            accessToken: makeToken("user-1"),
                        })

                        // the saved row reflects the parsed UA + offline geo lookup of 8.8.8.8
                        expect(entityManager.save).toHaveBeenCalledWith(
                            expect.objectContaining({
                                keycloakId: "user-1",
                                os: "Windows",
                                browser: "Chrome",
                                ipAddress: "8.8.8.8",
                                location: "US",
                            }),
                        )
                    })

                it("alerts a known local user for a new device and tolerates corrupt history",
                    async () => {
                        redis.hgetall
                            .mockResolvedValueOnce({
                                "corrupt-session": "not-json",
                                "older-session": JSON.stringify({
                                    sessionId: "older-session",
                                    createdAt: 1000,
                                }),
                            })
                            .mockResolvedValueOnce({
                                "corrupt-session": "not-json",
                                "older-session": JSON.stringify({
                                    sessionId: "older-session",
                                    createdAt: 1000,
                                }),
                            })
                        entityManager.findOne
                            .mockResolvedValueOnce({
                                id: "local-user"
                            } as never)
                            .mockResolvedValueOnce({
                                id: "local-user",
                                email: "learner@example.test",
                            } as never)

                        await service.startSession({
                            res: {
                            } as Response,
                            req: buildRequest(),
                            accessToken: makeToken("user-1"),
                        })

                        expect(redis.hdel).toHaveBeenCalledWith("session:user-1",
                            "corrupt-session")
                        expect(enqueueSendMailJobService.enqueue).toHaveBeenCalledWith(expect.objectContaining({
                            template: "new-device-signin",
                            to: [
                                {
                                    address: "learner@example.test",
                                },
                            ],
                        }))
                    })

                it("heals a legacy string while adding a session",
                    async () => {
                        redis.hgetall
                            .mockResolvedValueOnce({
                            })
                            .mockRejectedValueOnce(new Error("WRONGTYPE legacy key"))

                        await service.startSession({
                            res: {
                            } as Response,
                            req: buildRequest(),
                            accessToken: makeToken("user-1"),
                        })

                        expect(redis.del).toHaveBeenCalledWith("session:user-1")
                        expect(redis.hset).toHaveBeenCalledTimes(1)
                    })
            })

        describe("assertCurrent",
            () => {
                it("throws when the presented session was evicted",
                    async () => {
                        // the account has active sessions...
                        redis.hlen.mockResolvedValue(2)
                        // ...but the presented id is no longer one of them
                        redis.hexists.mockResolvedValue(0)

                        await expect(
                            service.assertCurrent({
                                userId: "user-1",
                                sessionId: "evicted-session",
                            }),
                        ).rejects.toBeInstanceOf(SessionSupersededException)
                    })

                it("fails open when no managed session exists",
                    async () => {
                        // empty hash -> nothing to enforce (rollout safety)
                        redis.hlen.mockResolvedValue(0)

                        await expect(
                            service.assertCurrent({
                                userId: "user-1",
                                sessionId: undefined,
                            }),
                        ).resolves.toBeUndefined()
                    })

                it("passes when the presented session is still active",
                    async () => {
                        redis.hlen.mockResolvedValue(1)
                        redis.hexists.mockResolvedValue(1)

                        await expect(
                            service.assertCurrent({
                                userId: "user-1",
                                sessionId: "live-session",
                            }),
                        ).resolves.toBeUndefined()
                    })

                it("heals a legacy string key (WRONGTYPE) and fails open",
                    async () => {
                        // a pre-multi-device single-session string key makes the
                        // hash command fail with WRONGTYPE
                        redis.hlen.mockRejectedValue(
                            new Error("WRONGTYPE Operation against a key holding the wrong kind of value"),
                        )

                        await expect(
                            service.assertCurrent({
                                userId: "user-1",
                                sessionId: "anything",
                            }),
                        ).resolves.toBeUndefined()
                        // the stale key is deleted so the next login writes a hash
                        expect(redis.del).toHaveBeenCalledWith("session:user-1")
                    })

                it("rejects a non-WRONGTYPE Redis failure and missing session ids",
                    async () => {
                        redis.hlen.mockResolvedValue(1)
                        await expect(service.assertCurrent({
                            userId: "user-1",
                            sessionId: undefined,
                        })).rejects.toBeInstanceOf(SessionSupersededException)
                        redis.hlen.mockRejectedValue(new Error("redis offline"))
                        await expect(service.assertCurrent({
                            userId: "user-1",
                            sessionId: "session-1",
                        })).rejects.toThrow("redis offline")
                    })
            })

        describe("endSession and listSessions",
            () => {
                it("clears the cookie, removes the current session, and marks it revoked",
                    async () => {
                        cookieService.getCookie.mockReturnValue("session-1")

                        await service.endSession({
                            res: {
                            } as Response,
                            req: {
                            } as Request,
                            refreshToken: makeToken("user-1"),
                        })

                        expect(cookieService.clearCookie).toHaveBeenCalled()
                        expect(redis.hdel).toHaveBeenCalledWith("session:user-1",
                            "session-1")
                        expect(entityManager.update).toHaveBeenCalled()
                    })

                it("heals WRONGTYPE on sign-out and rethrows unrelated Redis errors",
                    async () => {
                        cookieService.getCookie.mockReturnValue("session-1")
                        redis.hdel.mockRejectedValueOnce(new Error("WRONGTYPE legacy key"))

                        await expect(service.endSession({
                            res: {
                            } as Response,
                            req: {
                            } as Request,
                            refreshToken: makeToken("user-1"),
                        })).resolves.toBeUndefined()
                        expect(redis.del).toHaveBeenCalledWith("session:user-1")

                        redis.hdel.mockRejectedValueOnce(new Error("redis offline"))
                        await expect(service.endSession({
                            res: {
                            } as Response,
                            req: {
                            } as Request,
                            refreshToken: makeToken("user-1"),
                        })).rejects.toThrow("redis offline")
                    })

                it("returns active persisted rows and an empty list when none are active",
                    async () => {
                        redis.hkeys.mockResolvedValueOnce([])
                        await expect(service.listSessions({
                            keycloakId: "user-1",
                            currentSessionId: "session-1",
                        })).resolves.toEqual([])

                        redis.hkeys.mockResolvedValueOnce(["session-1"])
                        entityManager.find.mockResolvedValueOnce([{
                            id: "row-1",
                            sessionId: "session-1",
                            deviceType: "desktop",
                            os: "Windows",
                            browser: "Chrome",
                            ipAddress: "8.8.8.8",
                            location: "US",
                            lastSeenAt: 20,
                            createdAt: 10,
                        }] as never)
                        await expect(service.listSessions({
                            keycloakId: "user-1",
                            currentSessionId: "session-1",
                        })).resolves.toEqual([expect.objectContaining({
                            id: "row-1",
                            current: true,
                        })])
                    })

                it("heals WRONGTYPE while listing and propagates other hash failures",
                    async () => {
                        redis.hkeys.mockRejectedValueOnce(new Error("WRONGTYPE legacy key"))
                        await expect(service.listSessions({
                            keycloakId: "user-1",
                        })).resolves.toEqual([])
                        expect(redis.del).toHaveBeenCalledWith("session:user-1")

                        redis.hkeys.mockRejectedValueOnce(new Error("redis offline"))
                        await expect(service.listSessions({
                            keycloakId: "user-1",
                        })).rejects.toThrow("redis offline")
                    })
            })

        describe("revokeSession",
            () => {
                it("removes the session from Redis and stamps the row revoked",
                    async () => {
                        const row = {
                            id: "row-1",
                            sessionId: "target",
                            revokedAt: null as Date | null,
                        }
                        entityManager.findOne.mockResolvedValue(row as never)

                        await service.revokeSession({
                            keycloakId: "user-1",
                            sessionId: "target",
                        })

                        expect(redis.hdel).toHaveBeenCalledWith("session:user-1",
                            "target")
                        expect(row.revokedAt).toBeInstanceOf(Date)
                        expect(entityManager.save).toHaveBeenCalledWith(row)
                    })

                it("throws LoginSessionNotFoundException for an unknown session",
                    async () => {
                        entityManager.findOne.mockResolvedValue(null as never)

                        await expect(
                            service.revokeSession({
                                keycloakId: "user-1",
                                sessionId: "ghost",
                            }),
                        ).rejects.toBeInstanceOf(LoginSessionNotFoundException)
                        // nothing touched when the session does not exist
                        expect(redis.hdel).not.toHaveBeenCalled()
                    })
            })

        describe("parseUserAgent",
            () => {
                it("maps a Windows Chrome user-agent",
                    () => {
                        const info = parseUserAgent(
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
                        )
                        expect(info.os).toBe("Windows")
                        expect(info.browser).toBe("Chrome")
                        expect(info.deviceType).toBe("desktop")
                    })

                it("maps a macOS Safari user-agent",
                    () => {
                        const info = parseUserAgent(
                            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
                        )
                        expect(info.os).toBe("macOS")
                        expect(info.browser).toBe("Safari")
                    })

                it("returns all-null for a missing user-agent",
                    () => {
                        const info = parseUserAgent(undefined)
                        expect(info).toEqual({
                            deviceType: null,
                            os: null,
                            browser: null,
                        })
                    })

                it("falls back to an unknown desktop profile for an unrecognized agent",
                    () => {
                        const info = parseUserAgent("ExampleBot/1.0")

                        expect(info.os).toBeNull()
                        expect(info.browser).toBeNull()
                        expect(info.deviceType).toBe("desktop")
                    })

                it("recognizes a Linux Firefox desktop user-agent",
                    () => {
                        const info = parseUserAgent(
                            "Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0",
                        )

                        expect(info.os).toBe("Linux")
                        expect(info.browser).toBe("Firefox")
                        expect(info.deviceType).toBe("desktop")
                    })
            })

        it("treats missing and corrupt Redis records as absent and decodes valid subjects",
            () => {
                const helpers = service as unknown as {
                    parseRecord: (raw: string | undefined) => unknown
                    extractSubject: (token: string) => string | undefined
                }

                expect(helpers.parseRecord(undefined)).toBeNull()
                expect(helpers.parseRecord("not-json")).toBeNull()
                expect(helpers.parseRecord(JSON.stringify({
                    sessionId: "session-1",
                }))).toEqual({
                    sessionId: "session-1",
                })
                expect(helpers.extractSubject("not-a-token")).toBeUndefined()
                expect(helpers.extractSubject(makeToken("user-1"))).toBe("user-1")
            })

        it("heals WRONGTYPE hash reads while propagating unrelated Redis failures",
            async () => {
                const helpers = service as unknown as {
                    readActiveCount: (key: string) => Promise<number>
                    readSessionMap: (key: string) => Promise<Record<string, string>>
                    readSessionIds: (key: string) => Promise<Array<string>>
                }
                redis.hlen.mockRejectedValueOnce(new Error("WRONGTYPE legacy"))
                await expect(helpers.readActiveCount("sessions:user-1")).resolves.toBe(0)
                expect(redis.del).toHaveBeenCalledWith("sessions:user-1")

                redis.hgetall.mockRejectedValueOnce(new Error("WRONGTYPE legacy"))
                await expect(helpers.readSessionMap("sessions:user-1")).resolves.toEqual({
                })
                redis.hkeys.mockRejectedValueOnce(new Error("WRONGTYPE legacy"))
                await expect(helpers.readSessionIds("sessions:user-1")).resolves.toEqual([])

                redis.hlen.mockRejectedValueOnce(new Error("redis unavailable"))
                await expect(helpers.readActiveCount("sessions:user-1")).rejects.toThrow("redis unavailable")
            })
    })
