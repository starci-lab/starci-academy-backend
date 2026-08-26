import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    CvVerificationLevel,
} from "@modules/databases/postgresql/primary/enums/cv-verification-level"
import type {
    EntityManager,
} from "typeorm"
import {
    CvVerificationService,
} from "./cv-verification.service"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

describe("CvVerificationService",
    () => {
        let module: TestingModule
        let service: CvVerificationService
        let entityManager: jest.Mocked<Pick<EntityManager, "query">>

        beforeEach(async () => {
        // only `query` is exercised -- the two existence probes both go through it
            entityManager = {
                query: jest.fn(),
            } as unknown as jest.Mocked<Pick<EntityManager, "query">>

            module = await Test.createTestingModule({
                providers: [
                    CvVerificationService,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            service = module.get<CvVerificationService>(CvVerificationService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("resolveLevels",
            () => {
                it("returns an empty map and hits no query for an empty batch",
                    async () => {
                        const levels = await service.resolveLevels({
                            userIds: [],
                        })

                        expect(levels.size).toBe(0)
                        expect(entityManager.query).not.toHaveBeenCalled()
                    })

                it("classifies a passed-capstone user as CapstoneVerified",
                    async () => {
                        entityManager.query
                            .mockResolvedValueOnce([{
                                user_id: "u1",
                            }])
                            .mockResolvedValueOnce([])

                        const levels = await service.resolveLevels({
                            userIds: ["u1"],
                        })

                        expect(levels.get("u1")).toBe(CvVerificationLevel.CapstoneVerified)
                    })

                it("classifies a graded-challenge-only user as ActivityBacked",
                    async () => {
                        entityManager.query
                            .mockResolvedValueOnce([])
                            .mockResolvedValueOnce([{
                                user_id: "u2",
                            }])

                        const levels = await service.resolveLevels({
                            userIds: ["u2"],
                        })

                        expect(levels.get("u2")).toBe(CvVerificationLevel.ActivityBacked)
                    })

                it("classifies a user with no graded StarCi work as SelfReported",
                    async () => {
                        entityManager.query
                            .mockResolvedValueOnce([])
                            .mockResolvedValueOnce([])

                        const levels = await service.resolveLevels({
                            userIds: ["u3"],
                        })

                        expect(levels.get("u3")).toBe(CvVerificationLevel.SelfReported)
                    })

                it("lets a passed capstone win over graded challenge for the same user",
                    async () => {
                        entityManager.query
                            .mockResolvedValueOnce([{
                                user_id: "u4",
                            }])
                            .mockResolvedValueOnce([{
                                user_id: "u4",
                            }])

                        const levels = await service.resolveLevels({
                            userIds: ["u4"],
                        })

                        expect(levels.get("u4")).toBe(CvVerificationLevel.CapstoneVerified)
                    })

                it("classifies a mixed batch, defaulting the unmatched user to SelfReported",
                    async () => {
                        entityManager.query
                            .mockResolvedValueOnce([{
                                user_id: "u1",
                            }])
                            .mockResolvedValueOnce([{
                                user_id: "u2",
                            }])

                        const levels = await service.resolveLevels({
                            userIds: ["u1",
                                "u2",
                                "u3"],
                        })

                        expect(levels.get("u1")).toBe(CvVerificationLevel.CapstoneVerified)
                        expect(levels.get("u2")).toBe(CvVerificationLevel.ActivityBacked)
                        expect(levels.get("u3")).toBe(CvVerificationLevel.SelfReported)
                    })
            })

        describe("resolveLevel",
            () => {
                it("returns the single user's level via the batch path",
                    async () => {
                        entityManager.query
                            .mockResolvedValueOnce([{
                                user_id: "solo",
                            }])
                            .mockResolvedValueOnce([])

                        const level = await service.resolveLevel("solo")

                        expect(level).toBe(CvVerificationLevel.CapstoneVerified)
                    })
            })

        describe("scoreOf and rankOf",
            () => {
                it("scores only capstones and orders every verification level",
                    () => {
                        expect(service.scoreOf(CvVerificationLevel.CapstoneVerified)).toBe(100)
                        expect(service.scoreOf(CvVerificationLevel.ActivityBacked)).toBe(0)
                        expect(service.scoreOf(CvVerificationLevel.SelfReported)).toBe(0)
                        expect(service.rankOf(CvVerificationLevel.CapstoneVerified)).toBe(2)
                        expect(service.rankOf(CvVerificationLevel.ActivityBacked)).toBe(1)
                        expect(service.rankOf(CvVerificationLevel.SelfReported)).toBe(0)
                    })
            })

        describe("resolveLevelForCourse",
            () => {
                it("prioritizes a passed capstone within the requested course",
                    async () => {
                        entityManager.query
                            .mockResolvedValueOnce([{
                                user_id: "u1",
                            }])
                            .mockResolvedValueOnce([{
                                user_id: "u1",
                            }])

                        await expect(service.resolveLevelForCourse({
                            userId: "u1",
                            courseId: "course-1",
                        })).resolves.toBe(CvVerificationLevel.CapstoneVerified)
                    })

                it("returns activity-backed or self-reported when the course probes lack a capstone",
                    async () => {
                        entityManager.query
                            .mockResolvedValueOnce([])
                            .mockResolvedValueOnce([{
                                user_id: "u2",
                            }])
                        await expect(service.resolveLevelForCourse({
                            userId: "u2",
                            courseId: "course-2",
                        })).resolves.toBe(CvVerificationLevel.ActivityBacked)

                        entityManager.query
                            .mockResolvedValueOnce([])
                            .mockResolvedValueOnce([])
                        await expect(service.resolveLevelForCourse({
                            userId: "u3",
                            courseId: "course-3",
                        })).resolves.toBe(CvVerificationLevel.SelfReported)
                    })
            })
    })
