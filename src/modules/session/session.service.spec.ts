import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    UnauthorizedException,
} from "@nestjs/common"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    createIoRedisKey,
    IoRedisInstanceKey,
} from "@modules/native"
import {
    CookieService,
} from "@modules/cookie"
import {
    LoginSessionNotFoundException,
} from "@modules/exceptions"
import {
    SessionService,
} from "./session.service"
import {
    parseUserAgent,
} from "./utils"
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
                        // only one existing device → still room for one more
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
                        ).rejects.toBeInstanceOf(UnauthorizedException)
                    })

                it("fails open when no managed session exists",
                    async () => {
                        // empty hash → nothing to enforce (rollout safety)
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
            })
    })
