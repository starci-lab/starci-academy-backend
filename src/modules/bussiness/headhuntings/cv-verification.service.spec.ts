import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    CvVerificationLevel,
} from "@modules/databases"
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
        // only `query` is exercised — the two existence probes both go through it
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
                        // no users → the service must short-circuit before any DB round-trip
                        const levels = await service.resolveLevels({
                            userIds: [] 
                        })

                        expect(levels.size).toBe(0)
                        expect(entityManager.query).not.toHaveBeenCalled()
                    })

                it("classifies a passed-capstone user as CapstoneVerified",
                    async () => {
                        // probe order is capstone-first, challenge-second (Promise.all array order)
                        entityManager.query
                            .mockResolvedValueOnce([{
                                user_id: "u1" 
                            }])
                            .mockResolvedValueOnce([])

                        const levels = await service.resolveLevels({
                            userIds: ["u1"] 
                        })

                        expect(levels.get("u1")).toBe(CvVerificationLevel.CapstoneVerified)
                    })

                it("classifies a graded-challenge-only user as ActivityBacked",
                    async () => {
                        // absent from the capstone set, present in the challenge set
                        entityManager.query
                            .mockResolvedValueOnce([])
                            .mockResolvedValueOnce([{
                                user_id: "u2" 
                            }])

                        const levels = await service.resolveLevels({
                            userIds: ["u2"] 
                        })

                        expect(levels.get("u2")).toBe(CvVerificationLevel.ActivityBacked)
                    })

                it("classifies a user with no graded StarCi work as SelfReported",
                    async () => {
                        // absent from both probes → the CV rests on self-reported claims only
                        entityManager.query
                            .mockResolvedValueOnce([])
                            .mockResolvedValueOnce([])

                        const levels = await service.resolveLevels({
                            userIds: ["u3"] 
                        })

                        expect(levels.get("u3")).toBe(CvVerificationLevel.SelfReported)
                    })

                it("lets a passed capstone win over graded challenge for the same user",
                    async () => {
                        // user appears in BOTH sets — capstone is the stronger, decisive signal
                        entityManager.query
                            .mockResolvedValueOnce([{
                                user_id: "u4" 
                            }])
                            .mockResolvedValueOnce([{
                                user_id: "u4" 
                            }])

                        const levels = await service.resolveLevels({
                            userIds: ["u4"] 
                        })

                        expect(levels.get("u4")).toBe(CvVerificationLevel.CapstoneVerified)
                    })

                it("classifies a mixed batch, defaulting the unmatched user to SelfReported",
                    async () => {
                        // u1 passed a capstone, u2 has graded challenge work, u3 has neither
                        entityManager.query
                            .mockResolvedValueOnce([{
                                user_id: "u1" 
                            }])
                            .mockResolvedValueOnce([{
                                user_id: "u2" 
                            }])

                        const levels = await service.resolveLevels({
                            userIds: ["u1",
                                "u2",
                                "u3"] 
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
                                user_id: "solo" 
                            }])
                            .mockResolvedValueOnce([])

                        const level = await service.resolveLevel("solo")

                        expect(level).toBe(CvVerificationLevel.CapstoneVerified)
                    })
            })

        describe("rankOf",
            () => {
                it("orders capstone above activity above self-reported",
                    () => {
                        // the tiebreak comparator relies on this strict ordering
                        expect(service.rankOf(CvVerificationLevel.CapstoneVerified)).toBeGreaterThan(
                            service.rankOf(CvVerificationLevel.ActivityBacked),
                        )
                        expect(service.rankOf(CvVerificationLevel.ActivityBacked)).toBeGreaterThan(
                            service.rankOf(CvVerificationLevel.SelfReported),
                        )
                    })
            })
    })
